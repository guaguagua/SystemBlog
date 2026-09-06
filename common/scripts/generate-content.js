const fs = require("fs");
const path = require("path");

const rootDir = path.resolve(__dirname, "..", "..");
const blogDir = path.join(rootDir, "blog");
const labsDir = path.join(blogDir, "labs");
const postsDir = path.join(blogDir, "posts");
const gamesDir = path.join(blogDir, "game");
const outputPath = path.join(blogDir, "content.json");
const siteUrl = (process.env.SITE_URL || "https://guaguagua.github.io/SystemBlog").replace(/\/$/, "");

const readText = (filePath) => fs.readFileSync(filePath, "utf8");

const listFiles = (dirPath, extension) => {
    if (!fs.existsSync(dirPath)) {
        return [];
    }

    return fs.readdirSync(dirPath, { withFileTypes: true })
        .flatMap((entry) => {
            const fullPath = path.join(dirPath, entry.name);
            if (entry.isDirectory()) {
                return listFiles(fullPath, extension);
            }
            return entry.isFile() && entry.name.toLowerCase().endsWith(extension)
                ? [fullPath]
                : [];
        });
};

const stripHtml = (html) => String(html || "")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const cleanSummary = (value) => String(value || "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 160);

const titleFromSlug = (slug) => slug
    .split(/[-_]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

const parseFrontMatter = (markdown) => {
    const match = markdown.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
    if (!match) {
        return { data: {}, body: markdown };
    }

    const data = {};
    match[1].split(/\r?\n/).forEach((line) => {
        const field = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
        if (field) {
            data[field[1].trim()] = field[2].trim().replace(/^["']|["']$/g, "");
        }
    });

    return {
        data,
        body: markdown.slice(match[0].length)
    };
};

const metadataFromHtmlComment = (html) => {
    const data = {};
    const comments = html.match(/<!--[\s\S]*?-->/g) || [];

    comments.forEach((comment) => {
        comment.replace(/<!--|-->/g, "").split(/\r?\n/).forEach((line) => {
            const field = line.match(/^\s*blog-([A-Za-z0-9_-]+):\s*(.*?)\s*$/);
            if (field) {
                data[field[1].trim()] = field[2].trim();
            }
        });
    });

    return data;
};

const parseMarkdownPost = (filePath) => {
    const markdown = readText(filePath);
    const { data, body } = parseFrontMatter(markdown);
    const relative = path.relative(postsDir, filePath).replace(/\\/g, "/");
    const slug = relative.replace(/\.md$/i, "");
    const heading = body.match(/^#\s+(.+)$/m);
    const firstParagraph = body
        .replace(/^#\s+.+$/m, "")
        .split(/\r?\n\s*\r?\n/)
        .map((part) => part.trim())
        .find((part) => part && !part.startsWith("```"));

    return {
        type: "post",
        slug,
        source: `posts/${relative}`,
        title: data.title || (heading && heading[1].trim()) || titleFromSlug(path.basename(slug)),
        category: data.category || "posts",
        summary: cleanSummary(data.summary || firstParagraph || "Markdown 技术笔记。"),
        date: data.date || "",
        ...(data.published ? { published: data.published } : {}),
        draft: data.draft === "true"
    };
};

const parseLabPage = (filePath, baseDir = labsDir, type = "lab") => {
    const html = readText(filePath);
    const data = metadataFromHtmlComment(html);
    const relative = path.relative(baseDir, filePath).replace(/\\/g, "/");
    const slug = relative.replace(/\/index\.html$/i, "").replace(/\.html$/i, "");
    const source = path.relative(blogDir, filePath).replace(/\\/g, "/");
    const titleTag = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    const h1 = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
    const description = html.match(/<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i);
    const firstParagraph = html.match(/<p[^>]*>([\s\S]*?)<\/p>/i);

    return {
        type,
        slug,
        source,
        url: type === "game" ? source.replace(/index\.html$/i, "") : source,
        title: data.title || stripHtml(titleTag && titleTag[1]) || stripHtml(h1 && h1[1]) || titleFromSlug(path.basename(slug)),
        category: data.category || "labs",
        summary: cleanSummary(data.summary || (description && description[1]) || stripHtml(firstParagraph && firstParagraph[1]) || "可交互 HTML 实验。"),
        date: data.date || "",
        ...(data.published ? { published: data.published } : {}),
        draft: data.draft === "true"
    };
};

const sortItems = (a, b) => {
    const aPublished = a.published || a.date;
    const bPublished = b.published || b.date;
    if (aPublished !== bPublished) {
        if (!aPublished) return 1;
        if (!bPublished) return -1;
        return bPublished.localeCompare(aPublished);
    }
    if (a.date !== b.date) {
        if (!a.date) return 1;
        if (!b.date) return -1;
        return b.date.localeCompare(a.date);
    }
    if (a.type !== b.type) {
        return a.type === "lab" ? -1 : 1;
    }
    return a.title.localeCompare(b.title, "zh-CN");
};

const items = [
    ...listFiles(labsDir, ".html").map(file => parseLabPage(file)),
    ...(fs.existsSync(gamesDir) ? fs.readdirSync(gamesDir, {withFileTypes:true})
        .filter(entry => entry.isDirectory())
        .map(entry => path.join(gamesDir, entry.name, "index.html"))
        .filter(file => fs.existsSync(file))
        .map(file => parseLabPage(file, gamesDir, "game")) : []),
    ...listFiles(postsDir, ".md").map(parseMarkdownPost)
].sort(sortItems);

fs.writeFileSync(outputPath, `${JSON.stringify(items, null, 2)}\n`, "utf8");

const publicItems = items.filter((item) => !item.draft);
const xmlEscape = (value) => String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
const itemUrl = (item) => item.type !== "post"
    ? `${siteUrl}/blog/${item.url}`
    : `${siteUrl}/blog/article.html?post=${encodeURIComponent(item.source.replace(/\.md$/i, "")).replace(/%2F/g, "/")}`;

const sitemapEntries = [
    { url: `${siteUrl}/`, date: "" },
    { url: `${siteUrl}/blog/`, date: "" },
    { url: `${siteUrl}/about.html`, date: "" },
    ...publicItems.map((item) => ({ url: itemUrl(item), date: item.date }))
];
const sitemap = [
    "<?xml version=\"1.0\" encoding=\"UTF-8\"?>",
    "<urlset xmlns=\"http://www.sitemaps.org/schemas/sitemap/0.9\">",
    ...sitemapEntries.map(({ url, date }) => [
        "  <url>",
        `    <loc>${xmlEscape(url)}</loc>`,
        date ? `    <lastmod>${xmlEscape(date)}</lastmod>` : "",
        "  </url>"
    ].filter(Boolean).join("\n")),
    "</urlset>",
    ""
].join("\n");

const llms = [
    "# SystemBlog",
    "",
    "> 中文个人技术博客，记录 AI Agent、LLM、MCP、信息论、编码理论、信号处理、系统与工程实验。",
    "",
    "内容包括可直接阅读的 Markdown 技术文章，以及可交互的 HTML 实验和演示。引用内容时请保留文章标题与原始链接。",
    "",
    "## 主要入口",
    "",
    `- [首页](${siteUrl}/): 博客介绍与最新内容。`,
    `- [全部文章](${siteUrl}/blog/): 完整文章与实验列表。`,
    `- [内容索引 JSON](${siteUrl}/blog/content.json): 结构化标题、分类、摘要、日期和路径。`,
    `- [站点地图](${siteUrl}/sitemap.xml): 所有公开页面 URL。`,
    "",
    "## 文章与实验",
    "",
    ...publicItems.flatMap((item) => {
        const links = [`- [${item.title}](${itemUrl(item)}): ${item.summary}`];
        if (item.type === "post") {
            links.push(`  - [Markdown 原文](${siteUrl}/blog/${item.source})`);
        }
        return links;
    }),
    ""
].join("\n");

const robots = [
    "User-agent: *",
    "Allow: /",
    "",
    `Sitemap: ${siteUrl}/sitemap.xml`,
    ""
].join("\n");

fs.writeFileSync(path.join(rootDir, "sitemap.xml"), sitemap, "utf8");
fs.writeFileSync(path.join(rootDir, "llms.txt"), llms, "utf8");
fs.writeFileSync(path.join(rootDir, "robots.txt"), robots, "utf8");

console.log(`Generated content index and discovery files with ${publicItems.length} public item(s).`);
