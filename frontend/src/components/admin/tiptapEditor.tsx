"use client";

import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import { useEffect } from "react";
import {
  Bold,
  Code2,
  Heading1,
  Heading2,
  Heading3,
  ImageIcon,
  Italic,
  LinkIcon,
  List,
  ListOrdered,
  Quote,
  Redo2,
  RemoveFormatting,
  Strikethrough,
  UnderlineIcon,
  Undo2,
} from "lucide-react";

type TipTapEditorProps = {
  content: string;
  onChange: (html: string) => void;
};

type ToolbarButton = {
  label: string;
  icon: typeof Bold;
  isActive?: () => boolean;
  onClick: () => void;
};

export function TipTapEditor({ content, onChange }: TipTapEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Image,
      Link.configure({ openOnClick: false }),
      Placeholder.configure({ placeholder: "开始写作..." }),
      Underline,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
    ],
    content: content || "",
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: "tiptap-editor focus:outline-none min-h-[300px] px-6 py-4 text-[var(--text)] leading-7",
      },
    },
  });

  useEffect(() => {
    if (editor && content !== undefined && editor.getHTML() !== content) {
      editor.commands.setContent(content || "");
    }
  }, [content, editor]);

  const ToolbarGroup = ({ buttons }: { buttons: ToolbarButton[] }) => (
    <div className="flex items-center gap-0.5">
      {buttons.map((btn) => {
        const Icon = btn.icon;
        return (
          <button
            key={btn.label}
            aria-label={btn.label}
            className={`grid size-8 place-items-center rounded transition-colors ${
              btn.isActive?.()
                ? "bg-[var(--blue-soft)] text-[var(--blue)]"
                : "text-[var(--muted)] hover:bg-[var(--surface-field)] hover:text-[var(--text-strong)]"
            }`}
            onClick={(e) => {
              e.preventDefault();
              btn.onClick();
            }}
            type="button"
          >
            <Icon size={15} />
          </button>
        );
      })}
    </div>
  );

  const toolbarGroups: ToolbarButton[][] = [
    [
      {
        label: "撤销",
        icon: Undo2,
        onClick: () => editor?.chain().focus().undo().run(),
      },
      {
        label: "重做",
        icon: Redo2,
        onClick: () => editor?.chain().focus().redo().run(),
      },
    ],
    [
      {
        label: "标题1",
        icon: Heading1,
        isActive: () => editor?.isActive("heading", { level: 1 }) ?? false,
        onClick: () => editor?.chain().focus().toggleHeading({ level: 1 }).run(),
      },
      {
        label: "标题2",
        icon: Heading2,
        isActive: () => editor?.isActive("heading", { level: 2 }) ?? false,
        onClick: () => editor?.chain().focus().toggleHeading({ level: 2 }).run(),
      },
      {
        label: "标题3",
        icon: Heading3,
        isActive: () => editor?.isActive("heading", { level: 3 }) ?? false,
        onClick: () => editor?.chain().focus().toggleHeading({ level: 3 }).run(),
      },
    ],
    [
      {
        label: "粗体",
        icon: Bold,
        isActive: () => editor?.isActive("bold") ?? false,
        onClick: () => editor?.chain().focus().toggleBold().run(),
      },
      {
        label: "斜体",
        icon: Italic,
        isActive: () => editor?.isActive("italic") ?? false,
        onClick: () => editor?.chain().focus().toggleItalic().run(),
      },
      {
        label: "下划线",
        icon: UnderlineIcon,
        isActive: () => editor?.isActive("underline") ?? false,
        onClick: () => editor?.chain().focus().toggleUnderline().run(),
      },
      {
        label: "删除线",
        icon: Strikethrough,
        isActive: () => editor?.isActive("strike") ?? false,
        onClick: () => editor?.chain().focus().toggleStrike().run(),
      },
    ],
    [
      {
        label: "无序列表",
        icon: List,
        isActive: () => editor?.isActive("bulletList") ?? false,
        onClick: () => editor?.chain().focus().toggleBulletList().run(),
      },
      {
        label: "有序列表",
        icon: ListOrdered,
        isActive: () => editor?.isActive("orderedList") ?? false,
        onClick: () => editor?.chain().focus().toggleOrderedList().run(),
      },
      {
        label: "引用",
        icon: Quote,
        isActive: () => editor?.isActive("blockquote") ?? false,
        onClick: () => editor?.chain().focus().toggleBlockquote().run(),
      },
      {
        label: "代码块",
        icon: Code2,
        isActive: () => editor?.isActive("codeBlock") ?? false,
        onClick: () => editor?.chain().focus().toggleCodeBlock().run(),
      },
    ],
    [
      {
        label: "插入图片",
        icon: ImageIcon,
        onClick: () => {
          const url = window.prompt("请输入图片 URL:");
          if (url) editor?.chain().focus().setImage({ src: url }).run();
        },
      },
      {
        label: "插入链接",
        icon: LinkIcon,
        isActive: () => editor?.isActive("link") ?? false,
        onClick: () => {
          const url = window.prompt("请输入链接 URL:");
          if (url) editor?.chain().focus().setLink({ href: url }).run();
        },
      },
      {
        label: "清除格式",
        icon: RemoveFormatting,
        onClick: () => editor?.chain().focus().clearNodes().unsetAllMarks().run(),
      },
    ],
  ];

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-[var(--radius)] border border-[var(--border-soft)] bg-[var(--surface)] shadow-[var(--shadow-tight)]">
      <div className="flex flex-wrap items-center gap-1 border-b border-[var(--border-soft)] bg-[var(--surface-glass)] px-3 py-2 backdrop-blur-xl">
        {toolbarGroups.map((group, idx) => (
          <div className="flex items-center gap-1" key={idx}>
            {idx > 0 && <span className="mx-1 h-5 w-px bg-[var(--border-soft)]" />}
            <ToolbarGroup buttons={group} />
          </div>
        ))}
      </div>
      <div className="flex-1 overflow-y-auto bg-[var(--surface)]">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
