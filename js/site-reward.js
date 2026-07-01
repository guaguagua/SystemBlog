(function () {
    const currentScript = document.currentScript;
    const scriptSrc = currentScript?.getAttribute("src") || "";
    const root = currentScript?.dataset.root || scriptSrc.replace(/js\/site-reward\.js(?:[?#].*)?$/, "");

    function withRoot(path) {
        return `${root}${path}`;
    }

    function ensureStyle() {
        if (document.getElementById("site-reward-component-style")) return;

        const style = document.createElement("style");
        style.id = "site-reward-component-style";
        style.textContent = `
.site-reward {
    position: relative;
    z-index: 2;
    width: min(1120px, calc(100% - 32px));
    margin: 64px auto 0;
    padding: 40px 16px;
    border-top: 1px solid #d8dee9;
    text-align: center;
    font-family: "Segoe UI", "Microsoft YaHei", Arial, sans-serif;
}

.site-reward .reward-eyebrow {
    margin: 0 0 8px;
    color: #0f766e;
    font-size: 0.72rem;
    font-weight: 800;
    letter-spacing: 0.08em;
    text-transform: uppercase;
}

.site-reward .reward-title {
    margin: 0 0 4px;
    color: #172033;
    font-size: 1.1rem;
    font-weight: 700;
}

.site-reward .reward-code {
    display: block;
    width: 220px;
    max-width: min(220px, 100%);
    height: auto;
    margin: 16px auto 0;
    border-radius: 8px;
}

.site-reward .reward-caption {
    margin: 8px 0 2px;
    color: #667085;
    font-size: 0.85rem;
}

.site-reward .reward-note {
    margin: 0;
    color: #667085;
    font-size: 0.85rem;
}
`;
        document.head.appendChild(style);
    }

    function renderReward(target) {
        target.outerHTML = `
<section class="site-reward" id="site-reward" aria-label="赞赏支持">
    <p class="reward-eyebrow">Reward</p>
    <p class="reward-title">赞赏支持</p>
    <img class="reward-code" src="${withRoot("images/wechat-reward-code3.png")}" alt="微信赞赏码">
    <p class="reward-caption">微信扫码赞赏</p>
    <p class="reward-note">觉得有帮助的话，请我喝杯咖啡 ☕</p>
</section>`;
    }

    function renderAll() {
        const targets = document.querySelectorAll("[data-site-reward]");
        if (!targets.length) return;

        ensureStyle();
        targets.forEach(renderReward);
        if (window.location.hash === "#site-reward") {
            window.setTimeout(() => document.getElementById("site-reward")?.scrollIntoView(), 0);
        }
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", renderAll, { once: true });
    } else {
        renderAll();
    }
}());
