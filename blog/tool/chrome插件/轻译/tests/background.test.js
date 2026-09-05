import test from "node:test";
import assert from "node:assert/strict";

let listener, storage = {}, calls = [], handler, broadcasts = [];
globalThis.chrome = {
  storage: { local: { setAccessLevel: async () => {}, get: async key => ({ [key]: storage[key] }),
    set: async value => Object.assign(storage, value), remove: async key => { delete storage[key]; } } },
  tabs: { query: async () => [{ id: 1 }, { id: 2 }], sendMessage: async (tab, message) => { broadcasts.push({ tab, message }); } },
  runtime: { id: "test", getURL: path => `chrome-extension://test/${path}`,
    onMessage: { addListener(fn) { listener = fn; } }, onInstalled: { addListener() {} }, openOptionsPage: async () => {} },
  contextMenus: { onClicked: { addListener() {} } }
};
globalThis.fetch = async (url, options) => { calls.push({ url, options }); return handler(url, options); };
await import("../background.js");
const model = id => ({ id, name: id, context: 100000, maxOutput: 4096, parameters: [] });
const sender = { id: "test", url: "https://example.com", tab: { id: 1 }, frameId: 0 };
const settingsSender = { id: "test", url: "chrome-extension://test/settings.html", tab: { id: 2 } };
const message = (value, source = sender) => new Promise(resolve => listener(value, source, resolve));
const response = (status, body) => ({ ok: status === 200, status, json: async () => body });
function reset() {
  calls = []; broadcasts = []; storage = { settings: { apiKey: "test-key", model: "auto", direction: "auto" },
    catalog: { models: [model("top:free"), model("second:free")], updatedAt: Date.now() } };
}
test("限流后按排名切换免费模型并返回实际模型", async () => {
  reset();
  handler = async () => calls.length === 1 ? response(429, { error: { code: 429 } }) : response(200, { choices: [{ message: { content: "你好" } }] });
  const result = await message({ type: "TRANSLATE", text: "hello" });
  assert.equal(result.ok, true); assert.equal(result.data.modelId, "second:free");
  assert.equal(JSON.parse(calls[0].options.body).model, "top:free");
  assert.equal(calls.length, 2);
});
test("无效密钥不重复请求", async () => {
  reset(); handler = async () => response(401, { error: { code: 401 } });
  assert.equal((await message({ type: "TRANSLATE", text: "hello" })).ok, false);
  assert.equal(calls.length, 1);
});
test("网页不能读取或修改密钥，设置页可以保存", async () => {
  reset();
  assert.equal((await message({ type: "GET_SETTINGS" })).ok, false);
  assert.equal((await message({ type: "SAVE_SETTINGS", settings: {} })).ok, false);
  assert.equal((await message({ type: "SAVE_SETTINGS", settings: { apiKey: "new", model: "auto", direction: "en" } }, settingsSender)).ok, true);
  assert.equal(storage.settings.apiKey, "new");
});
test("过期目录必须刷新，指定模型不再免费时停止", async () => {
  reset(); storage.catalog.updatedAt = 0; storage.settings.model = "top:free";
  handler = async () => response(200, { data: [{ id: "other:free", pricing: { prompt: "0", completion: "0" }, architecture: { input_modalities: ["text"], output_modalities: ["text"] } }] });
  const result = await message({ type: "TRANSLATE", text: "hello" });
  assert.equal(result.ok, false); assert.match(result.error, /不再免费/);
  assert.equal(calls.length, 1); assert.match(calls[0].url, /sort=top-weekly/);
});
test("长文本和缺少密钥在请求前阻止", async () => {
  reset(); assert.equal((await message({ type: "TRANSLATE", text: "x".repeat(6001) })).ok, false);
  storage.settings.apiKey = "";
  assert.equal((await message({ type: "TRANSLATE", text: "hello" })).ok, false);
  assert.equal(calls.length, 0);
});
test("取消请求中止网络调用", async () => {
  reset(); let started;
  const ready = new Promise(resolve => { started = resolve; });
  handler = (url, options) => new Promise((resolve, reject) => {
    options.signal.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError")));
    started();
  });
  const translating = message({ type: "TRANSLATE", text: "hello" });
  await ready; await message({ type: "CANCEL" });
  const result = await translating;
  assert.equal(result.ok, false); assert.match(result.error, /取消/); assert.equal(calls.length, 1);
});
test("截断译文不当作成功", async () => {
  reset(); handler = async () => response(200, { choices: [{ finish_reason: "length", message: { content: "partial" } }] });
  const result = await message({ type: "TRANSLATE", text: "hello" });
  assert.equal(result.ok, false); assert.match(result.error, /上限/);
});

test("已译标记与持久记录：重载 worker 后离线复用，不要求密钥或刷新目录", async () => {
  reset(); handler = async () => response(200, { choices: [{ message: { content: "你好" } }] });
  assert.equal((await message({ type: "LOOKUP", text: "hello" })).data.translated, false);
  const first = await message({ type: "TRANSLATE", text: "hello" });
  assert.equal(first.data.cached, false);
  assert.equal((await message({ type: "LOOKUP", text: "hello" })).data.translated, true);
  await import("../background.js?restart");
  storage.settings.apiKey = ""; storage.catalog.updatedAt = 0;
  handler = async () => { throw new Error("不应访问网络"); };
  const again = await message({ type: "TRANSLATE", text: "  hello  " }, { ...sender, tab: { id: 9 } });
  assert.equal(again.data.text, "你好"); assert.equal(again.data.cached, true);
  assert.equal(calls.length, 1);
});

test("更新绕过记录，成功后替换，失败保留旧译文", async () => {
  reset(); let translated = "第一次";
  handler = async () => response(200, { choices: [{ message: { content: translated } }] });
  await message({ type: "TRANSLATE", text: "hello" });
  translated = "更新后";
  const updated = await message({ type: "TRANSLATE", text: "hello", force: true });
  assert.equal(updated.data.text, "更新后"); assert.equal(updated.data.cached, false);
  assert.equal(calls.length, 2);
  handler = async () => response(401, { error: { code: 401 } });
  assert.equal((await message({ type: "TRANSLATE", text: "hello", force: true })).ok, false);
  assert.equal((await message({ type: "TRANSLATE", text: "hello" })).data.text, "更新后");
  assert.equal(calls.length, 3);
});

test("不同目标语言分别保存，切换模型复用已有译文", async () => {
  reset(); handler = async () => response(200, { choices: [{ message: { content: "translation" } }] });
  await message({ type: "TRANSLATE", text: "hello", direction: "zh" });
  assert.equal((await message({ type: "LOOKUP", text: "hello", direction: "en" })).data.translated, false);
  await message({ type: "TRANSLATE", text: "hello", direction: "en" });
  storage.settings.model = "no-longer-free";
  assert.equal((await message({ type: "TRANSLATE", text: "hello", direction: "zh" })).data.cached, true);
  assert.equal(calls.length, 2);
});

test("记录容量上限为 200，移除最早保存记录", async () => {
  reset(); handler = async () => response(200, { choices: [{ message: { content: "translation" } }] });
  for (let i = 0; i < 201; i++) await message({ type: "TRANSLATE", text: `paragraph ${i}` });
  assert.equal(Object.keys(storage.translations).length, 200);
  assert.equal((await message({ type: "LOOKUP", text: "paragraph 0" })).data.translated, false);
  assert.equal((await message({ type: "LOOKUP", text: "paragraph 200" })).data.translated, true);
});

test("高亮按页面保存和隔离，更新译文保留位置", async () => {
  reset(); handler = async () => response(200, { choices: [{ message: { content: "你好" } }] });
  await message({ type: "TRANSLATE", text: "hello" });
  const anchor = { start: [0, 0], end: [0, 0], startOffset: 0, endOffset: 5, quote: "hello" };
  assert.equal((await message({ type: "SAVE_MARK", text: "hello", target: "zh", anchor })).ok, true);
  assert.equal((await message({ type: "GET_MARKS" })).data.marks.length, 1);
  assert.equal((await message({ type: "GET_MARKS" }, { ...sender, url: "https://example.com/another" })).data.marks.length, 0);
  assert.equal((await message({ type: "GET_MARKS", page: "https://other.com" })).ok, false);
  await message({ type: "TRANSLATE", text: "hello", force: true });
  assert.equal((await message({ type: "GET_MARKS" })).data.marks.length, 1);
  assert.equal((await message({ type: "TRANSLATE", text: "hello" })).data.marks, undefined);
  assert.equal((await message({ type: "SAVE_MARK", text: "missing", target: "zh", anchor })).ok, false);
  assert.equal((await message({ type: "SAVE_MARK", text: "hello", target: "zh", anchor: { ...anchor, start: [-1] } })).ok, false);
});

test("已淘汰高亮点击只读缓存，不自动发起翻译", async () => {
  reset();
  const result = await message({ type: "TRANSLATE", text: "hello", cachedOnly: true });
  assert.equal(result.ok, false); assert.match(result.error, /更新/);
  assert.equal(calls.length, 0);
});

test("清除兼容旧记录，保留设置与模型目录并通知全部标签页", async () => {
  reset();
  storage.translations = { old: { text: "旧版本译文", target: "zh" }, newer: { text: "新译文", marks: [{ source: "original" }] } };
  const originalSettings = structuredClone(storage.settings), originalCatalog = structuredClone(storage.catalog);
  assert.equal((await message({ type: "CLEAR_HISTORY" }, { id: "test", url: "https://example.com" })).ok, false);
  assert.equal((await message({ type: "CLEAR_HISTORY" }, settingsSender)).ok, true);
  assert.equal(storage.translations, undefined);
  assert.deepEqual(storage.settings, originalSettings); assert.deepEqual(storage.catalog, originalCatalog);
  assert.equal(broadcasts.length, 2);
  assert.equal(broadcasts[0].message.type, "HISTORY_CLEARED");
  assert.equal((await message({ type: "CLEAR_HISTORY" }, settingsSender)).ok, true);
});

test("清除中止正在翻译的请求，旧响应不会重新写入记录", async () => {
  reset(); let started, finish;
  const ready = new Promise(resolve => { started = resolve; });
  handler = () => new Promise(resolve => { finish = () => resolve(response(200, { choices: [{ message: { content: "迟到的译文" } }] })); started(); });
  const translating = message({ type: "TRANSLATE", text: "hello" });
  await ready;
  assert.equal((await message({ type: "CLEAR_HISTORY" }, settingsSender)).ok, true);
  finish();
  assert.equal((await translating).ok, false);
  assert.equal(storage.translations, undefined);
});

test("浮窗清除当前翻译只删除当前方向，其他记录不变", async () => {
  reset(); handler = async () => response(200, { choices: [{ message: { content: "translation" } }] });
  await message({ type: "TRANSLATE", text: "hello", direction: "zh" });
  await message({ type: "TRANSLATE", text: "hello", direction: "en" });
  await message({ type: "TRANSLATE", text: "another", direction: "zh" });
  assert.equal((await message({ type: "CLEAR_TRANSLATION", text: "hello", target: "zh" })).ok, true);
  assert.equal((await message({ type: "LOOKUP", text: "hello", direction: "zh" })).data.translated, false);
  assert.equal((await message({ type: "LOOKUP", text: "hello", direction: "en" })).data.translated, true);
  assert.equal((await message({ type: "LOOKUP", text: "another", direction: "zh" })).data.translated, true);
  assert.equal(broadcasts[0].message.type, "TRANSLATION_CLEARED");
  assert.equal(storage.settings.apiKey, "test-key");
  assert.equal((await message({ type: "CLEAR_TRANSLATION", text: "hello", target: "invalid" })).ok, false);
  assert.equal((await message({ type: "CLEAR_HISTORY" })).ok, true);
  assert.equal(storage.translations, undefined);
});
