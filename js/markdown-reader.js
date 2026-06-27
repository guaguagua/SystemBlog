(function () {
    const mount = document.getElementById("markdownArticle");

    if (!mount) {
        return;
    }

    const params = new URLSearchParams(window.location.search);
    const post = params.get("post") || "site-structure";
    const isSafePost = post
        && !post.includes("..")
        && !post.includes("\\")
        && !post.includes(":")
        && !post.startsWith("/");
    const safePost = isSafePost ? post : "site-structure";

    const escapeHtml = (value) => String(value || "").replace(/[&<>"']/g, (char) => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        "\"": "&quot;",
        "'": "&#39;"
    }[char]));

    const fetchText = (url) => fetch(url).then((response) => {
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        return response.text();
    });

    const stripFrontMatter = (markdown) => markdown.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/, "");

    const createMarkdownRenderer = () => {
        if (!window.markdownit) {
            return null;
        }

        return window.markdownit({
            html: true,
            linkify: true,
            typographer: false,
            breaks: false,
            highlight(code, language) {
                if (!window.hljs) {
                    return escapeHtml(code);
                }

                if (language && hljs.getLanguage(language)) {
                    return hljs.highlight(code, { language, ignoreIllegals: true }).value;
                }

                return hljs.highlightAuto(code).value;
            }
        });
    };

    const markdownRenderer = createMarkdownRenderer();

    const renderMath = (formula, displayMode) => {
        if (!window.katex) {
            return escapeHtml(displayMode ? `$$${formula}$$` : `$${formula}$`);
        }
        try {
            return katex.renderToString(formula.trim(), { displayMode, throwOnError: false });
        } catch (_) {
            return escapeHtml(displayMode ? `$$${formula}$$` : `$${formula}$`);
        }
    };

    const renderMarkdown = (markdown) => {
        const body = stripFrontMatter(markdown);

        if (!markdownRenderer) {
            mount.innerHTML = `<pre>${escapeHtml(body)}</pre>`;
            return;
        }

        // Extract math regions before markdown-it runs to prevent
        // underscore/asterisk mangling inside LaTeX expressions.
        const mathStore = [];
        const PHFX = "QMTH";
        const PHSFX = "QEND";

        let src = body.replace(/\$\$([\s\S]*?)\$\$/g, (_, f) => {
            mathStore.push({ display: true, formula: f });
            return `${PHFX}${mathStore.length - 1}${PHSFX}`;
        });
        src = src.replace(/\$([^\$\n]+?)\$/g, (_, f) => {
            mathStore.push({ display: false, formula: f });
            return `${PHFX}${mathStore.length - 1}${PHSFX}`;
        });

        const phRe = new RegExp(`${PHFX}(\\d+)${PHSFX}`, "g");
        let html = markdownRenderer.render(src).replace(phRe, (_, idx) => {
            const { display, formula } = mathStore[Number(idx)];
            return renderMath(formula, display);
        });

        mount.innerHTML = html;
    };

    const renderJekyllHtml = (html) => {
        const documentFragment = new DOMParser().parseFromString(html, "text/html");
        const renderedBody = documentFragment.querySelector(".markdown-body");

        if (!renderedBody) {
            throw new Error("Missing rendered Markdown body");
        }

        renderedBody.querySelectorAll("script").forEach((script) => script.remove());

        const siteHeading = renderedBody.querySelector("h1:first-child a");
        if (siteHeading && siteHeading.textContent.trim() === "SystemBlog") {
            siteHeading.closest("h1").remove();
        }

        mount.innerHTML = renderedBody.innerHTML;
    };

    const renderError = () => {
        mount.innerHTML = [
            "<h1>文章加载失败</h1>",
            "<p>没有找到这篇 Markdown，或者当前浏览器阻止了本地文件读取。</p>",
            "<p>部署到 GitHub Pages 后可以正常通过 HTTP 加载；本地预览建议用一个静态服务器打开。</p>"
        ].join("");
    };

    fetchText(`${safePost}.md`)
        .then(renderMarkdown)
        .catch(() => fetchText(`${safePost}.html`).then(renderJekyllHtml))
        .catch(renderError);
}());
