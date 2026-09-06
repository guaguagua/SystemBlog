# 方块飞行 · Block Wings

在线地址：https://guaguagua.github.io/SystemBlog/blog/game/block-wings/

移动鼠标或拖动手指驾驶，自动射击。50 个单词与 50 个短句分成五关，每关 A/B 两组。方块依次以中文、英文、中文短句、英文短句出现，击中才发音，英文短句释放粒子魔法。

## 构建与打包

在本目录运行：

```
npm ci
npm run package
```

`index.template.html` 是页面源文件；根目录 JS/CSS 是游戏源码。构建生成 `dist/game.min.js`、`dist/game.min.css` 和带构建版本的 `index.html`。将本目录提交到 GitHub Pages 即可在线游玩，不需要服务器端程序。

`downloads/block-wings.zip` 是完整游玩包，包含引擎、图片及 200 个语音文件，不包含 node_modules、测试及预览素材。解压后运行 `python open-game.py` 自动打开本地网页；本地启动需要 Python 3，在线游玩只需要浏览器。

## 本地测试

在仓库根目录运行 `python -m http.server 8765 --bind 127.0.0.1`，然后访问 `/blog/game/block-wings/`。验证脚本在 `scripts/`；完整五关为 `verify-phaser.cjs`，魔法为 `verify-magic-particles.cjs`。

素材来源与许可见 `SOURCES.md` 和 `vendor/`。开发记录见 `CHANGELOG.md`。
