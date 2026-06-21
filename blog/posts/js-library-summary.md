---
title: GitHub Pages 博客可用的前端 JS 库汇总
category: 前端工具
summary: 用表格总结 Markdown 渲染、公式、图表、电路、3D、Vue、表格、CSV 和 Excel 等适合静态博客使用且许可边界清晰的前端库。
date: 2026-06-21
---

# GitHub Pages 博客可用的前端 JS 库汇总

SystemBlog 是静态博客，适合使用浏览器端运行的 JavaScript 库。原则很简单：普通文章放在 `blog/posts/`，复杂交互和可视化实验放在 `blog/labs/`。

本清单只保留适合公开 GitHub Pages 博客使用、许可边界相对清晰的库。需要商业授权或许可边界容易误用的库不放入推荐表。

## 推荐位置

| 内容类型 | 推荐目录 | 原因 |
|---|---|---|
| 普通 Markdown 文章 | `blog/posts/` | 文章页会自动读取 `.md` 并渲染成 HTML。 |
| 公式、代码高亮、结构图 | `blog/posts/` 或文章页全局增强 | 可以在 Markdown 渲染后统一处理。 |
| Three.js、ECharts、Vue、电路仿真、复杂表格 | `blog/labs/` | 这些页面通常需要独立的 HTML、CSS、脚本和交互状态。 |
| CSV、Excel、数据面板 | `blog/labs/` | 更像一个小工具页面，不适合塞进普通 Markdown。 |

## Markdown 与文章增强

| 库 | 用途 | 推荐场景 | 建议位置 | 备注 |
|---|---|---|---|---|
| `marked` | Markdown 转 HTML | 当前文章阅读页已经在用 | `blog/article.html` | 简单直接，适合轻量博客。 |
| `markdown-it` | Markdown 转 HTML | 需要插件、容器、自定义语法时 | `blog/article.html` | 比 `marked` 更适合扩展。 |
| `Prism.js` | 代码高亮 | 技术文章、代码片段 | `blog/posts/` 全局增强 | 主题漂亮，适合手动指定语言。 |
| `highlight.js` | 代码高亮 | 想要自动识别语言时 | `blog/posts/` 全局增强 | 配置简单，适合文章页统一启用。 |
| `KaTeX` | 数学公式 | 大多数数学公式、推导文章 | `blog/posts/` 全局增强 | 渲染快，适合静态博客。 |
| `MathJax` | 数学公式 | 复杂公式、兼容性要求高时 | `blog/posts/` 全局增强 | 功能完整，但比 KaTeX 重一些。 |
| `Mermaid` | 文本生成图 | 流程图、时序图、状态机、类图 | `blog/posts/` 或 `blog/labs/` | 非常适合技术笔记。 |
| `draw.io` | 图形绘制 | 架构图、电路图、流程图 | `blog/posts/` 或 `blog/labs/` | 普通文章建议导出 SVG/PNG；交互图再用 embed/iframe。 |

## 图表与数据可视化

| 库 | 用途 | 推荐场景 | 建议位置 | 备注 |
|---|---|---|---|---|
| `ECharts` | 工程图表 | 折线图、柱状图、关系图、仪表盘 | `blog/labs/` | 中文资料多，交互能力强。 |
| `Chart.js` | 轻量图表 | 简单统计图、趋势图 | `blog/labs/` | API 简洁，适合小页面。 |
| `Plotly.js` | 科学图表 | 统计图、3D 图、交互分析 | `blog/labs/` | 功能强，但体积较大。 |
| `D3.js` | 自定义可视化 | 需要完全控制图形和动画时 | `blog/labs/` | 自由度最高，代码量也更大。 |
| `Observable Plot` | 快速数据图 | 从表格数据快速生成图形 | `blog/labs/` | 比 D3 更省代码。 |
| `Cytoscape.js` | 网络图 | 知识图谱、依赖图、模块连接图 | `blog/labs/` | 适合 RTL 模块关系、系统依赖关系。 |
| `vis-network` | 网络图 | 交互节点图、关系网 | `blog/labs/` | 上手直接，适合浏览关系数据。 |
| `Leaflet` | 地图 | 地理标注、路线、区域展示 | `blog/labs/` | 需要地图底图服务时注意外部资源可用性。 |

## 电路与硬件可视化

| 库 | 用途 | 推荐场景 | 建议位置 | 备注 |
|---|---|---|---|---|
| `WaveDrom` | 数字时序图 | 总线协议、握手信号、RTL 时序说明 | `blog/posts/` 或 `blog/labs/` | 用 WaveJSON 生成 SVG，适合技术文章。 |
| `netlistsvg` | 网表转原理图 SVG | Yosys JSON 网表、RTL 结构图、模块连接图 | `blog/labs/` 或离线生成 SVG 后放文章 | MIT 许可，适合配合 Verilog/Yosys 工作流。 |
| `DigitalJS` | 数字逻辑电路仿真 | 门级电路、组合逻辑、寄存器、教学演示 | `blog/labs/` | BSD-2-Clause 许可，输入是 JSON，可配合 `yosys2digitaljs`。 |
| `yosys2digitaljs` | Yosys 输出转 DigitalJS | Verilog/SystemVerilog 转可交互数字电路 | 离线工具链或 `blog/labs/` 辅助流程 | 不是 UI 库，更像格式转换工具。 |
| `elkjs` | 自动布局 | 带端口的数据流图、网表图、模块图 | `blog/labs/` | 只负责布局，不负责绘制；常和 SVG/Canvas 配合。 |
| `dagre` / `graphre` | 有向图布局 | 简单模块框图、依赖图、信号流图 | `blog/labs/` | 比 `elkjs` 简单，适合不需要复杂端口布局的图。 |
| `SVG.js` | SVG 绘制与交互 | 自制电路符号、连线、标注、动画 | `blog/labs/` | MIT 许可，适合做轻量自定义电路图。 |
| `CircuitJS1` | 模拟/混合电路仿真 | RLC、二极管、晶体管、运放等电路演示 | 外链参考或独立实验页 | GPL 许可，默认不作为本站基础库；如果内嵌或修改需遵守 GPL。 |

## 3D、动画与交互实验

| 库 | 用途 | 推荐场景 | 建议位置 | 备注 |
|---|---|---|---|---|
| `Three.js` | WebGL 3D | 3D 模型、空间几何、信号可视化 | `blog/labs/` | 用 CDN/import map，不要直接写裸模块名 `three`。 |
| `p5.js` | 创意编码 | 教学动画、几何演示、交互草图 | `blog/labs/` | 适合快速做可视化小实验。 |
| `Matter.js` | 2D 物理 | 碰撞、刚体、物理演示 | `blog/labs/` | 适合教学动画和小游戏。 |
| `Phaser` | HTML5 游戏 | 交互游戏、可玩实验 | `blog/labs/` | 做完整游戏页面时比手写 Canvas 更稳。 |
| `Fabric.js` | Canvas 编辑 | 可拖拽图形、标注、画布编辑器 | `blog/labs/` | 适合做图形编辑类小工具。 |
| `Rough.js` | 手绘风图形 | 手绘风示意图、轻量视觉效果 | `blog/labs/` | 适合让示意图更自然。 |

## Vue 与 UI

| 库 | 用途 | 推荐场景 | 建议位置 | 备注 |
|---|---|---|---|---|
| `Vue` | 前端交互框架 | 复杂实验页、状态较多的工具页 | `blog/labs/` | 简单页面可用 CDN，不一定需要构建工具。 |
| `petite-vue` | 轻量 Vue 交互 | 小表单、小控件、局部响应式 | `blog/labs/` | 比完整 Vue 更轻。 |
| `Alpine.js` | HTML 内声明交互 | 折叠面板、筛选、简单状态 | `blog/labs/` | 适合不想写完整框架的页面。 |
| `Shoelace` | Web Components UI | 按钮、弹窗、标签页、输入控件 | `blog/labs/` | 不绑定 Vue/React，适合静态页面。 |
| `Element Plus` | Vue 组件库 | Vue 实验页、表单、标签页、面板 | `blog/labs/` | UI 完整，但依赖 Vue，页面体积更大。 |
| `reveal.js` | 网页幻灯片 | 技术分享、课程讲义、演示文稿 | `blog/labs/` | 可以把文章变成 slide 页面。 |

## 表格、CSV 与 Excel

| 库 | 用途 | 推荐场景 | 建议位置 | 备注 |
|---|---|---|---|---|
| 原生 Markdown 表格 | 普通表格 | 简单对比、参数表、总结表 | `blog/posts/` | 文章正文优先保持轻量，不额外引入表格脚本。 |
| `Grid.js` | 数据表格 UI | JSON/数组渲染成漂亮表格 | `blog/labs/` | 轻量，适合独立数据页。 |
| `Tabulator` | 交互数据网格 | 筛选、排序、编辑、分组、导出 | `blog/labs/` | 推荐做复杂数据浏览器。 |
| `AG Grid Community` | 高级数据网格 | 大型表格、仪表盘、复杂列配置 | `blog/labs/` | 功能强，体积和配置复杂度也更高。 |
| `SheetJS` | 读取/写入 Excel | 上传 `.xlsx` 并解析成数据 | `blog/labs/` | 不是表格 UI，通常配合 Tabulator/Grid.js。 |
| `Papa Parse` | CSV 解析 | 上传 CSV、读取远程 CSV、大文件解析 | `blog/labs/` | 适合和图表、表格库配合。 |
| `Arquero` | 表格数据处理 | 浏览器里做 group/filter/derive | `blog/labs/` | 类似轻量数据处理引擎，适合分析页。 |
| `TanStack Table` | Headless 表格逻辑 | 自己完全控制 UI 时 | `blog/labs/` | 更适合有构建工具或框架项目。 |

## 建议采用顺序

| 优先级 | 建议 | 价值 |
|---|---|---|
| 1 | 加 `Prism.js` 或 `highlight.js` | 技术博客最常用，立刻改善阅读体验。 |
| 2 | 加 `KaTeX` 和 `Mermaid` | 支持公式和结构图，适合技术笔记。 |
| 3 | 加 `WaveDrom` 示例 | 先支持数字时序图，最适合硬件/RTL 笔记。 |
| 4 | 在 `blog/labs/` 建一个 `netlist-demo.html` | 用 `netlistsvg` 或 `DigitalJS` 展示 Verilog/Yosys 结构。 |
| 5 | 在 `blog/labs/` 建一个 `table-demo.html` | 用 `Tabulator + Papa Parse + SheetJS` 做 CSV/XLSX 数据浏览器。 |
| 6 | 在 `blog/labs/` 建可视化模板 | 预留 `Vue + ECharts + Three.js` 的页面骨架。 |

## 简短结论

如果只是写文章，优先增强 `blog/posts/` 的 Markdown 渲染链路。  
如果要做图表、3D、数据表格、Vue 工具页，就放到 `blog/labs/`，让每个实验页拥有自己的脚本和样式。
