import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

const outputHtml = path.join(rootDir, "project-export.html");
const outputPdf = path.join(rootDir, "project-export.pdf");

const includeFiles = [
  "package.json",
  "vite.config.js",
  "index.html",
];

const includeDirs = ["src", "public"];
const skipExtensions = new Set([
  ".png",
  ".jpg",
  ".jpeg",
  ".gif",
  ".webp",
  ".ico",
  ".svg",
  ".pdf",
  ".zip",
  ".mp4",
  ".mp3",
]);

const escapeHtml = (value) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");

async function walk(dirPath) {
  const entries = await fs.readdir(dirPath, { withFileTypes: true });
  const files = [];

  for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await walk(fullPath)));
      continue;
    }

    const ext = path.extname(entry.name).toLowerCase();
    if (skipExtensions.has(ext)) {
      continue;
    }

    files.push(fullPath);
  }

  return files;
}

async function collectFiles() {
  const files = [];

  for (const relativePath of includeFiles) {
    const fullPath = path.join(rootDir, relativePath);
    try {
      await fs.access(fullPath);
      files.push(fullPath);
    } catch {
      // Ignore missing optional files.
    }
  }

  for (const dir of includeDirs) {
    const fullPath = path.join(rootDir, dir);
    try {
      await fs.access(fullPath);
      files.push(...(await walk(fullPath)));
    } catch {
      // Ignore missing optional directories.
    }
  }

  return files;
}

function buildTree(relativePaths) {
  return relativePaths.map((file) => `- ${file}`).join("\n");
}

function buildHtml(sections, treeText) {
  return `<!DOCTYPE html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <title>Export do Projeto</title>
    <style>
      :root {
        --bg: #f4efe7;
        --paper: #fffdf8;
        --ink: #1c1917;
        --muted: #6b625a;
        --accent: #8b5e3c;
        --line: #d8cbb8;
      }

      * {
        box-sizing: border-box;
      }

      body {
        margin: 0;
        font-family: Georgia, "Times New Roman", serif;
        background:
          radial-gradient(circle at top, rgba(139, 94, 60, 0.12), transparent 28%),
          linear-gradient(180deg, #f7f1e8 0%, var(--bg) 100%);
        color: var(--ink);
      }

      main {
        max-width: 960px;
        margin: 0 auto;
        padding: 40px 28px 64px;
      }

      .cover {
        background: var(--paper);
        border: 1px solid var(--line);
        padding: 28px;
        margin-bottom: 24px;
      }

      h1,
      h2 {
        margin: 0 0 12px;
        font-weight: 700;
      }

      h1 {
        font-size: 30px;
      }

      h2 {
        font-size: 20px;
        color: var(--accent);
        page-break-after: avoid;
      }

      p,
      li {
        font-size: 14px;
        line-height: 1.5;
      }

      .meta {
        color: var(--muted);
      }

      .tree,
      pre {
        white-space: pre-wrap;
        word-break: break-word;
        font-family: "Cascadia Code", Consolas, monospace;
        font-size: 11px;
        line-height: 1.45;
        background: #f8f5ef;
        border: 1px solid var(--line);
        padding: 16px;
      }

      section.file {
        background: var(--paper);
        border: 1px solid var(--line);
        padding: 20px;
        margin-bottom: 18px;
        page-break-inside: avoid;
      }

      .path {
        display: inline-block;
        margin-bottom: 12px;
        color: var(--muted);
        font-size: 12px;
      }

      @page {
        margin: 16mm 10mm;
      }
    </style>
  </head>
  <body>
    <main>
      <section class="cover">
        <h1>Export do Projeto</h1>
        <p class="meta">Gerado automaticamente para compartilhar no ChatGPT.</p>
        <h2>Arquivos incluídos</h2>
        <div class="tree">${escapeHtml(treeText)}</div>
      </section>
      ${sections.join("\n")}
    </main>
  </body>
</html>`;
}

async function chromePrint(htmlPath, pdfPath) {
  const chromeCandidates = [
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
    "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  ];

  const executable = await (async () => {
    for (const candidate of chromeCandidates) {
      try {
        await fs.access(candidate);
        return candidate;
      } catch {
        // Try next candidate.
      }
    }
    throw new Error("Chrome/Edge não encontrado para gerar o PDF.");
  })();

  await new Promise((resolve, reject) => {
    const args = [
      "--headless=new",
      "--disable-gpu",
      "--allow-file-access-from-files",
      `--print-to-pdf=${pdfPath}`,
      htmlPath,
    ];

    const child = spawn(executable, args, { stdio: "ignore" });
    child.on("exit", (code) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(new Error(`Falha ao imprimir PDF. Código: ${code}`));
    });
    child.on("error", reject);
  });
}

async function main() {
  const files = await collectFiles();
  const relativePaths = files.map((file) => path.relative(rootDir, file));
  const sections = [];

  for (const filePath of files) {
    const relativePath = path.relative(rootDir, filePath);
    const content = await fs.readFile(filePath, "utf8");
    sections.push(`
      <section class="file">
        <h2>${escapeHtml(path.basename(relativePath))}</h2>
        <span class="path">${escapeHtml(relativePath)}</span>
        <pre>${escapeHtml(content)}</pre>
      </section>
    `);
  }

  const html = buildHtml(sections, buildTree(relativePaths));
  await fs.writeFile(outputHtml, html, "utf8");
  await chromePrint(outputHtml, outputPdf);

  console.log(`HTML: ${outputHtml}`);
  console.log(`PDF: ${outputPdf}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
