// UI smoke test with a mocked extension messaging boundary; no API key needed.
// Set PLAYWRIGHT_MODULE to an installed Playwright package's absolute path.
import { createRequire } from "node:module";
import { readFile, mkdir } from "node:fs/promises";
import { createServer } from "node:http";
import { fileURLToPath } from "node:url";
import assert from "node:assert/strict";
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const base = new URL("../", import.meta.url);
const server = createServer(async (req, res) => {
  const path = req.url.split("?")[0];
  const file = { "/settings.html": "settings.html", "/settings.js": "settings.js", "/settings.css": "settings.css" }[path];
  if (!file) { res.setHeader("Content-Type", "text/html; charset=utf-8"); res.end('<html><body><p id="sample" style="margin:80px;font:20px sans-serif">Hello, world! This is a selected paragraph.</p></body></html>'); return; }
  res.setHeader("Content-Type", file.endsWith("js") ? "text/javascript" : file.endsWith("css") ? "text/css" : "text/html; charset=utf-8");
  res.end(await readFile(new URL(file, base)));
});
await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
const origin = `http://127.0.0.1:${server.address().port}`;
let browser;
try {
  browser = await chromium.launch({ channel: "chrome", headless: true });
  const page = await browser.newPage({ viewport: { width: 900, height: 760 } });
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.addInitScript(() => {
    window.sent = [];
    const translations = new Map();
    const attach = Element.prototype.attachShadow;
    Element.prototype.attachShadow = function (options) {
      const root = attach.call(this, options); window.testShadow = root; return root;
    };
    window.chrome = { runtime: { onMessage: { addListener(fn) { window.extensionListener = fn; } },
      sendMessage: async message => {
        window.sent.push(message);
        if (message.type === "GET_SETTINGS") return { ok: true, data: { apiKey: "", model: "auto", direction: "auto" } };
        if (message.type === "MODELS") return { ok: true, data: { updatedAt: Date.now(), models: [{ id: "top:free", name: "Example Free" }] } };
        const key = JSON.stringify([message.text, message.direction || "zh"]);
        if (message.type === "LOOKUP") return { ok: true, data: { translated: translations.has(key) } };
        if (message.type === "TRANSLATE") {
          if (!message.force && translations.has(key)) return { ok: true, data: { ...translations.get(key), cached: true } };
          if (window.slowTranslation) await new Promise(resolve => setTimeout(resolve, 200));
          if (window.failTranslation) return { ok: false, error: "API Key 无效，请在设置中检查。" };
          const data = { text: "你好，世界！这是选中的段落。<script>不会执行</script>", model: "Example Free", target: message.direction || "zh" };
          translations.set(key, data);
          return { ok: true, data };
        }
        return { ok: true, data: {} };
      }
    } };
  });
  await page.goto(`${origin}/settings.html`);
  await page.locator("#save").waitFor({ state: "visible" });
  await page.locator("#apiKey").fill("local-test-key");
  await page.locator("#save").click();
  await page.waitForFunction(() => document.querySelector("#status").textContent.includes("已保存"));
  assert.equal(await page.locator("#model option").count(), 2);
  const artifacts = new URL("./artifacts/", import.meta.url);
  await mkdir(artifacts, { recursive: true });
  await page.setViewportSize({ width: 390, height: 600 });
  await page.evaluate(() => scrollTo(0, 0));
  const clearBounds = await page.locator("#clearHistory").boundingBox();
  assert.ok(clearBounds.y >= 0 && clearBounds.y + clearBounds.height < 300, "clear button visible near top without scrolling");
  await page.screenshot({ path: fileURLToPath(new URL("settings.png", artifacts)) });
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
  await page.goto(origin);
  await page.addStyleTag({ content: await readFile(new URL("highlights.css", base), "utf8") });
  await page.addScriptTag({ content: await readFile(new URL("highlights.js", base), "utf8") });
  await page.addScriptTag({ content: await readFile(new URL("content.js", base), "utf8") });
  await page.evaluate(() => {
    const range = document.createRange(); range.selectNodeContents(document.getElementById("sample"));
    getSelection().removeAllRanges(); getSelection().addRange(range);
    document.getElementById("sample").dispatchEvent(new PointerEvent("pointerup", { bubbles: true, button: 0, clientX: 300, clientY: 180 }));
  });
  assert.equal(await page.evaluate(() => window.testShadow.querySelector(".trigger").hidden), false);
  assert.equal(await page.evaluate(() => sent.filter(m => m.type === "TRANSLATE").length), 0);
  await page.evaluate(() => window.testShadow.querySelector(".trigger").click());
  await page.waitForFunction(() => window.testShadow.querySelector(".output").textContent.includes("你好"));
  await page.waitForFunction(() => CSS.highlights.get("qingyi-translated")?.size === 1);
  await page.context().grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.evaluate(() => window.testShadow.querySelector(".actions button").click());
  await page.waitForFunction(() => window.testShadow.querySelector(".actions button").textContent === "已复制");
  assert.match(await page.evaluate(() => navigator.clipboard.readText()), /你好/);
  assert.equal(await page.evaluate(() => window.testShadow.querySelectorAll("script").length), 0);
  assert.equal(await page.evaluate(() => { const r = window.testShadow.querySelector(".panel").getBoundingClientRect(); return r.left >= 0 && r.right <= innerWidth && r.bottom <= innerHeight; }), true);
  await page.screenshot({ path: fileURLToPath(new URL("translation.png", artifacts)) });
  await page.evaluate(() => {
    window.testShadow.querySelector(".header button").click();
    const range = document.createRange(); range.selectNodeContents(document.getElementById("sample"));
    getSelection().removeAllRanges(); getSelection().addRange(range);
    document.getElementById("sample").dispatchEvent(new PointerEvent("pointerup", { bubbles: true, button: 0, clientX: 300, clientY: 180 }));
  });
  await page.waitForFunction(() => window.testShadow.querySelector(".trigger").textContent === "✓ 已译");
  await page.evaluate(() => window.testShadow.querySelector(".trigger").click());
  await page.waitForFunction(() => window.testShadow.querySelector(".meta").textContent.includes("本地记录"));
  await page.evaluate(() => { window.failTranslation = true; window.testShadow.querySelector(".actions button:nth-child(2)").click(); });
  await page.waitForFunction(() => window.testShadow.querySelector(".meta").textContent.includes("更新失败"));
  assert.match(await page.evaluate(() => window.testShadow.querySelector(".output").textContent), /你好/);
  assert.equal(await page.evaluate(() => sent.filter(m => m.type === "TRANSLATE").at(-1).force), true);
  await page.evaluate(() => {
    window.failTranslation = false; window.slowTranslation = true;
    window.testShadow.querySelector(".actions button:nth-child(2)").click();
    window.testShadow.querySelector(".header button").click();
  });
  await page.waitForTimeout(250);
  assert.equal(await page.evaluate(() => window.testShadow.querySelector(".panel").hidden), true);
  // Clicking highlighted text toggles the cached translation without selecting again.
  await page.evaluate(() => { window.slowTranslation = false; getSelection().removeAllRanges(); });
  const highlightRect = await page.evaluate(() => {
    const range = [...CSS.highlights.get("qingyi-translated")][0];
    const r = range.getClientRects()[0]; return { x: r.left + 8, y: r.top + r.height / 2 };
  });
  await page.mouse.click(highlightRect.x, highlightRect.y);
  await page.waitForFunction(() => !window.testShadow.querySelector(".panel").hidden && window.testShadow.querySelector(".meta").textContent.includes("本地记录"));
  await page.mouse.click(highlightRect.x, highlightRect.y);
  await page.waitForFunction(() => window.testShadow.querySelector(".panel").hidden);
  await page.screenshot({ path: fileURLToPath(new URL("highlight.png", artifacts)) });
  assert.deepEqual(errors, []);
  console.log("Browser UI passed: settings, narrow viewport, selection, explicit trigger, literal output, errors, close/stale response.");
} finally {
  await browser?.close();
  await new Promise(resolve => server.close(resolve));
}
