import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

const outputHtml = path.join(rootDir, "merchant-admin-export.html");
const outputPdf = path.join(rootDir, "merchant-admin-export.pdf");

const includeFiles = [
  "package.json",
  "src/App.jsx",
  "src/routes/ProtectedRoutes.jsx",
  "src/store/AppContext.jsx",
  "src/styles/global.css",
  "src/utils/customization.js",
  "src/utils/format.js",
  "src/utils/storage.js",
  "src/components/MerchantDesktopSidebar.jsx",
  "src/components/MerchantOptionGroupManager.jsx",
  "src/components/ProductCustomizationModal.jsx",
  "src/components/CartDrawer.jsx",
  "src/components/PrintTicket.jsx",
  "src/pages/MerchantDashboardPage.jsx",
  "src/pages/MerchantMenuPage.jsx",
  "src/pages/MerchantOrdersPage.jsx",
  "src/pages/MerchantSettingsPage.jsx",
  "src/pages/PrintTicketPage.jsx",
  "src/pages/StorePage.jsx",
  "src/pages/CartPage.jsx",
  "src/pages/CheckoutPage.jsx"
];

const escapeHtml = (value) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");

function buildHtml(sections, treeText) {
  return `<!DOCTYPE html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <title>Export Admin Loja</title>
    <style>
      :root {
        --bg: #f4efe7;
        --paper: #fffdf8;
        --ink: #1c1917;
        --muted: #6b625a;
        --accent: #8b5e3c;
        --line: #d8cbb8;
      }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        font-family: Georgia, "Times New Roman", serif;
        background:
          radial-gradient(circle at top, rgba(139, 94, 60, 0.12), transparent 28%),
          linear-gradient(180deg, #f7f1e8 0%, var(--bg) 100%);
        color: var(--ink);
      }
      main { max-width: 960px; margin: 0 auto; padding: 40px 28px 64px; }
      .cover, section.file {
        background: var(--paper);
        border: 1px solid var(--line);
      }
      .cover { padding: 28px; margin-bottom: 24px; }
      section.file { padding: 20px; margin-bottom: 18px; page-break-inside: avoid; }
      h1, h2 { margin: 0 0 12px; font-weight: 700; }
      h1 { font-size: 30px; }
      h2 { font-size: 20px; color: var(--accent); page-break-after: avoid; }
      p, li { font-size: 14px; line-height: 1.5; }
      .meta { color: var(--muted); }
      .tree, pre {
        white-space: pre-wrap;
        word-break: break-word;
        font-family: "Cascadia Code", Consolas, monospace;
        font-size: 11px;
        line-height: 1.45;
        background: #f8f5ef;
        border: 1px solid var(--line);
        padding: 16px;
      }
      .path {
        display: inline-block;
        margin-bottom: 12px;
        color: var(--muted);
        font-size: 12px;
      }
      @page { margin: 16mm 10mm; }
    </style>
  </head>
  <body>
    <main>
      <section class="cover">
        <h1>Export Admin da Loja</h1>
        <p class="meta">Arquivos principais do painel da loja, fluxo de montagem, carrinho e pedido.</p>
        <h2>Arquivos incluidos</h2>
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
    "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe"
  ];

  for (const candidate of chromeCandidates) {
    try {
      await fs.access(candidate);
      await new Promise((resolve, reject) => {
        const child = spawn(candidate, [
          "--headless=new",
          "--disable-gpu",
          "--allow-file-access-from-files",
          `--print-to-pdf=${pdfPath}`,
          htmlPath
        ], { stdio: "ignore" });
        child.on("exit", (code) => (code === 0 ? resolve() : reject(new Error(`Falha ao imprimir PDF. Codigo: ${code}`))));
        child.on("error", reject);
      });
      return;
    } catch {
      // Try next executable.
    }
  }

  throw new Error("Chrome/Edge nao encontrado para gerar o PDF.");
}

async function main() {
  const sections = [];

  for (const relativePath of includeFiles) {
    const filePath = path.join(rootDir, relativePath);
    const content = await fs.readFile(filePath, "utf8");
    sections.push(`
      <section class="file">
        <h2>${escapeHtml(path.basename(relativePath))}</h2>
        <span class="path">${escapeHtml(relativePath)}</span>
        <pre>${escapeHtml(content)}</pre>
      </section>
    `);
  }

  const html = buildHtml(sections, includeFiles.map((file) => `- ${file}`).join("\n"));
  await fs.writeFile(outputHtml, html, "utf8");
  await chromePrint(outputHtml, outputPdf);

  console.log(`HTML: ${outputHtml}`);
  console.log(`PDF: ${outputPdf}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
