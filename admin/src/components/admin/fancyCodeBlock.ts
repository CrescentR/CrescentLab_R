import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { common, createLowlight } from "lowlight";
import { CodeBlockNodeView } from "@/components/admin/codeBlockNodeView";

const lowlight = createLowlight(common);
if (lowlight.registered("xml") && !lowlight.registered("vue")) {
  // Vue 单文件组件以模板结构为主，XML 语法比 JavaScript 更适合高亮标签与属性。
  lowlight.registerAlias({ xml: ["vue"] });
}

export const FancyCodeBlock = CodeBlockLowlight.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      language: {
        default: "plaintext",
        parseHTML: (element) => {
          const classLanguage = [...element.classList]
            .find((name) => name.startsWith("language-"))
            ?.replace("language-", "");
          return classLanguage || element.getAttribute("data-language") || "plaintext";
        },
        renderHTML: (attributes) => ({
          "data-language": attributes.language || "plaintext",
          class: `language-${attributes.language || "plaintext"}`,
        }),
      },
      showLineNumbers: {
        default: true,
        parseHTML: (element) => element.getAttribute("data-line-numbers") !== "false",
        renderHTML: (attributes) => ({
          "data-line-numbers": attributes.showLineNumbers === false ? "false" : "true",
        }),
      },
      wordWrap: {
        default: false,
        parseHTML: (element) => element.getAttribute("data-word-wrap") === "true",
        renderHTML: (attributes) => ({
          "data-word-wrap": attributes.wordWrap ? "true" : "false",
        }),
      },
      fontSize: {
        default: "14px",
        parseHTML: (element) => element.getAttribute("data-font-size") || "14px",
        renderHTML: (attributes) => ({
          "data-font-size": attributes.fontSize || "14px",
        }),
      },
      indentWidth: {
        default: 2,
        parseHTML: (element) => Number(element.getAttribute("data-indent-width") || 2),
        renderHTML: (attributes) => ({
          "data-indent-width": String(attributes.indentWidth || 2),
        }),
      },
    };
  },
  addNodeView() {
    return ReactNodeViewRenderer(CodeBlockNodeView);
  },
}).configure({
  lowlight,
  defaultLanguage: "plaintext",
  languageClassPrefix: "language-",
});
