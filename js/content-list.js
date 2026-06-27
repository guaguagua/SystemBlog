(function () {
    const mount = document.getElementById("contentList");

    if (!mount) {
        return;
    }

    const contentSrc = mount.dataset.contentSrc || "content.json";
    const urlPrefix = mount.dataset.urlPrefix || "";
    const limit = Number.parseInt(mount.dataset.limit || "0", 10);

    const escapeHtml = (value) => String(value || "").replace(/[&<>"']/g, (char) => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        "\"": "&quot;",
        "'": "&#39;"
    }[char]));

    const normalizeUrl = (item) => {
        if (item.type === "post") {
            return `${urlPrefix}article.html?post=${encodeURIComponent(item.source.replace(/\.(md|html)$/i, ""))}`;
        }

        return `${urlPrefix}${item.url}`;
    };

    const renderItem = (item, index) => {
        const typeLabel = item.type === "lab" ? "交互实验" : "Markdown 笔记";
        const sourceLabel = item.type === "lab" ? "labs" : (item.source ? item.source.split("/")[0] : "posts");
        const category = item.category || sourceLabel;
        const featured = index === 0 ? " featured" : "";

        return [
            `<article class="post-card${featured}">`,
            `  <div class="post-meta">${escapeHtml(typeLabel)} · ${escapeHtml(category)}</div>`,
            `  <h3><a href="${escapeHtml(normalizeUrl(item))}">${escapeHtml(item.title)}</a></h3>`,
            `  <p>${escapeHtml(item.summary || "暂无摘要。")}</p>`,
            "</article>"
        ].join("");
    };

    fetch(contentSrc)
        .then((response) => {
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            return response.json();
        })
        .then((items) => {
            const visibleItems = Array.isArray(items)
                ? items.filter((item) => {
                    if (!item || item.draft === true) {
                        return false;
                    }

                    // Keep conversation notes addressable by URL but hidden from public lists.
                    return !(item.type === "post" && typeof item.source === "string" && item.source.startsWith("conversations/"));
                })
                : [];
            const limitedItems = limit > 0 ? visibleItems.slice(0, limit) : visibleItems;

            if (limitedItems.length) {
                mount.innerHTML = limitedItems.map(renderItem).join("");
            }
        })
        .catch(() => {
            // Keep the static fallback cards already present in the HTML.
        });
}());
