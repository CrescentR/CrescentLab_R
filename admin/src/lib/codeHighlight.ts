import { common, createLowlight } from "lowlight";

type HighlightNode = {
  type: string;
  tagName?: string;
  value?: string;
  properties?: { className?: string[] | string };
  children?: HighlightNode[];
};

const LANGUAGE_LABELS: Record<string, string> = {
  bash: "Bash",
  c: "C",
  cpp: "C++",
  csharp: "C#",
  css: "CSS",
  go: "Go",
  html: "HTML",
  java: "Java",
  javascript: "JavaScript",
  json: "JSON",
  markdown: "Markdown",
  plaintext: "Plaintext",
  python: "Python",
  rust: "Rust",
  sql: "SQL",
  typescript: "TypeScript",
  vue: "Vue",
  xml: "HTML",
  yaml: "YAML",
};

const TOKEN_COLORS: Record<string, string> = {
  "hljs-comment": "#9aa69e",
  "hljs-quote": "#9aa69e",
  "hljs-keyword": "#d8b4fe",
  "hljs-selector-tag": "#d8b4fe",
  "hljs-doctag": "#d8b4fe",
  "hljs-string": "#86efac",
  "hljs-regexp": "#86efac",
  "hljs-addition": "#86efac",
  "hljs-number": "#fdba74",
  "hljs-literal": "#fdba74",
  "hljs-symbol": "#fdba74",
  "hljs-title": "#7dd3fc",
  "hljs-section": "#7dd3fc",
  "hljs-built_in": "#67e8f9",
  "hljs-type": "#67e8f9",
  "hljs-attr": "#fcd34d",
  "hljs-property": "#fcd34d",
  "hljs-selector-class": "#fcd34d",
  "hljs-selector-id": "#fcd34d",
  "hljs-tag": "#fda4af",
  "hljs-name": "#fda4af",
  "hljs-meta": "#fda4af",
  "hljs-params": "#e1e9e1",
  "hljs-variable": "#e1e9e1",
  "hljs-subst": "#e1e9e1",
};

const STYLE_ID = "crescent-article-codeblock-style";

const lowlight = createLowlight(common);
if (lowlight.registered("xml") && !lowlight.registered("vue")) {
  lowlight.registerAlias({ xml: ["vue"] });
}

/** Highlight code blocks inside a live DOM tree (preview windows, etc.). */
export function highlightCodeBlocks(root: ParentNode) {
  const document = root.ownerDocument ?? (root as Document);
  ensureArticleCodeStyles(document);
  decorateCodeBlocks(document, root);
  bindArticleCodeCopy(document, root);
}

/**
 * Return HTML with code cards already decorated.
 * Prefer this for React pages so re-renders do not wipe DOM mutations.
 */
export function highlightArticleHtml(html: string): string {
  if (typeof DOMParser === "undefined") return html;
  const document = new DOMParser().parseFromString(
    `<div id="crescent-hl-root">${html}</div>`,
    "text/html",
  );
  const root = document.getElementById("crescent-hl-root");
  if (!root) return html;
  decorateCodeBlocks(document, root);
  return root.innerHTML;
}

/** Event delegation for copy buttons inside decorated article HTML. */
export function bindArticleCodeCopy(document: Document, root: ParentNode) {
  ensureArticleCodeStyles(document);
  bindCopyDelegation(document, root);
}

function decorateCodeBlocks(document: Document, root: ParentNode) {
  root.querySelectorAll<HTMLElement>("pre code").forEach((code) => {
    const pre = code.parentElement;
    if (!pre || pre.tagName !== "PRE") return;

    // Already wrapped by a previous pass — only refresh token markup.
    const existingShell = pre.closest<HTMLElement>(".article-codeblock");
    const rawLanguage =
      pre.dataset.language ||
      existingShell?.dataset.language ||
      [...pre.classList, ...code.classList]
        .find((name) => name.startsWith("language-"))
        ?.replace("language-", "") ||
      "";
    const source = code.textContent || "";
    // TipTap defaults to plaintext; still try heuristics so old/unlabeled Java blocks highlight.
    const explicitLanguage = rawLanguage && rawLanguage !== "plaintext" ? rawLanguage : "";
    const inferredLanguage = explicitLanguage ? null : inferLegacyLanguage(source);
    const result =
      explicitLanguage && lowlight.registered(explicitLanguage)
        ? lowlight.highlight(explicitLanguage, source)
        : inferredLanguage
          ? lowlight.highlight(inferredLanguage, source)
          : source.trim()
            ? lowlight.highlightAuto(source)
            : null;
    const language =
      explicitLanguage ||
      inferredLanguage ||
      (result?.data?.language as string | undefined) ||
      "plaintext";

    if (result) {
      code.replaceChildren(
        ...result.children.map((node) => createHighlightNode(document, node as HighlightNode)),
      );
    }

    code.classList.add("hljs", `language-${language}`);
    code.setAttribute(
      "style",
      "background:transparent!important;color:#e1e9e1!important;padding:0!important;border:0!important;box-shadow:none!important;font-family:JetBrains Mono,Consolas,monospace;",
    );
    pre.dataset.language = language;
    pre.classList.add(`language-${language}`);
    pre.setAttribute(
      "style",
      "overflow-x:auto;margin:0!important;border:0!important;border-radius:0!important;background:#121c18!important;box-shadow:none!important;padding:18px 20px!important;color:#e1e9e1!important;font-size:0.9em;line-height:1.7;",
    );

    if (existingShell) {
      existingShell.dataset.language = language;
      const label = existingShell.querySelector(".article-codeblock-language");
      if (label) label.textContent = LANGUAGE_LABELS[language] || language.toUpperCase();
      return;
    }

    decorateCodeBlock(document, pre, language);
  });
}

function inferLegacyLanguage(source: string): string | null {
  if (/\b(?:System|system)\.out\.println\s*\(/.test(source)) return "java";
  return null;
}

function decorateCodeBlock(document: Document, pre: HTMLElement, language: string) {
  const shell = document.createElement("div");
  shell.className = "article-codeblock";
  shell.dataset.language = language;
  shell.setAttribute(
    "style",
    "overflow:hidden;margin:2em 0;border:1px solid rgba(173,189,178,0.3);border-radius:14px;background:#121c18;box-shadow:0 18px 46px rgba(31,46,37,0.14);",
  );

  const header = document.createElement("div");
  header.className = "article-codeblock-header";
  header.setAttribute(
    "style",
    "display:grid;grid-template-columns:auto 1fr auto;align-items:center;gap:12px;min-height:48px;border-bottom:1px solid rgba(173,189,178,0.2);background:#f1f2ed;padding:8px 12px;",
  );

  const dots = document.createElement("span");
  dots.className = "article-codeblock-dots";
  dots.setAttribute("aria-hidden", "true");
  dots.setAttribute("style", "display:inline-flex;gap:6px;");
  for (let index = 0; index < 3; index += 1) {
    const dot = document.createElement("span");
    dot.className = "article-codeblock-dot";
    const color = index === 0 ? "#ff5f57" : index === 1 ? "#febc2e" : "#28c840";
    dot.setAttribute(
      "style",
      `display:block;width:10px;height:10px;border-radius:50%;background:${color};`,
    );
    dots.append(dot);
  }

  const label = document.createElement("span");
  label.className = "article-codeblock-language";
  label.textContent = LANGUAGE_LABELS[language] || language.toUpperCase();
  label.setAttribute(
    "style",
    'color:#526159;font-family:"JetBrains Mono",Consolas,monospace;font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;',
  );

  const copy = document.createElement("button");
  copy.className = "article-codeblock-copy";
  copy.type = "button";
  copy.textContent = "复制";
  copy.setAttribute(
    "style",
    "border:1px solid rgba(82,97,89,0.16);border-radius:8px;background:#fff;color:#526159;cursor:pointer;font:inherit;font-size:12px;line-height:1;padding:7px 10px;",
  );

  header.append(dots, label, copy);
  pre.before(shell);
  shell.append(header, pre);
}

function bindCopyDelegation(document: Document, root: ParentNode) {
  const target = root instanceof Document ? root.body : (root as HTMLElement);
  if (!target || target.dataset.codeCopyBound === "1") return;
  target.dataset.codeCopyBound = "1";

  target.addEventListener("click", async (event) => {
    const button = (event.target as HTMLElement | null)?.closest?.(".article-codeblock-copy");
    if (!(button instanceof HTMLButtonElement) || !target.contains(button)) return;

    const shell = button.closest(".article-codeblock");
    const code = shell?.querySelector("pre code");
    if (!code) return;

    try {
      await document.defaultView?.navigator.clipboard.writeText(code.textContent || "");
      button.textContent = "已复制";
      document.defaultView?.setTimeout(() => {
        button.textContent = "复制";
      }, 1200);
    } catch {
      button.textContent = "复制失败";
    }
  });
}

function createHighlightNode(document: Document, node: HighlightNode): Node {
  if (node.type === "text") {
    return document.createTextNode(node.value || "");
  }

  const span = document.createElement("span");
  const classNames = normalizeClassNames(node.properties?.className);
  if (classNames.length) {
    span.className = classNames.join(" ");
    const colorClass = classNames.find((name) => TOKEN_COLORS[name]);
    if (colorClass) {
      span.style.setProperty("color", TOKEN_COLORS[colorClass], "important");
    }
    if (classNames.includes("hljs-comment") || classNames.includes("hljs-quote")) {
      span.style.fontStyle = "italic";
    }
    if (
      classNames.includes("hljs-keyword") ||
      classNames.includes("hljs-title") ||
      classNames.includes("hljs-section")
    ) {
      span.style.fontWeight = "650";
    }
  }
  span.append(...(node.children || []).map((child) => createHighlightNode(document, child)));
  return span;
}

function normalizeClassNames(value: string[] | string | undefined): string[] {
  if (!value) return [];
  if (Array.isArray(value)) return value.filter(Boolean);
  return value.split(/\s+/).filter(Boolean);
}

function ensureArticleCodeStyles(document: Document) {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = `
.article-codeblock {
  overflow: hidden;
  margin: 2em 0;
  border: 1px solid rgba(173, 189, 178, 0.3);
  border-radius: 14px;
  background: #121c18;
  box-shadow: 0 18px 46px rgba(31, 46, 37, 0.14);
}
.article-codeblock-header {
  display: grid !important;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 12px;
  min-height: 48px;
  border-bottom: 1px solid rgba(173, 189, 178, 0.2);
  background: #f1f2ed;
  padding: 8px 12px;
}
.article-codeblock-dots { display: inline-flex; gap: 6px; }
.article-codeblock-dot {
  display: block;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #ff5f57;
}
.article-codeblock-dot:nth-child(2) { background: #febc2e; }
.article-codeblock-dot:nth-child(3) { background: #28c840; }
.article-codeblock-language {
  color: #526159;
  font-family: "JetBrains Mono", Consolas, monospace;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
.article-codeblock-copy {
  border: 1px solid rgba(82, 97, 89, 0.16);
  border-radius: 8px;
  background: #fff;
  color: #526159;
  cursor: pointer;
  font: inherit;
  font-size: 12px;
  line-height: 1;
  padding: 7px 10px;
}
.article-codeblock-copy:hover {
  border-color: rgba(57, 120, 100, 0.35);
  color: #286f58;
}
.article-codeblock pre {
  overflow-x: auto;
  margin: 0 !important;
  border: 0 !important;
  border-radius: 0 !important;
  background: #121c18 !important;
  box-shadow: none !important;
  padding: 18px 20px !important;
  color: #e1e9e1 !important;
  font-size: 0.9em;
  line-height: 1.7;
}
.article-codeblock pre code {
  background: transparent !important;
  color: inherit !important;
  padding: 0 !important;
  border: 0 !important;
  box-shadow: none !important;
  font-family: "JetBrains Mono", Consolas, monospace;
}
`;
  document.head.append(style);
}
