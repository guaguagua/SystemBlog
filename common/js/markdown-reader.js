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

    const parseFrontMatter = (markdown) => {
        const match = markdown.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
        const data = {};

        if (match) {
            match[1].split(/\r?\n/).forEach((line) => {
                const field = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
                if (field) {
                    data[field[1]] = field[2].trim().replace(/^["']|["']$/g, "");
                }
            });
        }

        return { data, body: match ? markdown.slice(match[0].length) : markdown };
    };

    const setArticleMetadata = (markdown) => {
        const { data, body } = parseFrontMatter(markdown);
        const heading = body.match(/^#\s+(.+)$/m);
        const title = data.title || (heading && heading[1].trim()) || "文章";
        const firstParagraph = body
            .replace(/^#\s+.+$/m, "")
            .split(/\r?\n\s*\r?\n/)
            .map((part) => part.trim())
            .find((part) => part && !part.startsWith("#") && !part.startsWith("```"));
        const description = (data.summary || firstParagraph || "SystemBlog 技术文章。")
            .replace(/\s+/g, " ")
            .slice(0, 160);
        const canonicalUrl = new URL(window.location.pathname, window.location.origin);
        canonicalUrl.searchParams.set("post", safePost);

        document.title = `${title} | SystemBlog`;
        document.querySelector('meta[name="description"]').content = description;

        const canonical = document.createElement("link");
        canonical.rel = "canonical";
        canonical.href = canonicalUrl.href;
        document.head.appendChild(canonical);

        const structuredData = document.createElement("script");
        structuredData.type = "application/ld+json";
        structuredData.textContent = JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BlogPosting",
            headline: title,
            description,
            datePublished: data.date || undefined,
            articleSection: data.category || undefined,
            inLanguage: "zh-CN",
            url: canonicalUrl.href,
            isPartOf: {
                "@type": "Blog",
                name: "SystemBlog",
                url: new URL("../", window.location.href).href
            }
        });
        document.head.appendChild(structuredData);
    };

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
                if (language === 'mermaid') {
                    return escapeHtml(code);
                }

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
        const { body } = parseFrontMatter(markdown);
        setArticleMetadata(markdown);

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
        renderMermaidBlocks();
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
        renderMermaidBlocks();
    };

    const renderMermaidBlocks = () => {
        if (!window.mermaid) return;
        const blocks = mount.querySelectorAll('pre code.language-mermaid');
        if (!blocks.length) return;
        blocks.forEach((codeEl) => {
            const pre = codeEl.parentElement;
            const div = document.createElement('div');
            div.className = 'mermaid';
            div.textContent = codeEl.textContent;
            pre.replaceWith(div);
        });
        mermaid.initialize({ startOnLoad: false, theme: 'default' });
        mermaid.run({ nodes: Array.from(mount.querySelectorAll('.mermaid')) });
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
