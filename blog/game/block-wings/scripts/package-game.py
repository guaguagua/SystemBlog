"""Build a playable ZIP without dependencies, tests, previews or source-only files."""
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED
import json

root = Path(__file__).resolve().parent.parent
output = root / 'downloads' / 'block-wings.zip'
output.parent.mkdir(exist_ok=True)
runtime = [root / 'index.html', root / 'SOURCES.md']
for folder in ['dist', 'vendor']:
    runtime.extend(p for p in (root / folder).rglob('*') if p.is_file())
for filename in ['coral-ocean.png', 'aircraft-v2.png', 'magic-v2.png']:
    runtime.append(root / 'assets' / filename)
for folder in ['speech', 'particles']:
    runtime.extend(p for p in (root / 'assets' / folder).rglob('*') if p.is_file())
launcher = '''from pathlib import Path
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from functools import partial
import webbrowser
root = Path(__file__).resolve().parent
server = ThreadingHTTPServer(('127.0.0.1', 0), partial(SimpleHTTPRequestHandler, directory=str(root)))
url = 'http://127.0.0.1:' + str(server.server_port) + '/'
print('Block Wings: ' + url + '\\nPress Ctrl+C to stop.')
webbrowser.open(url)
try:
    server.serve_forever()
except KeyboardInterrupt:
    pass
finally:
    server.server_close()
'''
with ZipFile(output, 'w', ZIP_DEFLATED, compresslevel=9) as archive:
    for file in sorted(runtime):
        name = 'block-wings/' + file.relative_to(root).as_posix()
        if file.name == 'index.html':
            text = file.read_text(encoding='utf-8').replace('href="../../../index.html"', 'href="https://guaguagua.github.io/SystemBlog/"')
            text = text.replace('<a class="download-game" href="downloads/block-wings.zip" download>下载游戏</a>', '')
            archive.writestr(name, text)
        else:
            archive.write(file, name)
    archive.writestr('block-wings/open-game.py', launcher)
    archive.writestr('block-wings/README.txt', '方块飞行 · Block Wings\n\n在线游玩：https://guaguagua.github.io/SystemBlog/blog/game/block-wings/\n\n本地运行：安装 Python 3 后，在解压目录执行 python open-game.py，浏览器会自动打开。请勿直接双击 index.html，游戏的素材加载需要 HTTP。\n\n所有游戏素材和语音均已包含，无需 Node.js、npm 或后端服务。移动鼠标或拖动手指驾驶；自动射击；英文短句触发魔法。\n')
report={'files':len(runtime)+2,'uncompressedBytes':sum(p.stat().st_size for p in runtime),'zipBytes':output.stat().st_size}
(root/'downloads/package.json').write_bytes((json.dumps(report,indent=2)+'\n').encode('utf-8'))
print(report)
