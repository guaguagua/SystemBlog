// Loads the real unpacked extension in a disposable Chrome profile.
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { createServer } from "node:http";
import assert from "node:assert/strict";
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const context = await chromium.launchPersistentContext("", {
  channel: "chrome", headless: true, ignoreDefaultArgs: ["--disable-extensions"], args: ["--enable-unsafe-extension-debugging"]
});
const server = createServer((req, res) => {
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.end('<p id="sample">Hello, world! Translate this paragraph.</p>');
});
try {
  const cdp = await context.browser().newBrowserCDPSession();
  const { id } = await cdp.send("Extensions.loadUnpacked", { path: fileURLToPath(new URL("../", import.meta.url)) });
  const page = await context.newPage();
  await page.goto(`chrome-extension://${id}/settings.html`);
  await page.waitForFunction(() => !document.getElementById("save").disabled);
  await page.waitForFunction(() => document.querySelectorAll("#model option").length > 1, null, { timeout: 25000 });
  console.log("Real extension loaded; live free models:", await page.locator("#model option").count() - 1);
  await page.locator("#direction").selectOption("en");
  await page.locator("#save").click();
  await page.waitForFunction(() => document.getElementById("status").textContent.includes("已保存"));
  await page.reload();
  await page.waitForFunction(() => document.getElementById("direction").value === "en");
  await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
  const web = await context.newPage();
  await web.goto(`http://127.0.0.1:${server.address().port}`);
  await web.waitForLoadState("networkidle");
  // Real mouse selection, real isolated-world content script.
  const rect = await web.locator("#sample").boundingBox();
  await web.mouse.move(rect.x + 2, rect.y + 8);
  await web.mouse.down(); await web.mouse.move(rect.x + 280, rect.y + 8, { steps: 12 }); await web.mouse.up();
  // Closed shadow root is deliberately opaque to page JS. Inspect through CDP.
  const session = await context.newCDPSession(web);
  const { root } = await session.send("DOM.getDocument", { depth: -1, pierce: true });
  function find(node, className, attribute = "class") {
    const attrs = node.attributes || [];
    if (attrs.some((a, i) => i % 2 === 0 && a === attribute && attrs[i + 1] === className)) return node;
    for (const child of [...(node.children || []), ...(node.shadowRoots || [])]) { const result = find(child, className, attribute); if (result) return result; }
  }
  const trigger = find(root, "trigger"); assert.ok(trigger, "real selection button injected");
  const { model } = await session.send("DOM.getBoxModel", { nodeId: trigger.nodeId });
  const quad = model.content;
  await web.mouse.click((quad[0] + quad[2]) / 2, (quad[1] + quad[5]) / 2);
  // No private credential or inference request: verify the real worker's missing-key path.
  await web.waitForTimeout(300);
  const document = await session.send("DOM.getDocument", { depth: -1, pierce: true });
  const output = find(document.root, "output error");
  assert.ok(output, "missing-key error rendered through real messaging");
  const { outerHTML } = await session.send("DOM.getOuterHTML", { nodeId: output.nodeId });
  assert.match(outerHTML, /API Key/);
  // Seed a record in this disposable profile, then exercise real reload/lookup/cache paths.
  const sourceText = await web.evaluate(() => getSelection().toString().trim());
  await page.evaluate(async text => {
    const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(JSON.stringify([text, "en"])));
    const key = Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, "0")).join("");
    await chrome.storage.local.set({ translations: { [key]: { text: "Saved translation for test", model: "Test Free", target: "en", savedAt: Date.now() } } });
  }, sourceText);
  await web.reload(); await web.waitForLoadState("networkidle");
  await web.mouse.move(rect.x + 2, rect.y + 8);
  await web.mouse.down(); await web.mouse.move(rect.x + 280, rect.y + 8, { steps: 12 }); await web.mouse.up();
  async function nodeMatching(className, text) {
    for (let i = 0; i < 30; i++) {
      const snapshot = await session.send("DOM.getDocument", { depth: -1, pierce: true });
      const node = find(snapshot.root, className);
      if (node) {
        const html = await session.send("DOM.getOuterHTML", { nodeId: node.nodeId });
        if (!text || html.outerHTML.includes(text)) return node;
      }
      await web.waitForTimeout(100);
    }
    throw new Error(`Missing ${className}: ${text}`);
  }
  const savedTrigger = await nodeMatching("trigger saved", "已译");
  const savedBox = await session.send("DOM.getBoxModel", { nodeId: savedTrigger.nodeId });
  const savedQuad = savedBox.model.content;
  await web.mouse.click((savedQuad[0] + savedQuad[2]) / 2, (savedQuad[1] + savedQuad[5]) / 2);
  await nodeMatching("output", "Saved translation for test");
  await nodeMatching("meta", "本地记录");
  // Wait for the highlight anchor to be saved, then reload without selecting text.
  await page.waitForFunction(async () => {
    const { translations } = await chrome.storage.local.get("translations");
    return Object.values(translations).some(entry => entry.marks?.length);
  });
  await web.reload(); await web.waitForLoadState("networkidle");
  await web.waitForFunction(() => CSS.highlights.get("qingyi-translated")?.size > 0);
  const highlightPoint = await web.evaluate(() => {
    const r = [...CSS.highlights.get("qingyi-translated")][0].getClientRects()[0];
    return { x: r.left + 10, y: r.top + r.height / 2 };
  });
  await web.mouse.click(highlightPoint.x, highlightPoint.y);
  await nodeMatching("output", "Saved translation for test");
  await nodeMatching("meta", "本地记录");
  await web.mouse.click(highlightPoint.x, highlightPoint.y);
  const hiddenPanel = await nodeMatching("panel");
  const panelHTML = await session.send("DOM.getOuterHTML", { nodeId: hiddenPanel.nodeId });
  assert.match(panelHTML.outerHTML, /hidden/);
  const savedRecords = await page.evaluate(async () => (await chrome.storage.local.get("translations")).translations);
  // Clear through the actual settings UI, including a legacy record without marks.
  await page.evaluate(async () => {
    const { translations } = await chrome.storage.local.get("translations");
    translations.legacy = { text: "Legacy saved translation", target: "zh" };
    await chrome.storage.local.set({ translations });
  });
  await page.locator("#clearHistory").click();
  await page.waitForFunction(() => document.getElementById("status").textContent.includes("已清除"));
  await web.waitForFunction(() => CSS.highlights.get("qingyi-translated")?.size === 0 && CSS.highlights.get("qingyi-active")?.size === 0);
  assert.equal(await page.evaluate(async () => (await chrome.storage.local.get("translations")).translations), undefined);
  assert.equal(await page.evaluate(async () => (await chrome.storage.local.get("settings")).settings.direction), "en");
  await web.reload(); await web.waitForLoadState("networkidle");
  assert.equal(await web.evaluate(() => CSS.highlights.get("qingyi-translated")?.size), 0);
  console.log("Real clear passed: legacy records removed, live highlights cleared, settings preserved, no restore after reload.");
  async function clickCleanup(id) {
    const snapshot = await session.send("DOM.getDocument", { depth: -1, pierce: true });
    const node = find(snapshot.root, id, "id"); assert.ok(node);
    const { model } = await session.send("DOM.getBoxModel", { nodeId: node.nodeId });
    const q = model.content;
    await web.mouse.click((q[0] + q[2]) / 2, (q[1] + q[5]) / 2);
  }
  for (const action of ["clearCurrent", "clearAll"]) {
    await page.evaluate(async records => chrome.storage.local.set({ translations: { ...records, unrelated: { text: "Keep this translation", target: "zh" } } }), savedRecords);
    await web.reload(); await web.waitForLoadState("networkidle");
    await web.waitForFunction(() => CSS.highlights.get("qingyi-translated")?.size > 0);
    await web.mouse.click(highlightPoint.x, highlightPoint.y);
    await nodeMatching("meta", "本地记录");
    await clickCleanup(action);
    await web.waitForFunction(() => CSS.highlights.get("qingyi-translated")?.size === 0);
    const remaining = await page.evaluate(async () => (await chrome.storage.local.get("translations")).translations);
    if (action === "clearCurrent") assert.deepEqual(Object.keys(remaining), ["unrelated"]);
    else assert.equal(remaining, undefined);
  }
  console.log("Real popup controls passed: clear current preserves other records; clear all removes everything.");
  console.log("Real highlights passed: persisted anchor, automatic restore, click to show/hide.");
  console.log("Real cache passed: reload, saved marker, cached result without an API key.");
  console.log("Real extension passed: manifest/worker, live catalog, persisted settings, selection button, missing-key response.");
} finally {
  await context.close();
  await new Promise(resolve => server.close(resolve));
}
