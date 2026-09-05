import { MODELS_URL, MAX_CHARS, DEFAULTS, freeModels, targetLanguage, translationBody } from "./core.js";

const TTL = 60 * 60 * 1000;
const jobs = new Map();
let refreshJob;
let historyWrite = Promise.resolve();
let historyEpoch = 0;
// Keys and catalog are only accessible from extension pages and this worker.
const storageReady = chrome.storage.local.setAccessLevel({ accessLevel: "TRUSTED_CONTEXTS" });

async function settings() {
  await storageReady;
  return { ...DEFAULTS, ...(await chrome.storage.local.get("settings")).settings };
}

async function translationKey(text, target) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(JSON.stringify([text, target])));
  return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, "0")).join("");
}

async function savedTranslation(text, target) {
  await storageReady;
  await historyWrite;
  const { translations = {} } = await chrome.storage.local.get("translations");
  return translations[await translationKey(text, target)] || null;
}

function rememberTranslation(text, result) {
  const write = historyWrite.then(async () => {
    const { translations = {} } = await chrome.storage.local.get("translations");
    const key = await translationKey(text, result.target);
    const marks = translations[key]?.marks;
    delete translations[key];
    translations[key] = { ...result, ...(marks ? { marks } : {}) };
    // Bound local storage; retain the 200 most recently saved translations.
    const keys = Object.keys(translations);
    while (keys.length > 200 || new TextEncoder().encode(JSON.stringify(translations)).length > 3 * 1024 * 1024) {
      delete translations[keys.shift()];
    }
    await chrome.storage.local.set({ translations });
  });
  historyWrite = write.catch(() => {});
  return write;
}

async function pageKey(sender, page) {
  const url = new URL(page || sender.url);
  const actual = new URL(sender.url);
  if (!sender.tab || !["http:", "https:"].includes(url.protocol) || url.origin !== actual.origin) throw new Error("无效页面。");
  return translationKey(url.href, "page");
}

async function saveMark(message, sender) {
  const epoch = historyEpoch;
  const { anchor, target } = message;
  const text = typeof message.text === "string" ? message.text.trim() : "";
  const validPath = path => Array.isArray(path) && path.length <= 80 && path.every(n => Number.isInteger(n) && n >= 0);
  if (!text || text.length > MAX_CHARS || !["zh", "en"].includes(target) ||
    !anchor || typeof anchor.quote !== "string" || !anchor.quote.trim() || anchor.quote.length > 12000 ||
    !validPath(anchor.start) || !validPath(anchor.end) ||
    !Number.isInteger(anchor.startOffset) || anchor.startOffset < 0 ||
    !Number.isInteger(anchor.endOffset) || anchor.endOffset < 0) throw new Error("无效高亮位置。");
  const page = await pageKey(sender, message.page);
  const key = await translationKey(text, target);
  await storageReady;
  const write = historyWrite.then(async () => {
    if (epoch !== historyEpoch) throw new Error("翻译记录已清除。");
    const { translations = {} } = await chrome.storage.local.get("translations");
    const entry = translations[key];
    if (!entry) throw new Error("译文记录已移除，请重新翻译。");
    const mark = { page, source: text, target, anchor: { start: anchor.start, end: anchor.end,
      startOffset: anchor.startOffset, endOffset: anchor.endOffset, quote: anchor.quote } };
    entry.marks = [...(entry.marks || []).filter(m => m.page !== page || JSON.stringify(m.anchor) !== JSON.stringify(mark.anchor)), mark].slice(-8);
    // Anchors share the same bounded storage budget as their translations.
    const keys = Object.keys(translations);
    while (new TextEncoder().encode(JSON.stringify(translations)).length > 3 * 1024 * 1024) delete translations[keys.shift()];
    await chrome.storage.local.set({ translations });
  });
  historyWrite = write.catch(() => {});
  await write;
  return {};
}

async function clearHistory() {
  historyEpoch++;
  for (const controller of jobs.values()) controller.abort();
  const write = historyWrite.then(async () => {
    await storageReady;
    // All earlier releases use this same key, including records without marks.
    await chrome.storage.local.remove("translations");
  });
  historyWrite = write.catch(() => {});
  await write;
  const tabs = await chrome.tabs.query({});
  await Promise.allSettled(tabs.filter(tab => tab.id != null).map(tab =>
    chrome.tabs.sendMessage(tab.id, { type: "HISTORY_CLEARED" })));
  return {};
}

async function clearTranslation(message) {
  const text = typeof message.text === "string" ? message.text.trim() : "";
  const target = message.target;
  if (!text || text.length > MAX_CHARS || !["zh", "en"].includes(target)) throw new Error("请选择需要清除的译文。");
  // Abort outstanding work for this passage before removing its stored result.
  for (const controller of jobs.values()) if (controller.source === text) controller.abort();
  const key = await translationKey(text, target);
  const write = historyWrite.then(async () => {
    await storageReady;
    const { translations = {} } = await chrome.storage.local.get("translations");
    delete translations[key];
    await chrome.storage.local.set({ translations });
  });
  historyWrite = write.catch(() => {});
  await write;
  const tabs = await chrome.tabs.query({});
  await Promise.allSettled(tabs.filter(tab => tab.id != null).map(tab =>
    chrome.tabs.sendMessage(tab.id, { type: "TRANSLATION_CLEARED", text, target })));
  return {};
}

async function request(url, options = {}, signal, timeout = 18000) {
  const controller = new AbortController();
  const abort = () => controller.abort();
  if (signal?.aborted) abort();
  signal?.addEventListener("abort", abort, { once: true });
  const timer = setTimeout(abort, timeout);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    const body = await response.json();
    if (!response.ok || body.error) {
      const status = Number(body.error?.code) || response.status;
      const messages = { 401: "API Key 无效，请在设置中检查。", 402: "账户额度不足，请检查 OpenRouter 账户。",
        403: "当前账户或隐私设置不允许使用此模型。", 429: "免费额度或请求频率受限，请稍后重试。" };
      throw Object.assign(new Error(messages[status] || `OpenRouter 请求失败（${status}）。`), { status });
    }
    return body;
  } catch (error) {
    if (signal?.aborted) throw new Error("翻译已取消。");
    if (error.name === "AbortError") throw Object.assign(new Error("模型响应超时，请重试。"), { status: 408 });
    if (error instanceof TypeError) throw Object.assign(new Error("无法连接 OpenRouter，请检查网络。"), { status: 503 });
    throw error;
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener("abort", abort);
  }
}

async function catalog(force = false) {
  await storageReady;
  const { catalog: cached } = await chrome.storage.local.get("catalog");
  if (!force && cached?.models?.length && Date.now() - cached.updatedAt < TTL) return cached;
  if (!refreshJob) refreshJob = (async () => {
    const data = await request(MODELS_URL);
    const models = freeModels(data.data);
    if (!models.length) throw new Error("当前没有可用的免费文本模型，请稍后刷新。");
    const result = { models, updatedAt: Date.now() };
    await chrome.storage.local.set({ catalog: result });
    return result;
  })().finally(() => { refreshJob = null; });
  // Expired pricing must be refreshed before any translation.
  return refreshJob;
}

async function translate(message, signal) {
  const epoch = historyEpoch;
  const prefs = await settings();
  const text = typeof message.text === "string" ? message.text.trim() : "";
  if (!text) throw new Error("请先选中需要翻译的文字。");
  if (text.length > MAX_CHARS) throw new Error(`一次最多翻译 ${MAX_CHARS} 个字符，请缩短选区。`);
  const target = targetLanguage(text, message.direction || prefs.direction);
  if (!message.force) {
    const saved = await savedTranslation(text, target);
    if (signal.aborted) throw new Error("翻译已取消。");
    if (saved) { const { marks, ...result } = saved; return { ...result, cached: true }; }
  }
  if (message.cachedOnly && !message.force) throw new Error("本地译文已移除，点击「更新」重新翻译。");
  if (!prefs.apiKey) throw new Error("请先点击插件图标，填写 OpenRouter API Key。");
  const { models } = await catalog();
  if (signal.aborted) throw new Error("翻译已取消。");
  const selected = models.find(m => m.id === prefs.model);
  if (prefs.model !== "auto" && !selected) throw new Error("指定模型已下线或不再免费，请重新选择模型。");
  const candidates = (selected ? [selected, ...models.filter(m => m.id !== selected.id)] : models)
    .filter(m => !m.context || m.context >= text.length * 2 + 9000).slice(0, 3);
  if (!candidates.length) throw new Error("没有适合当前文本长度的免费模型，请缩短选区。");
  let lastError;
  for (const model of candidates) {
    if (signal.aborted) throw new Error("翻译已取消。");
    try {
      const result = await request("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${prefs.apiKey}` },
        body: JSON.stringify(translationBody(text, target, model))
      }, signal, 25000);
      const choice = result.choices?.[0];
      const output = choice?.message?.content;
      if (choice?.finish_reason === "length") throw Object.assign(new Error("译文达到输出上限，请缩短选区后重试。"), { status: 422 });
      if (typeof output !== "string" || !output.trim()) throw Object.assign(new Error("模型未返回译文，请重试。"), { status: 503 });
      if (signal.aborted) throw new Error("翻译已取消。");
      const translated = { text: output.trim(), model: model.name, modelId: model.id, target, savedAt: Date.now() };
      if (epoch !== historyEpoch) throw new Error("翻译记录已清除。");
      try { await rememberTranslation(text, translated); }
      catch {
        if (signal.aborted || epoch !== historyEpoch) throw new Error("翻译已取消。");
        return { ...translated, cached: false, unsaved: true };
      }
      if (signal.aborted || epoch !== historyEpoch) throw new Error("翻译已取消。");
      return { ...translated, cached: false };
    } catch (error) {
      lastError = error;
      if (signal.aborted || ![403, 404, 408, 429, 500, 502, 503, 504].includes(error.status)) throw error;
    }
  }
  throw lastError;
}

function jobKey(sender) { return `${sender.tab?.id ?? "extension"}:${sender.frameId ?? 0}`; }
function isSettings(sender) { return sender.url === chrome.runtime.getURL("settings.html"); }

async function handle(message, sender) {
  if (!message || typeof message.type !== "string") throw new Error("无效请求。");
  const key = jobKey(sender);
  if (message.type === "CLEAR_HISTORY" || message.type === "CLEAR_TRANSLATION") {
    const contentPage = sender.tab && /^https?:\/\//.test(sender.url || "");
    if (!isSettings(sender) && !contentPage) throw new Error("请从插件界面清除记录。");
    return message.type === "CLEAR_HISTORY" ? clearHistory() : clearTranslation(message);
  }
  if (message.type === "OPEN_SETTINGS") { await chrome.runtime.openOptionsPage(); return {}; }
  if (message.type === "CANCEL") { jobs.get(key)?.abort(); return {}; }
  if (message.type === "SAVE_MARK") return saveMark(message, sender);
  if (message.type === "GET_MARKS") {
    const page = await pageKey(sender, message.page);
    await storageReady; await historyWrite;
    const { translations = {} } = await chrome.storage.local.get("translations");
    return { marks: Object.values(translations).flatMap(entry => (entry.marks || []).filter(mark => mark.page === page)) };
  }
  if (message.type === "LOOKUP") {
    const text = typeof message.text === "string" ? message.text.trim() : "";
    if (!text || text.length > MAX_CHARS) return { translated: false };
    const prefs = await settings();
    const target = targetLanguage(text, message.direction || prefs.direction);
    return { translated: Boolean(await savedTranslation(text, target)) };
  }
  if (message.type === "TRANSLATE") {
    jobs.get(key)?.abort();
    const controller = new AbortController();
    controller.source = typeof message.text === "string" ? message.text.trim() : "";
    jobs.set(key, controller);
    try { return await translate(message, controller.signal); }
    finally { if (jobs.get(key) === controller) jobs.delete(key); }
  }
  if (!isSettings(sender)) throw new Error("此操作只能从插件设置页执行。");
  if (message.type === "GET_SETTINGS") return settings();
  if (message.type === "MODELS") return catalog(Boolean(message.force));
  if (message.type === "SAVE_SETTINGS") {
    const value = message.settings;
    if (!value || typeof value.apiKey !== "string" || typeof value.model !== "string" ||
      !["auto", "zh", "en"].includes(value.direction)) throw new Error("设置格式不正确。");
    await chrome.storage.local.set({ settings: { apiKey: value.apiKey.trim(), model: value.model,
      direction: value.direction } });
    return {};
  }
  throw new Error("未知操作。");
}

chrome.runtime.onMessage.addListener((message, sender, respond) => {
  if (sender.id !== chrome.runtime.id) return false;
  handle(message, sender).then(data => respond({ ok: true, data }), error => respond({ ok: false, error: error.message }));
  return true;
});
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({ id: "translate", title: "用轻译翻译选中文字", contexts: ["selection"], documentUrlPatterns: ["http://*/*", "https://*/*"] });
  });
});
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId !== "translate" || !tab?.id) return;
  chrome.tabs.sendMessage(tab.id, { type: "CONTEXT_TRANSLATE", text: info.selectionText }, { frameId: info.frameId || 0 })
    .catch(() => chrome.runtime.openOptionsPage());
});
