"use client";

import { NodeViewContent, NodeViewWrapper, type NodeViewProps } from "@tiptap/react";
import { Check, Copy, MoreHorizontal } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

export const CODE_LANGUAGES = [
  { value: "plaintext", label: "Plaintext" },
  { value: "javascript", label: "Javascript" },
  { value: "typescript", label: "Typescript" },
  { value: "vue", label: "Vue" },
  { value: "python", label: "Python" },
  { value: "go", label: "Go" },
  { value: "rust", label: "Rust" },
  { value: "java", label: "Java" },
  { value: "css", label: "CSS" },
  { value: "html", label: "HTML" },
  { value: "json", label: "JSON" },
  { value: "bash", label: "Bash" },
  { value: "sql", label: "SQL" },
  { value: "markdown", label: "Markdown" },
  { value: "yaml", label: "YAML" },
  { value: "c", label: "C" },
  { value: "cpp", label: "C++" },
] as const;

const FONT_SIZE_OPTIONS = ["12px", "13px", "14px", "15px", "16px", "18px"];
const INDENT_WIDTH_OPTIONS = [2, 4, 8];

export function CodeBlockNodeView({ node, updateAttributes }: NodeViewProps) {
  const language = (node.attrs.language as string) || "plaintext";
  const showLineNumbers = node.attrs.showLineNumbers !== false;
  const wordWrap = Boolean(node.attrs.wordWrap);
  const fontSize = (node.attrs.fontSize as string) || "14px";
  const indentWidth = Number(node.attrs.indentWidth || 2);

  const [copied, setCopied] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const settingsRef = useRef<HTMLDivElement>(null);

  const lineCount = useMemo(() => {
    const text = node.textContent || "";
    return Math.max(1, text.split("\n").length);
  }, [node.textContent]);

  const languageLabel =
    CODE_LANGUAGES.find((item) => item.value === language)?.label || language.toUpperCase();

  useEffect(() => {
    if (!settingsOpen) return;
    function onPointerDown(event: MouseEvent) {
      if (!settingsRef.current?.contains(event.target as Node)) {
        setSettingsOpen(false);
      }
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [settingsOpen]);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(node.textContent || "");
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      // ignore
    }
  }

  return (
    <NodeViewWrapper className="tiptap-codeblock" data-language={language}>
      <div className="tiptap-codeblock-chrome" contentEditable={false}>
        <div className="tiptap-codeblock-dots" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
        <strong className="tiptap-codeblock-title">{languageLabel.toUpperCase()}</strong>
        <div className="tiptap-codeblock-actions">
          <select
            aria-label="代码语言"
            className="tiptap-codeblock-lang"
            value={language}
            onChange={(event) => updateAttributes({ language: event.target.value })}
          >
            {CODE_LANGUAGES.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
          <button
            aria-label="复制代码"
            className="tiptap-codeblock-icon-btn"
            type="button"
            onClick={handleCopy}
          >
            {copied ? <Check size={15} /> : <Copy size={15} />}
          </button>
          <div className="tiptap-codeblock-more-wrap" ref={settingsRef}>
            <button
              aria-label="代码块设置"
              className="tiptap-codeblock-icon-btn"
              type="button"
              onClick={() => setSettingsOpen((value) => !value)}
            >
              <MoreHorizontal size={15} />
            </button>
            {settingsOpen && (
              <div className="tiptap-codeblock-settings">
                <label className="tiptap-codeblock-setting-row">
                  <span>字号</span>
                  <select
                    value={fontSize}
                    onChange={(event) => updateAttributes({ fontSize: event.target.value })}
                  >
                    {FONT_SIZE_OPTIONS.map((size) => (
                      <option key={size} value={size}>
                        {size}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="tiptap-codeblock-setting-row">
                  <span>缩进宽度</span>
                  <select
                    value={String(indentWidth)}
                    onChange={(event) => updateAttributes({ indentWidth: Number(event.target.value) })}
                  >
                    {INDENT_WIDTH_OPTIONS.map((width) => (
                      <option key={width} value={width}>
                        {width} 空格
                      </option>
                    ))}
                  </select>
                </label>
                <label className="tiptap-codeblock-setting-toggle">
                  <span>自动换行</span>
                  <input
                    checked={wordWrap}
                    type="checkbox"
                    onChange={(event) => updateAttributes({ wordWrap: event.target.checked })}
                  />
                </label>
                <label className="tiptap-codeblock-setting-toggle">
                  <span>行号</span>
                  <input
                    checked={showLineNumbers}
                    type="checkbox"
                    onChange={(event) => updateAttributes({ showLineNumbers: event.target.checked })}
                  />
                </label>
              </div>
            )}
          </div>
        </div>
      </div>

      <div
        className={`tiptap-codeblock-body${showLineNumbers ? " has-lines" : ""}${wordWrap ? " is-wrap" : ""}`}
        style={{ fontSize, tabSize: indentWidth }}
      >
        {showLineNumbers && (
          <div aria-hidden="true" className="tiptap-codeblock-gutter" contentEditable={false}>
            {Array.from({ length: lineCount }, (_, index) => (
              <span key={index}>{index + 1}</span>
            ))}
          </div>
        )}
        <pre className="tiptap-codeblock-pre" spellCheck={false}>
          <NodeViewContent
            as={"code" as "div"}
            className={`language-${language}`}
          />
        </pre>
      </div>
    </NodeViewWrapper>
  );
}
