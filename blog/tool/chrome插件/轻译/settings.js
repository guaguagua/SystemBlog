const $ = id => document.getElementById(id);
let savedModel = "auto";
async function send(message) {
  const response = await chrome.runtime.sendMessage(message);
  if (!response?.ok) throw new Error(response?.error || "扩展未响应，请重新加载插件。");
  return response.data;
}
function status(text, error = false) { $("status").textContent = text; $("status").className = error ? "error" : ""; }
async function loadModels(force = false) {
  $("refresh").disabled = true;
  $("modelInfo").textContent = "正在获取免费模型…";
  const selected = $("model").value || savedModel;
  try {
    const result = await send({ type: "MODELS", force });
    $("model").replaceChildren(new Option("自动 · 优先使用量最高的免费模型", "auto"));
    result.models.forEach((m, index) => $("model").add(new Option(`${index + 1}. ${m.name}`, m.id)));
    if (selected !== "auto" && !result.models.some(m => m.id === selected)) {
      $("model").add(new Option(`已不可用 · ${selected}（请选择其他模型）`, selected));
    }
    $("model").value = selected;
    $("modelInfo").textContent = `${result.models.length} 个免费模型 · 按近一周 Token 使用量排序。自动首选：${result.models[0].name}。更新于 ${new Date(result.updatedAt).toLocaleString()}，缓存 1 小时。`;
  } catch (error) { $("modelInfo").textContent = `列表获取失败：${error.message}`; }
  finally { $("refresh").disabled = false; }
}
$("refresh").onclick = () => loadModels(true);
$("clearHistory").onclick = async () => {
  $("clearHistory").disabled = true;
  try {
    await send({ type: "CLEAR_HISTORY" });
    status("已清除全部译文和高亮（含旧版本记录），密钥和设置已保留。");
  } catch (error) { status(error.message, true); }
  finally { $("clearHistory").disabled = false; }
};
$("showKey").onclick = () => {
  const visible = $("apiKey").type === "password";
  $("apiKey").type = visible ? "text" : "password";
  $("showKey").textContent = visible ? "隐藏" : "显示";
};
$("settings").onsubmit = async event => {
  event.preventDefault(); $("save").disabled = true;
  try {
    await send({ type: "SAVE_SETTINGS", settings: {
      apiKey: $("apiKey").value, model: $("model").value, direction: $("direction").value
    } });
    savedModel = $("model").value;
    status("已保存。首次安装后请刷新需要翻译的网页。");
  } catch (error) { status(error.message, true); }
  finally { $("save").disabled = false; }
};
async function init() {
  try {
    const prefs = await send({ type: "GET_SETTINGS" });
    $("apiKey").value = prefs.apiKey; $("direction").value = prefs.direction;
    savedModel = prefs.model;
    if (savedModel !== "auto") $("model").add(new Option(savedModel, savedModel));
    $("model").value = savedModel;
    $("save").disabled = false;
    await loadModels();
  } catch (error) { status(error.message, true); }
}
init();
