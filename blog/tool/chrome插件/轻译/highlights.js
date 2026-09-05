// Paint ranges without splitting text nodes or replacing the page's elements.
globalThis.QingyiHighlights = class {
  constructor(send) {
    this.send = send;
    this.entries = [];
    this.epoch = 0;
    this.page = location.href;
    this.paint = new Highlight();
    CSS.highlights.set("qingyi-translated", this.paint);
    this.restore();
    let timer;
    this.observer = new MutationObserver(records => {
      if (!records.some(record => !record.target.closest?.("[data-qingyi-ui]"))) return;
      clearTimeout(timer);
      timer = setTimeout(() => this.reconcile(), 400);
    });
    this.observer.observe(document.body || document.documentElement, { childList: true, subtree: true, characterData: true });
    window.addEventListener("popstate", () => this.reconcile());
    window.addEventListener("hashchange", () => this.reconcile());
  }
  path(node) {
    const path = [];
    while (node && node !== document.body) {
      if (!node.parentNode) return null;
      path.unshift(Array.prototype.indexOf.call(node.parentNode.childNodes, node));
      node = node.parentNode;
    }
    return node === document.body ? path : null;
  }
  capture(range) {
    if (!range || range.collapsed || range.startContainer.getRootNode() !== document || range.endContainer.getRootNode() !== document) return null;
    const start = this.path(range.startContainer), end = this.path(range.endContainer);
    const quote = range.toString();
    if (!start || !end || !quote.trim() || quote.length > 12000) return null;
    return { start, end, startOffset: range.startOffset, endOffset: range.endOffset, quote };
  }
  locate(anchor) {
    try {
      const start = anchor.start.reduce((node, index) => node.childNodes[index], document.body);
      const end = anchor.end.reduce((node, index) => node.childNodes[index], document.body);
      const range = document.createRange();
      range.setStart(start, anchor.startOffset); range.setEnd(end, anchor.endOffset);
      if (range.toString() === anchor.quote) return range;
    } catch { /* The page may have inserted or moved elements since the last visit. */ }
    // Restore a moved passage only when its exact quote is unique in the page.
    const nodes = [], walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    let node, text = "";
    while ((node = walker.nextNode()) && text.length < 500000) {
      if (node.parentElement?.closest("script,style,noscript,textarea,input,[contenteditable],[data-qingyi-ui]")) continue;
      nodes.push({ node, start: text.length }); text += node.data;
    }
    const index = text.indexOf(anchor.quote);
    if (index < 0 || text.indexOf(anchor.quote, index + 1) !== -1) return null;
    const start = nodes.find(item => index >= item.start && index < item.start + item.node.length);
    const endIndex = index + anchor.quote.length;
    const end = nodes.find(item => endIndex > item.start && endIndex <= item.start + item.node.length);
    if (!start || !end) return null;
    const range = document.createRange();
    range.setStart(start.node, index - start.start); range.setEnd(end.node, endIndex - end.start);
    return range;
  }
  async restore() {
    const page = this.page;
    const epoch = this.epoch;
    try {
      const { marks = [] } = await this.send({ type: "GET_MARKS", page });
      if (this.page !== page || epoch !== this.epoch) return;
      for (const mark of marks) this.add(mark);
    } catch { /* Reading a page should still work when the extension is reloaded. */ }
  }
  add(mark, range = this.locate(mark.anchor)) {
    const id = JSON.stringify([mark.source, mark.target, mark.anchor]);
    const existing = this.entries.find(entry => entry.id === id);
    if (existing) return existing;
    const entry = { ...mark, id, range, page: this.page };
    this.entries.push(entry);
    if (range) this.paint.add(range);
    return entry;
  }
  async save(range, source, target) {
    const epoch = this.epoch;
    const anchor = this.capture(range);
    if (!anchor) return null;
    const entry = this.add({ source, target, anchor }, range.cloneRange());
    await this.send({ type: "SAVE_MARK", text: source, target, anchor, page: this.page });
    return epoch === this.epoch ? entry : null;
  }
  clear() {
    this.epoch++;
    this.entries = [];
    this.paint.clear();
    this.active(null);
  }
  remove(source, target) {
    this.epoch++;
    this.entries = this.entries.filter(entry => {
      if (entry.source !== source || entry.target !== target) return true;
      if (entry.range) {
        this.paint.delete(entry.range);
        CSS.highlights.get("qingyi-active")?.delete(entry.range);
      }
      return false;
    });
    this.restore();
  }
  reconcile() {
    if (this.page !== location.href) {
      this.page = location.href; this.clear(); this.restore(); return;
    }
    for (const entry of this.entries) {
      if (entry.range?.startContainer.isConnected && entry.range.toString() === entry.anchor.quote) continue;
      if (entry.range) this.paint.delete(entry.range);
      entry.range = this.locate(entry.anchor);
      if (entry.range) this.paint.add(entry.range);
    }
  }
  hit(x, y) {
    this.reconcile();
    return [...this.entries].reverse().find(entry => entry.range && Array.from(entry.range.getClientRects()).some(rect =>
      x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom));
  }
  active(entry) {
    CSS.highlights.set("qingyi-active", new Highlight(...(entry?.range ? [entry.range] : [])));
  }
};
