import { common, createLowlight } from "lowlight";

type HighlightNode = {
  type: string;
  value?: string;
  properties?: { className?: string[] };
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

const lowlight = createLowlight(common);
if (lowlight.registered("xml") && !lowlight.registered("vue")) {
  lowlight.registerAlias({ xml: ["vue"] });
}

/** Rebuild saved code blocks with Lowlight spans without trusting raw HTML. */
export function highlightCodeBlocks(root: ParentNode) {
  root.querySelectorAll<HTMLElement>("pre code").forEach((code) => {
    const pre = code.parentElement;
    if (!pre) return;

    const explicitLanguage =
      pre.dataset.language ||
      [...pre.classList, ...code.classList]
        .find((name) => name.startsWith("language-"))
        ?.replace("language-", "");
    const source = code.textContent || "";
    const inferredLanguage = explicitLanguage ? null : inferLegacyLanguage(source);
    const result =
      explicitLanguage === "plaintext"
        ? null
        : explicitLanguage && lowlight.registered(explicitLanguage)
          ? lowlight.highlight(explicitLanguage, source)
          : inferredLanguage
            ? lowlight.highlight(inferredLanguage, source)
            : lowlight.highlightAuto(source);
    const language =
      explicitLanguage ||
      inferredLanguage ||
      (result?.data?.language as string | undefined) ||
      "plaintext";
    const document = code.ownerDocument;
    if (result) {
      code.replaceChildren(
        ...result.children.map((node) => createHighlightNode(document, node as HighlightNode)),
      );
    }
    code.classList.add("hljs", `language-${language}`);
    pre.dataset.language = language;
    decorateCodeBlock(document, pre, code, language);
  });
}

function inferLegacyLanguage(source: string): string | null {
  if (/\b(?:System|system)\.out\.println\s*\(/.test(source)) return "java";
  return null;
}

function decorateCodeBlock(
  document: Document,
  pre: HTMLElement,
  code: HTMLElement,
  language: string,
) {
  if (pre.parentElement?.classList.contains("article-codeblock")) return;

  const figure = document.createElement("figure");
  figure.className = "article-codeblock";
  figure.dataset.language = language;

  const header = document.createElement("figcaption");
  header.className = "article-codeblock-header";

  const dots = document.createElement("span");
  dots.className = "article-codeblock-dots";
  dots.setAttribute("aria-hidden", "true");
  dots.append(document.createElement("i"), document.createElement("i"), document.createElement("i"));

  const label = document.createElement("strong");
  label.className = "article-codeblock-language";
  label.textContent = LANGUAGE_LABELS[language] || language.toUpperCase();

  const copy = document.createElement("button");
  copy.className = "article-codeblock-copy";
  copy.type = "button";
  copy.textContent = "复制";
  copy.addEventListener("click", async () => {
    try {
      await document.defaultView?.navigator.clipboard.writeText(code.textContent || "");
      copy.textContent = "已复制";
      document.defaultView?.setTimeout(() => {
        copy.textContent = "复制";
      }, 1200);
    } catch {
      copy.textContent = "复制失败";
    }
  });

  header.append(dots, label, copy);
  pre.before(figure);
  figure.append(header, pre);
}

function createHighlightNode(document: Document, node: HighlightNode): Node {
  if (node.type === "text") {
    return document.createTextNode(node.value || "");
  }

  const span = document.createElement("span");
  const classes = node.properties?.className;
  if (classes?.length) span.className = classes.join(" ");
  span.append(...(node.children || []).map((child) => createHighlightNode(document, child)));
  return span;
}
