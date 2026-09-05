(() => {
  let host, root, button, panel, output, meta, copy, retry, switchDirection, clearCurrent, clearAll;
  let selected = "", point = { x: 24, y: 24 }, version = 0, target;
  let shownResult = null;
  let selectedRange = null, activeMark = null, pointerStart = null;
  const send = async message => {
    const response = await chrome.runtime.sendMessage(message);
    if (!response?.ok) throw new Error(response?.error || "插件已更新，请刷新网页。");
    return response.data;
  };
  const highlights = globalThis.QingyiHighlights && globalThis.Highlight && CSS.highlights ? new QingyiHighlights(send) : null;
  function make(tag, text, className) {
    const el = document.createElement(tag);
    if (text) el.textContent = text;
    if (className) el.className = className;
    return el;
  }
  function mount() {
    if (host?.isConnected) return;
    host = make("div");
    host.dataset.qingyiUi = "";
    host.style.cssText = "all:initial!important;position:fixed!important;inset:0!important;pointer-events:none!important;z-index:2147483647!important;";
    root = host.attachShadow({ mode: "closed" });
    const style = make("style");
    style.textContent = `
      *{box-sizing:border-box}button{font:inherit;cursor:pointer;border:0}button:focus-visible{outline:3px solid #99b9ff;outline-offset:2px}
      [hidden]{display:none!important}.trigger,.panel{pointer-events:auto;position:fixed;font:14px/1.6 system-ui,-apple-system,"Microsoft YaHei",sans-serif;color:#24304a}
      .trigger{background:#4169e1;color:white;border-radius:12px;padding:7px 13px;box-shadow:0 4px 20px #263b6c33}
      .trigger.saved{background:#258565}
      .panel{width:390px;max-width:calc(100vw - 24px);max-height:calc(100vh - 24px);overflow:auto;background:#fff;border:1px solid #e1e6f0;border-radius:18px;box-shadow:0 14px 60px #17254b30;padding:18px;text-align:left}
      .header,.actions{display:flex;align-items:center;gap:8px}.header{margin-bottom:12px}.brand{font-weight:750;flex:1;color:#365cc7}.badge{font-size:10px;letter-spacing:1px;color:#8590a6}
      .icon{background:#f1f4fa;color:#52617c;border-radius:8px;padding:3px 9px}.label{font-size:11px;color:#8b96aa;margin:12px 0 5px}
      .source{max-height:100px;overflow:auto;color:#7d879a;font-size:12px;white-space:pre-wrap;overflow-wrap:anywhere}
      .output{white-space:pre-wrap;overflow-wrap:anywhere;font-size:15px;line-height:1.85;min-height:40px}.error{color:#b44242}
      .meta{font-size:11px;color:#8590a6;margin:14px 0 10px;overflow-wrap:anywhere}.actions{border-top:1px solid #edf0f6;padding-top:12px;flex-wrap:wrap}.actions button{background:#f0f4ff;color:#4169cc;border-radius:8px;padding:5px 10px;font-size:12px}button:disabled{opacity:.45;cursor:default}
      .cleanup{display:flex;gap:8px;margin-top:10px}.cleanup button{font-size:12px;border-radius:8px;padding:5px 10px;background:transparent;border:1px solid #dfc7bf;color:#a24d3b}
      @media(prefers-color-scheme:dark){.panel{background:#192131;color:#e4eafa;border-color:#35415a}.brand{color:#a6bcff}.icon,.actions button{background:#28354c;color:#bdceff}.source,.meta{color:#a2aec4}.actions{border-color:#35415a}.error{color:#ffaaaa}}
    `;
    root.append(style);
    button = make("button", "译", "trigger");
    button.title = "翻译选中文字";
    button.hidden = true;
    button.addEventListener("pointerdown", e => e.preventDefault());
    button.addEventListener("click", () => run());
    panel = make("section", "", "panel");
    panel.setAttribute("role", "dialog");
    panel.setAttribute("aria-label", "轻译翻译结果");
    panel.hidden = true;
    const header = make("div", "", "header");
    const close = make("button", "×", "icon");
    close.setAttribute("aria-label", "关闭翻译");
    close.onclick = hide;
    header.append(make("span", "轻译", "brand"), make("span", "OPENROUTER FREE", "badge"), close);
    const source = make("div", "", "source");
    source.id = "source";
    output = make("div", "", "output");
    output.setAttribute("aria-live", "polite");
    meta = make("div", "", "meta");
    const actions = make("div", "", "actions");
    copy = make("button", "复制译文");
    copy.onclick = async () => {
      try { await navigator.clipboard.writeText(output.textContent); copy.textContent = "已复制"; }
      catch { meta.textContent = "复制失败，可选中译文手动复制。"; }
    };
    retry = make("button", "更新"); retry.title = "重新请求模型翻译，更新保存的译文";
    retry.onclick = () => run(target, true);
    switchDirection = make("button", "切换方向");
    switchDirection.onclick = () => run(target === "en" ? "zh" : "en");
    const settings = make("button", "设置");
    settings.onclick = () => send({ type: "OPEN_SETTINGS" }).catch(() => { meta.textContent = "请点击工具栏中的插件图标打开设置。"; });
    actions.append(copy, retry, switchDirection, settings);
    const cleanup = make("div", "", "cleanup");
    clearCurrent = make("button", "清除当前翻译");
    clearCurrent.id = "clearCurrent";
    clearCurrent.title = "删除当前原文、当前翻译方向的记录和高亮，其他译文保留";
    clearCurrent.onclick = () => clearFromPanel(false);
    clearAll = make("button", "全部清除");
    clearAll.id = "clearAll";
    clearAll.title = "删除所有网页的全部译文和高亮，不可恢复；保留密钥和设置";
    clearAll.onclick = () => clearFromPanel(true);
    cleanup.append(clearCurrent, clearAll);
    panel.append(header, make("div", "原文", "label"), source, make("div", "译文", "label"), output, meta, actions, cleanup);
    root.append(button, panel);
    document.documentElement.append(host);
  }
  function place(el) {
    const w = el.offsetWidth, h = el.offsetHeight;
    el.style.left = `${Math.max(12, Math.min(point.x, innerWidth - w - 12))}px`;
    el.style.top = `${Math.max(12, Math.min(point.y + 10, innerHeight - h - 12))}px`;
  }
  function hide() {
    version++;
    if (button) button.hidden = true;
    if (panel) panel.hidden = true;
    activeMark = null; highlights?.active(null);
    send({ type: "CANCEL" }).catch(() => {});
  }
  function clearView() {
    hide();
    selected = ""; selectedRange = null; shownResult = null; pointerStart = null; target = undefined;
    if (root) {
      root.getElementById("source").textContent = "";
      output.textContent = ""; meta.textContent = "";
      button.textContent = "译"; button.className = "trigger";
    }
  }
  async function clearFromPanel(all) {
    const source = selected, language = target, current = version;
    clearCurrent.disabled = true; clearAll.disabled = true;
    try {
      await send(all ? { type: "CLEAR_HISTORY" } : { type: "CLEAR_TRANSLATION", text: source, target: language });
      // The worker also broadcasts to other tabs; apply locally if no broadcast arrived.
      if (all) highlights?.clear(); else highlights?.remove(source, language);
      if (version === current) clearView();
    } catch (error) { if (version === current) meta.textContent = `清除失败：${error.message}`; }
    finally { clearAll.disabled = false; clearCurrent.disabled = !selected || !target; }
  }
  async function run(direction, force = false, cachedOnly = false) {
    if (!selected) return;
    mount();
    const current = ++version;
    const previous = force ? shownResult : null;
    const range = selectedRange?.cloneRange();
    const source = selected;
    target = direction;
    button.hidden = true; panel.hidden = false;
    root.getElementById("source").textContent = selected;
    output.className = "output";
    output.textContent = "正在翻译…";
    meta.textContent = cachedOnly ? "正在读取本地译文…" : "优先读取本地译文，需要时请求免费模型。";
    copy.disabled = true; copy.textContent = "复制译文";
    switchDirection.disabled = true; retry.disabled = true;
    clearCurrent.disabled = true;
    place(panel);
    try {
      const data = await send({ type: "TRANSLATE", text: source, direction, force, cachedOnly });
      if (version !== current) return;
      output.textContent = data.text; target = data.target;
      shownResult = data;
      meta.textContent = `${data.unsaved ? "译文未保存（本机存储失败）" : data.cached ? "✓ 已译 · 本地记录" : "✓ 已译 · 已保存"} · ${data.target === "en" ? "→ English" : "→ 简体中文"} · ${data.model}`;
      retry.textContent = "更新";
      copy.disabled = false; switchDirection.disabled = false;
      if (highlights && range && !data.unsaved) {
        try {
          const mark = await highlights.save(range, source, data.target);
          if (version === current) { activeMark = mark; highlights.active(mark); }
        } catch { if (version === current) meta.textContent += " · 高亮位置未保存"; }
      }
    } catch (error) {
      if (version !== current) return;
      if (previous) {
        shownResult = previous; target = previous.target;
        output.textContent = previous.text; copy.disabled = false; switchDirection.disabled = false;
        meta.textContent = `更新失败：${error.message} 已保留原译文。`;
      } else {
        shownResult = null;
        output.classList.add("error"); output.textContent = error.message;
        meta.textContent = "可打开设置检查密钥或刷新模型列表。";
        retry.textContent = cachedOnly ? "更新" : "重试";
      }
    } finally { if (version === current) { retry.disabled = false; clearCurrent.disabled = !target; place(panel); } }
  }
  function selectionText() {
    const active = document.activeElement;
    if (active?.matches("input,textarea,[contenteditable=true]")) return "";
    return window.getSelection()?.toString().trim() || "";
  }
  function selectionChanged(event) {
    if (event.composedPath().includes(host) || (event.type === "pointerup" && event.button !== 0)) return;
    const text = selectionText();
    if (!text) return;
    hide(); selected = text; shownResult = null; target = undefined;
    const selection = window.getSelection();
    selectedRange = selection.rangeCount ? selection.getRangeAt(0).cloneRange() : null;
    const rect = selection.rangeCount ? selection.getRangeAt(0).getBoundingClientRect() : null;
    point = { x: event.clientX ?? rect?.left ?? 24, y: event.clientY ?? rect?.bottom ?? 24 };
    mount();
    button.textContent = "译"; button.className = "trigger"; button.title = "翻译选中文字";
    button.hidden = false; place(button);
    const current = version;
    send({ type: "LOOKUP", text }).then(data => {
      if (version !== current || button.hidden) return;
      if (data.translated) {
        button.textContent = "✓ 已译"; button.className = "trigger saved";
        button.title = "查看已保存的译文，不重复请求模型"; place(button);
      }
    }).catch(() => {});
  }
  document.addEventListener("pointerup", selectionChanged);
  document.addEventListener("keyup", event => { if (event.key === "Shift") selectionChanged(event); });
  document.addEventListener("pointerdown", event => {
    if (event.composedPath().includes(host)) return;
    pointerStart = { x: event.clientX, y: event.clientY, mark: highlights?.hit(event.clientX, event.clientY) };
    if (!pointerStart.mark) hide();
  });
  document.addEventListener("click", event => {
    if (event.composedPath().includes(host) || event.button !== 0 || event.ctrlKey || event.metaKey || event.altKey || event.shiftKey) return;
    const mark = pointerStart?.mark;
    if (!mark || Math.hypot(event.clientX - pointerStart.x, event.clientY - pointerStart.y) > 5 || selectionText()) return;
    if (highlights?.hit(event.clientX, event.clientY) !== mark) return;
    event.preventDefault(); event.stopPropagation();
    if (activeMark === mark && panel && !panel.hidden) { hide(); return; }
    hide(); selected = mark.source; selectedRange = mark.range.cloneRange(); shownResult = null;
    point = { x: event.clientX, y: event.clientY };
    activeMark = mark; highlights.active(mark); run(mark.target, false, true);
  }, true);
  document.addEventListener("keydown", event => { if (event.key === "Escape") hide(); });
  window.addEventListener("resize", () => { if (panel && !panel.hidden) place(panel); if (button && !button.hidden) place(button); });
  chrome.runtime.onMessage.addListener(message => {
    if (message.type === "HISTORY_CLEARED") {
      highlights?.clear(); clearView();
      return;
    }
    if (message.type === "TRANSLATION_CLEARED") {
      highlights?.remove(message.text, message.target);
      if (selected.trim() === message.text && (!target || target === message.target)) clearView();
      return;
    }
    if (message.type !== "CONTEXT_TRANSLATE") return;
    selected = message.text || selectionText();
    const selection = window.getSelection();
    selectedRange = selection.rangeCount && selection.toString().trim() === selected.trim() ? selection.getRangeAt(0).cloneRange() : null;
    shownResult = null; target = undefined;
    point = { x: Math.max(12, innerWidth / 2 - 195), y: Math.max(12, innerHeight / 4) };
    run();
  });
})();
