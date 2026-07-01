(function () {
    const currentScript = document.currentScript;
    const scriptSrc = currentScript?.getAttribute("src") || "";
    const root = currentScript?.dataset.root || scriptSrc.replace(/js\/site-header\.js(?:[?#].*)?$/, "");

    const navItems = [
        { key: "home", label: "首页", href: "index.html" },
        { key: "blog", label: "文章", href: "blog/" },
        { key: "tools", label: "工具", href: "tools/" },
        { key: "about", label: "关于", href: "about.html" }
    ];

    function withRoot(path) {
        return `${root}${path}`;
    }

    function ensureStyle() {
        if (document.getElementById("site-header-component-style")) return;

        const style = document.createElement("style");
        style.id = "site-header-component-style";
        style.textContent = `
.site-header {
    position: sticky;
    top: 0;
    z-index: 40;
    border-bottom: 1px solid rgba(216, 222, 232, 0.86);
    background: rgba(246, 248, 251, 0.9);
    backdrop-filter: blur(18px);
}

.nav-shell {
    width: min(var(--site-header-width, 1120px), calc(100% - 32px));
    min-height: 68px;
    margin: 0 auto;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 18px;
}

.brand,
.nav-links {
    display: flex;
    align-items: center;
}

.brand {
    gap: 10px;
    color: var(--ink, var(--text, #17202a));
    font-weight: 800;
    text-decoration: none;
}

.brand-mark {
    width: 34px;
    height: 34px;
    display: grid;
    place-items: center;
    border-radius: 8px;
    color: #fff;
    background: linear-gradient(135deg, var(--ink, #17202a), var(--accent, #2563eb));
    box-shadow: 0 8px 22px rgba(23, 37, 84, 0.22);
}

.nav-links {
    gap: 6px;
    flex-wrap: wrap;
    justify-content: flex-end;
}

.nav-links a {
    min-width: 54px;
    padding: 8px 12px;
    border-radius: 8px;
    color: var(--muted, #627084);
    text-align: center;
    font-weight: 650;
    text-decoration: none;
}

.nav-links a:hover,
.nav-links a[aria-current="page"] {
    color: var(--text, var(--ink, #17202a));
    background: rgba(255, 255, 255, 0.72);
}

@media (max-width: 680px) {
    .nav-shell {
        min-height: 0;
        padding: 12px 0;
        align-items: flex-start;
        flex-direction: column;
    }

    .nav-links {
        width: 100%;
        justify-content: space-between;
    }

    .nav-links a {
        flex: 1;
    }
}
`;
        document.head.appendChild(style);
    }

    function renderHeader(target) {
        const active = target.dataset.active || "";
        const width = target.dataset.width || "";
        const widthStyle = width ? ` style="--site-header-width: ${width}"` : "";
        const links = navItems.map((item) => {
            const current = item.key === active ? ' aria-current="page"' : "";
            return `<a href="${withRoot(item.href)}"${current}>${item.label}</a>`;
        }).join("");

        target.outerHTML = `
<header class="site-header"${widthStyle}>
    <nav class="nav-shell" aria-label="主导航">
        <a class="brand" href="${withRoot("index.html")}" aria-label="SystemBlog 首页">
            <span class="brand-mark">S</span>
            <span>SystemBlog</span>
        </a>
        <div class="nav-links">
            ${links}
        </div>
    </nav>
</header>`;
    }

    function updateScrolledState() {
        const header = document.querySelector(".site-header");
        if (header) {
            header.dataset.scrolled = window.scrollY > 8 ? "true" : "false";
        }
    }

    function renderAll() {
        const targets = document.querySelectorAll("[data-site-header]");
        if (!targets.length) return;

        ensureStyle();
        targets.forEach(renderHeader);
        updateScrolledState();
        window.addEventListener("scroll", updateScrolledState, { passive: true });
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", renderAll, { once: true });
    } else {
        renderAll();
    }
}());
