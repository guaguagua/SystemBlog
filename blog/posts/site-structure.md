---
title: 博客内容结构说明
category: 建站
summary: 说明 SystemBlog 如何用 labs 管理交互 HTML，用 posts 管理 Markdown，并用 content.json 自动生成文章列表。
date: 2026-06-21
---

# 博客内容结构说明

SystemBlog 现在分成两类内容。

## labs

`blog/labs/` 用来放可交互 HTML 页面，比如 LDPC 可视化、Kalman 动画、Canvas、Three.js、Vue 组件和带滑块参数的实验页面。

这类页面可以写成完整的独立 HTML，因为它们通常需要自己的脚本、样式和交互状态。

## posts

`blog/posts/` 用来放普通 Markdown 文章，比如技术笔记、问题复盘、数学推导、工具链记录和读书笔记。

写文章时只需要新增一个 `.md` 文件，然后运行生成脚本：

```powershell
node scripts/generate-content.js
```

脚本会扫描 `blog/labs/` 和 `blog/posts/`，自动更新：

```text
blog/content.json
```

文章列表会读取这个清单自动渲染，不需要手动改 `blog/index.html`。

Markdown 文章的访问地址长这样：

```html
<a href="article.html?post=site-structure">博客内容结构说明</a>
```

`article.html` 会根据 `post=site-structure` 自动加载：

```text
blog/posts/site-structure.md
```

## 什么时候用哪一种

需要动画、图表、按钮、滑块、实时计算时，放进 `labs`。

只是写作、整理知识、记录步骤时，放进 `posts`。
