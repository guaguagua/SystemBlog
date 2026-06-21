(function () {
    const mount = document.getElementById("markdownArticle");

    if (!mount) {
        return;
    }

    const params = new URLSearchParams(window.location.search);
    const post = params.get("post") || "site-structure";
    const safePost = /^[a-z0-9-]+$/i.test(post) ? post : "site-structure";

    if (window.marked) {
        marked.setOptions({
            gfm: true,
            breaks: false
        });
    }

    fetch(`posts/${safePost}.md`)
        .then((response) => {
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            return response.text();
        })
        .then((markdown) => {
            mount.innerHTML = window.marked
                ? marked.parse(markdown)
                : `<pre>${markdown.replace(/[&<>"']/g, (char) => ({
                    "&": "&amp;",
                    "<": "&lt;",
                    ">": "&gt;",
                    "\"": "&quot;",
                    "'": "&#39;"
                }[char]))}</pre>`;
        })
        .catch(() => {
            mount.innerHTML = [
                "<h1>文章加载失败</h1>",
                "<p>没有找到这篇 Markdown，或者当前浏览器阻止了本地文件读取。</p>",
                "<p>部署到 GitHub Pages 后可以正常通过 HTTP 加载；本地预览建议用一个静态服务器打开。</p>"
            ].join("");
        });
}());
