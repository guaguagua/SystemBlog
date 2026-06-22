# SystemBlog

一个部署在 GitHub Pages 上的静态技术博客。

这个仓库不需要后端服务器，也不需要数据库。博客内容分成两类：

- `blog/labs/`：放可交互 HTML 页面，比如动画、可视化、Vue 页面、Canvas、图表、滑块实验。
- `blog/posts/`：放普通 Markdown 文章，比如技术笔记、问题复盘、数学推导、工具链记录。

首页和文章列表通过 `blog/content.json` 自动生成文章卡片。

仓库根目录保留空的 `.nojekyll` 文件，尽量让 GitHub Pages 按纯静态文件发布。文章阅读页也会在原始 `.md` 不可用时回退读取 Jekyll 生成的同名 `.html`。

## 目录结构

```text
SystemBlog/
  index.html
  about.html
  blog/
    index.html
    article.html
    content.json
    labs/
      ldpc-decoder-demo-tabs.html
    posts/
      site-structure.md
    assets/
      wechat-reward-code.png
  css/
    style.css
  js/
    main.js
    content-list.js
    markdown-reader.js
  scripts/
    generate-content.js
```

## 新增 Markdown 文章

在 `blog/posts/` 下新建一个 `.md` 文件，例如：

```text
blog/posts/my-note.md
```

推荐在文件开头写 front matter：

```md
---
title: 我的笔记标题
category: 工具链
summary: 这是一句话摘要，会显示在文章列表里。
date: 2026-06-21
---

# 我的笔记标题

正文内容写在这里。
```

文章访问地址会是：

```text
blog/article.html?post=my-note
```

如果 Markdown 放在子目录里，例如：

```text
blog/posts/fpga/usb-blaster.md
```

访问地址就是：

```text
blog/article.html?post=fpga/usb-blaster
```

## 新增 HTML 交互实验

在 `blog/labs/` 下新建一个完整 HTML 文件，例如：

```text
blog/labs/kalman-filter.html
```

推荐在 HTML 的 `<head>` 里加博客元数据注释：

```html
<!--
blog-title: Kalman Filter 可视化
blog-category: 信号处理
blog-summary: 用动画展示 Kalman Filter 的预测、观测和更新过程。
blog-date: 2026-06-21
-->
```

页面访问地址会是：

```text
blog/labs/kalman-filter.html
```

## 更新文章列表

新增或删除 `blog/labs/`、`blog/posts/` 下的文件后，运行生成脚本：

```powershell
node scripts\generate-content.js
```

脚本会扫描：

```text
blog/labs/
blog/posts/
```

然后自动更新：

```text
blog/content.json
```

首页 `index.html` 和文章列表 `blog/index.html` 会读取 `content.json`，自动显示最新内容。

## 为什么脚本是 JS

脚本用 JavaScript 是因为这个项目本身就是静态前端项目，页面里的交互逻辑也在 `js/` 目录下。

运行脚本只需要 Node.js，不需要安装额外依赖：

```powershell
node scripts\generate-content.js
```

这个脚本只用到了 Node.js 自带的 `fs` 和 `path` 模块，所以没有 `package.json`、没有 `npm install`，也不会引入复杂构建流程。

## 本地预览

如果只是看普通 HTML，可以直接打开 `index.html`。

但 Markdown 阅读页 `blog/article.html` 使用 `fetch()` 读取 `.md` 文件，直接双击打开时可能会被浏览器安全策略拦截。建议用本地静态服务器预览：

```powershell
cd D:\AI\SystemBlog
python -m http.server 8080
```

然后访问：

```text
http://127.0.0.1:8080/
```

停止服务器时，在运行服务器的终端按 `Ctrl+C`。

## 发布到 GitHub Pages

更新内容后执行：

```powershell
git status
git add .
git commit -m "Update blog content"
git push
```

GitHub Pages 会从仓库里的静态文件发布网站。

## 日常写作流程

1. 把 Markdown 放进 `blog/posts/`，或把交互 HTML 放进 `blog/labs/`。
2. 运行 `node scripts\generate-content.js`。
3. 本地预览确认页面正常。
4. `git add . && git commit && git push`。

这套流程的核心是：文件负责内容，`content.json` 负责索引，GitHub Pages 负责托管。
