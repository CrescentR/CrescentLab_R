"use client";

import { EditorContent, type JSONContent, useEditor } from "@tiptap/react";
import { BubbleMenu } from "@tiptap/react/menus";
import StarterKit from "@tiptap/starter-kit";
import CharacterCount from "@tiptap/extension-character-count";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import { Table } from "@tiptap/extension-table";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import TableRow from "@tiptap/extension-table-row";
import TaskItem from "@tiptap/extension-task-item";
import TaskList from "@tiptap/extension-task-list";
import TextAlign from "@tiptap/extension-text-align";
import Typography from "@tiptap/extension-typography";
import Underline from "@tiptap/extension-underline";
import { useEffect, useState } from "react";
import {
  Bold,
  CheckSquare,
  Code2,
  Focus,
  Heading1,
  Heading2,
  Heading3,
  ImageIcon,
  Italic,
  LinkIcon,
  List,
  ListOrdered,
  Minus,
  Quote,
  Redo2,
  RemoveFormatting,
  Strikethrough,
  Table2,
  UnderlineIcon,
  Undo2,
} from "lucide-react";

export type EditorDocument = {
  html: string;
  json: JSONContent;
  text: string;
  characters: number;
  words: number;
};

type TipTapEditorProps = {
  content: string;
  contentJSON?: JSONContent | null;
  onChange: (html: string) => void;
  onDocumentChange?: (document: EditorDocument) => void;
  onSave?: () => void;
};

type ToolbarButton = {
  label: string;
  icon: typeof Bold;
  isActive?: () => boolean;
  onClick: () => void;
};

export function TipTapEditor({ content, contentJSON, onChange, onDocumentChange, onSave }: TipTapEditorProps) {
  const [focusMode, setFocusMode] = useState(false);
  const editor = useEditor({
    extensions: [
      StarterKit,
      CharacterCount,
      Image.configure({ allowBase64: false }),
      Link.configure({ openOnClick: false, autolink: true, defaultProtocol: "https" }),
      Placeholder.configure({ placeholder: "输入 / 开始创作，或从工具栏插入内容块…" }),
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
      TaskList,
      TaskItem.configure({ nested: true }),
      Typography,
      Underline,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
    ],
    content: contentJSON || content || "",
    immediatelyRender: false,
    onUpdate: ({ editor: currentEditor }) => {
      const html = currentEditor.getHTML();
      const text = currentEditor.getText();
      onChange(html);
      onDocumentChange?.({
        html,
        json: currentEditor.getJSON(),
        text,
        characters: currentEditor.storage.characterCount.characters(),
        words: text.trim() ? text.trim().split(/\s+|(?<=[\u4e00-\u9fff])(?=[\u4e00-\u9fff])/).filter(Boolean).length : 0,
      });
    },
    editorProps: {
      attributes: {
        class: "tiptap-editor focus:outline-none min-h-[520px] px-6 py-8 text-[var(--text)] leading-8 md:px-12",
      },
      handleKeyDown: (_view, event) => {
        if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "s") {
          event.preventDefault();
          onSave?.();
          return true;
        }
        return false;
      },
    },
  });

  useEffect(() => {
    if (!editor) return;
    const next = contentJSON || content || "";
    const current = JSON.stringify(editor.getJSON());
    const incoming = typeof next === "string" ? null : JSON.stringify(next);
    if ((incoming && current !== incoming) || (!incoming && editor.getHTML() !== next)) {
      editor.commands.setContent(next);
    }
  }, [content, contentJSON, editor]);

  const buttons: ToolbarButton[][] = editor
    ? [
        [
          { label: "撤销", icon: Undo2, onClick: () => editor.chain().focus().undo().run() },
          { label: "重做", icon: Redo2, onClick: () => editor.chain().focus().redo().run() },
        ],
        [1, 2, 3].map((level) => ({
          label: `标题 ${level}`,
          icon: [Heading1, Heading2, Heading3][level - 1],
          isActive: () => editor.isActive("heading", { level }),
          onClick: () => editor.chain().focus().toggleHeading({ level: level as 1 | 2 | 3 }).run(),
        })),
        [
          { label: "粗体", icon: Bold, isActive: () => editor.isActive("bold"), onClick: () => editor.chain().focus().toggleBold().run() },
          { label: "斜体", icon: Italic, isActive: () => editor.isActive("italic"), onClick: () => editor.chain().focus().toggleItalic().run() },
          { label: "下划线", icon: UnderlineIcon, isActive: () => editor.isActive("underline"), onClick: () => editor.chain().focus().toggleUnderline().run() },
          { label: "删除线", icon: Strikethrough, isActive: () => editor.isActive("strike"), onClick: () => editor.chain().focus().toggleStrike().run() },
        ],
        [
          { label: "无序列表", icon: List, isActive: () => editor.isActive("bulletList"), onClick: () => editor.chain().focus().toggleBulletList().run() },
          { label: "有序列表", icon: ListOrdered, isActive: () => editor.isActive("orderedList"), onClick: () => editor.chain().focus().toggleOrderedList().run() },
          { label: "任务列表", icon: CheckSquare, isActive: () => editor.isActive("taskList"), onClick: () => editor.chain().focus().toggleTaskList().run() },
          { label: "引用", icon: Quote, isActive: () => editor.isActive("blockquote"), onClick: () => editor.chain().focus().toggleBlockquote().run() },
          { label: "代码块", icon: Code2, isActive: () => editor.isActive("codeBlock"), onClick: () => editor.chain().focus().toggleCodeBlock().run() },
        ],
        [
          { label: "插入表格", icon: Table2, onClick: () => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run() },
          { label: "分隔线", icon: Minus, onClick: () => editor.chain().focus().setHorizontalRule().run() },
          {
            label: "插入图片",
            icon: ImageIcon,
            onClick: () => {
              const src = window.prompt("图片 URL");
              if (!src) return;
              const alt = window.prompt("图片替代文本（便于无障碍访问）") || "";
              editor.chain().focus().setImage({ src, alt }).run();
            },
          },
          {
            label: "插入链接",
            icon: LinkIcon,
            isActive: () => editor.isActive("link"),
            onClick: () => {
              const previous = editor.getAttributes("link").href as string | undefined;
              const href = window.prompt("链接地址；留空可移除链接", previous || "https://");
              if (href === null) return;
              if (!href.trim()) editor.chain().focus().unsetLink().run();
              else editor.chain().focus().extendMarkRange("link").setLink({ href }).run();
            },
          },
          { label: "清除格式", icon: RemoveFormatting, onClick: () => editor.chain().focus().clearNodes().unsetAllMarks().run() },
          { label: "专注模式", icon: Focus, isActive: () => focusMode, onClick: () => setFocusMode((value) => !value) },
        ],
      ]
    : [];

  return (
    <div className={`flex h-full flex-col overflow-hidden rounded-[var(--radius)] border border-[var(--border-soft)] bg-[var(--surface)] shadow-[var(--shadow-tight)] ${focusMode ? "fixed inset-4 z-50" : ""}`}>
      {editor && (
        <BubbleMenu editor={editor}>
          <div className="flex rounded-lg border border-[var(--border-soft)] bg-[var(--surface)] p-1 shadow-lg">
            {buttons[2].slice(0, 4).map((button) => (
              <EditorButton button={button} key={button.label} />
            ))}
          </div>
        </BubbleMenu>
      )}
      <div className="flex flex-wrap items-center gap-1 border-b border-[var(--border-soft)] bg-[var(--surface-glass)] px-3 py-2 backdrop-blur-xl">
        {buttons.map((group, index) => (
          <div className="flex items-center gap-1" key={index}>
            {index > 0 && <span className="mx-1 h-5 w-px bg-[var(--border-soft)]" />}
            {group.map((button) => <EditorButton button={button} key={button.label} />)}
          </div>
        ))}
      </div>
      <div className="flex-1 overflow-y-auto bg-[var(--surface)]">
        <EditorContent editor={editor} />
      </div>
      <footer className="flex items-center justify-between border-t border-[var(--border-soft)] px-4 py-2 font-lab-mono text-[11px] text-[var(--muted)]">
        <span>Ctrl/⌘ + S 保存 · 支持粘贴富文本</span>
        <span>{editor?.storage.characterCount.characters() ?? 0} 字符</span>
      </footer>
    </div>
  );
}

function EditorButton({ button }: { button: ToolbarButton }) {
  const Icon = button.icon;
  return (
    <button
      aria-label={button.label}
      title={button.label}
      className={`grid size-8 place-items-center rounded transition-colors ${
        button.isActive?.()
          ? "bg-[var(--blue-soft)] text-[var(--blue)]"
          : "text-[var(--muted)] hover:bg-[var(--surface-field)] hover:text-[var(--text-strong)]"
      }`}
      onClick={(event) => {
        event.preventDefault();
        button.onClick();
      }}
      type="button"
    >
      <Icon size={15} />
    </button>
  );
}
