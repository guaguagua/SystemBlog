---
title: GitHub Pages 博客可用的前端 JS 库汇总
category: 前端工具
summary: 用表格总结 Markdown 渲染、公式、图表、电路、3D、Vue、表格、CSV 和 Excel 等适合静态博客使用且许可边界清晰的前端库。
date: 2026-06-21
---

# GitHub Pages 博客可用的前端 JS 库汇总

SystemBlog 是静态博客，适合使用浏览器端运行的 JavaScript 库。原则很简单：普通文章放在 `blog/posts/`，复杂交互和可视化实验放在 `blog/labs/`。本清单只保留适合公开 GitHub Pages 博客使用、许可边界相对清晰的库。需要商业授权或许可边界容易误用的库不放入推荐表。

## 推荐位置

| 内容类型 | 推荐目录 | 原因 |
|---|---|---|
| 普通 Markdown 文章 | `blog/posts/` | 文章页会自动读取 `.md` 并渲染成 HTML。 |
| 公式、代码高亮、结构图 | `blog/posts/` 或文章页全局增强 | 可以在 Markdown 渲染后统一处理。 |
| Three.js、ECharts、Vue、电路仿真、复杂表格 | `blog/labs/` | 这些页面通常需要独立的 HTML、CSS、脚本和交互状态。 |
| CSV、Excel、数据面板 | `blog/labs/` | 更像一个小工具页面，不适合塞进普通 Markdown。 |

## 按功能分类的库（去重并给出建议位置）

### 1) Markdown 与文章渲染相关
- markdown-it — Markdown -> HTML（`blog/article.html` / `blog/posts/`），扩展性强，接近 VS Code 预览技术路线。  
- marked — 轻量 Markdown 渲染（`blog/article.html` / `blog/posts/`）。  
- Prism.js — 代码高亮（手动指定语言，`blog/posts/` 全局增强）。  
- highlight.js — 代码高亮（自动识别语言，`blog/posts/` 全局增强）。  
- DOMPurify — HTML 消毒（XSS 防护，文章渲染链路必须启用）。  
- KaTeX — 公式渲染（快速，`blog/posts/` 全局增强）。  
- MathJax — 复杂公式兼容（功能更完整但体积更大，按需选择）。  
- Mermaid — 文本绘图（流程图、时序图，`blog/posts/` 或 `blog/labs/`）。  
- markmap (markmap-lib + markmap-view) — Markdown 转思维导图（`blog/labs/` / 嵌入视图场景）。  
- Graphviz (viz-standalone.js) — DOT 图渲染（流程/依赖图，`blog/posts/` 或 `blog/labs/`）。

### 2) 图表与数据可视化
- ECharts — 工程图表（交互强、中文资料多，`blog/labs/`）。  
- Chart.js — 轻量图表（趋势/小统计图，`blog/labs/`）。  
- Plotly.js — 科学/统计/3D 图（功能强但体积大，`blog/labs/`）。  
- D3.js — 底层可视化引擎（需要完全自定义时使用，`blog/labs/`）。  
- Observable Plot — 快速从表格生成图（比 D3 省代码，`blog/labs/`）。  
- Cytoscape.js — 网络图（知识图谱、模块关系，`blog/labs/`）。  
- vis-network — 交互节点图（关系网，`blog/labs/`）。  
- Leaflet — 地图（地理展示，注意底图服务可用性，`blog/labs/`）。

### 3) 电路与硬件可视化 / 硬件相关工具
- WaveDrom — 数字时序图（WaveJSON -> SVG，`blog/posts/`/`blog/labs/`）。  
- netlistsvg — Yosys 网表 -> 原理图 SVG（MIT，适合 Verilog/Yosys 流程，`blog/labs/` 或离线生成 SVG 放文章）。  
- DigitalJS — 数字逻辑仿真（门级仿真、教学演示，BSD-2-Clause，`blog/labs/`）。  
- yosys2digitaljs — 格式转换工具（Yosys -> DigitalJS，离线或工具链一部分）。  
- elkjs — 自动布局（端口布局等，通常与 SVG/渲染库配合，`blog/labs/`）。  
- dagre / graphre — 有向图布局（简单依赖/信号流图，`blog/labs/`）。  
- SVG.js — SVG 绘制与交互（自定义电路符号与连线，`blog/labs/`）。  
- hdelk — 硬件框图绘制（与 ELK / SVG 结合，`blog/labs/`）。  
- CircuitJS1 — 模拟电路仿真（GPL，注意许可，通常外链或独立实验页）。

### 4) 3D、动画与互动实验
- Three.js — WebGL 3D（3D 模型、空间几何，`blog/labs/`）。  
- p5.js — 创意编码与教学动画（快速原型，`blog/labs/`）。  
- Matter.js — 2D 物理引擎（碰撞、教学演示，`blog/labs/`）。  
- Phaser — HTML5 游戏引擎（互动游戏/可玩实验，`blog/labs/`）。  
- Fabric.js — Canvas 编辑（可拖拽编辑器类工具，`blog/labs/`）。  
- Rough.js — 手绘风图形（示意图风格，`blog/labs/`）。

### 5) 框架与 UI 组件
- Vue — 完整前端框架（复杂实验页、状态多的工具页，`blog/labs/`）。  
- petite-vue — 轻量 Vue（局部响应式控件，`blog/labs/`）。  
- Alpine.js — HTML 声明式交互（折叠、筛选等，`blog/labs/`）。  
- Shoelace — Web Components UI（不依赖框架，`blog/labs/`）。  
- Element Plus — Vue 组件库（完整 UI，依赖 Vue，`blog/labs/`）。  
- reveal.js — 网页幻灯片（演示/课程，`blog/labs/`）。

### 6) 表格、CSV、Excel 与数据处理
- Tabulator — 交互数据网格（筛选、排序、导出，`blog/labs/`）。  
- Grid.js — 轻量数据表格 UI（JSON 渲染，`blog/labs/`）。  
- AG Grid Community — 高级数据网格（大型表格，功能强但复杂，`blog/labs/`）。  
- SheetJS (xlsx) — 读取/写入 Excel（与表格 UI 配合，`blog/labs/`）。  
- Papa Parse — CSV 解析（大文件/远程 CSV，`blog/labs/`）。  
- Arquero — 浏览器内数据处理（group/filter/derive，`blog/labs/`）。  
- TanStack Table — Headless 表格逻辑（完全自定义 UI 时使用，`blog/labs/`）。

### 7) 实用工具与资源
- DOMPurify — HTML 消毒（放在 Markdown 渲染相关组里，文章安全必备）。  
- FileSaver.js — 文件保存/导出（导出 CSV/XLSX/图片，`blog/labs/`）。  
- jetbrains-mono.css — 等宽代码字体（提升代码可读性，文章样式）。  
- twemoji.css — Emoji 美化（可选，文章表现）。  
- filesaver.min.js —（同 FileSaver 功能，按需选其一）。

## 库文件速查（常用构建/CDN 文件名）
| 库 | 常用文件 | 备注 |
|---|---:|---|
| Mermaid | `mermaid.min.js` | 文本绘图 |
| Markmap | `markmap-lib.js` + `markmap-view.js` | Markdown -> 思维导图 |
| ECharts | `echarts.min.js` | 工程图表 |
| Graphviz | `viz-standalone.js` | DOT 渲染 |
| D3.js | `d3.min.js` | 底层可视化引擎 |
| netlistsvg | `netlistsvg.bundle.js` | Yosys 网表转电路原理图 |
| WaveDrom | `wavedrom.min.js` + `wavedrom-skin.js` | 数字时序波形 |
| ELK | `elk.bundled.js` | 自动布局引擎 |
| hdelk | `hdelk.js` | 硬件框图绘制 |
| SVG.js | `svg.min.js` | SVG 操作 |
| Marked | `marked.min.js` | Markdown 解析 |
| Highlight.js | `highlight.min.js` + `highlight-theme-*.css` | 代码高亮 |
| DOMPurify | `dompurify.min.js` | XSS 防护 |
| KaTeX | `katex.min.js` + `katex-auto-render.min.js` + `katex.css` | 公式渲染 |
| Tabulator | `tabulator.min.js` + `tabulator.min.css` | 交互表格 |
| FileSaver | `filesaver.min.js` | 浏览器端文件保存 |
| JetBrains Mono | `jetbrains-mono.css` | 代码字体 |

## 建议采用顺序（按优先级逐步增强博客）
| 优先级 | 建议 | 价值 |
|---|---|---|
| 1 | `marked.min.js` + `highlight.min.js` + 主题 CSS | 改善 Markdown 与代码块的阅读体验。 |
| 2 | `katex.min.js` + `katex-auto-render.min.js` + `mermaid.min.js` | 支持公式与结构图，技术笔记更完整。 |
| 3 | `wavedrom.min.js` + 皮肤 | 支持数字时序图，适合硬件/RTL 笔记。 |
| 4 | 在 `blog/labs/` 加 `netlist-demo.html` | 用 `netlistsvg.bundle.js` 或 DigitalJS 展示 Verilog/Yosys 结构。 |
| 5 | 在 `blog/labs/` 加 `table-demo.html` | 用 `tabulator.min.js` + `Papa Parse` + `SheetJS` 做 CSV/XLSX 浏览器。 |
| 6 | 建可视化模板 | 预留 `echarts.min.js`、`d3.min.js`、`three.min.js` 的页面骨架用于快速复用。 |

## 简短结论

如果只是写文章，优先增强 `blog/posts/` 的 Markdown 渲染链路（marked/highlight/KaTeX/DOMPurify）。如果要做图表、3D、数据表格、Vue 工具页，就放到 `blog/labs/`，让每个实验页拥有自己的脚本和样式。
