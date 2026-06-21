const fs = require("fs");
const path = require("path");

const rootDir = path.resolve(__dirname, "..");
const blogDir = path.join(rootDir, "blog");
const labsDir = path.join(blogDir, "labs");
const postsDir = path.join(blogDir, "posts");
const outputPath = path.join(blogDir, "content.json");

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

const stripHtml = (html) => html
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
        draft: data.draft === "true"
    };
};

const parseLabPage = (filePath) => {
    const html = readText(filePath);
    const data = metadataFromHtmlComment(html);
    const relative = path.relative(labsDir, filePath).replace(/\\/g, "/");
    const slug = relative.replace(/\.html$/i, "");
    const titleTag = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    const h1 = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
    const description = html.match(/<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i);
    const firstParagraph = html.match(/<p[^>]*>([\s\S]*?)<\/p>/i);

    return {
        type: "lab",
        slug,
        source: `labs/${relative}`,
        url: `labs/${relative}`,
        title: data.title || stripHtml(h1 && h1[1]) || stripHtml(titleTag && titleTag[1]) || titleFromSlug(path.basename(slug)),
        category: data.category || "labs",
        summary: cleanSummary(data.summary || (description && description[1]) || stripHtml(firstParagraph && firstParagraph[1]) || "可交互 HTML 实验。"),
        date: data.date || "",
        draft: data.draft === "true"
    };
};

const sortItems = (a, b) => {
    if (a.date && b.date && a.date !== b.date) {
        return b.date.localeCompare(a.date);
    }
    if (a.type !== b.type) {
        return a.type === "lab" ? -1 : 1;
    }
    return a.title.localeCompare(b.title, "zh-CN");
};

const items = [
    ...listFiles(labsDir, ".html").map(parseLabPage),
    ...listFiles(postsDir, ".md").map(parseMarkdownPost)
].sort(sortItems);

fs.writeFileSync(outputPath, `${JSON.stringify(items, null, 2)}\n`, "utf8");

console.log(`Generated ${path.relative(rootDir, outputPath)} with ${items.length} item(s).`);
