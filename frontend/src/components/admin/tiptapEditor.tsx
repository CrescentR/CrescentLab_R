"use client";

import { EditorContent, type Editor, type JSONContent, useEditor } from "@tiptap/react";
import { BubbleMenu } from "@tiptap/react/menus";
import StarterKit from "@tiptap/starter-kit";
import CharacterCount from "@tiptap/extension-character-count";
import Highlight from "@tiptap/extension-highlight";
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
import { BackgroundColor, Color, FontSize, TextStyle } from "@tiptap/extension-text-style";
import Typography from "@tiptap/extension-typography";
import Underline from "@tiptap/extension-underline";
import Subscript from "@tiptap/extension-subscript";
import Superscript from "@tiptap/extension-superscript";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { ColorPickerMenu, toPickerHex } from "@/components/admin/colorPickerMenu";
import { FancyCodeBlock } from "@/components/admin/fancyCodeBlock";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  CheckSquare,
  Code2,
  Columns3,
  Focus,
  Highlighter,
  ImageIcon,
  Italic,
  LinkIcon,
  List,
  ListOrdered,
  Loader2,
  Minus,
  Paperclip,
  Palette,
  Quote,
  Redo2,
  RemoveFormatting,
  Rows3,
  Strikethrough,
  Subscript as SubscriptIcon,
  Superscript as SuperscriptIcon,
  Table2,
  Trash2,
  UnderlineIcon,
  Undo2,
} from "lucide-react";
import { InsertImageModal } from "@/components/admin/insertImageModal";
import { uploadStorageFile } from "@/lib/api/storage";

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

const FONT_SIZES = ["13px", "14px", "15px", "16px", "18px", "20px", "24px", "28px", "32px"];
/** 文字色：深色主调 + 强调色 */
const TEXT_COLORS = [
  "#1c2821", "#343a40", "#495057", "#868e96", "#adb5bd", "#ced4da", "#ffffff",
  "#c92a2a", "#e03131", "#f76707", "#f59f00", "#2b8a3e", "#0ca678", "#1c7ed6",
  "#4263eb", "#7048e8", "#9c36b5", "#c2255c", "#d9480f", "#087f5b", "#1098ad",
];
/** 高亮底色：浅色纸感 */
const HIGHLIGHT_COLORS = [
  "#fff3bf", "#ffe8a1", "#ffd8a8", "#ffc9c9", "#eebefa", "#d0ebff", "#c3fae8",
  "#d8f5a2", "#ffec99", "#ffc078", "#ffa8a8", "#e599f7", "#a5d8ff", "#96f2d7",
  "#e9ecef", "#dee2e6", "#fff0f6", "#f3f0ff", "#e7f5ff", "#ebfbee", "#fff9db",
];

export function TipTapEditor({ content, contentJSON, onChange, onDocumentChange, onSave }: TipTapEditorProps) {
  const [focusMode, setFocusMode] = useState(false);
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [tablePickerOpen, setTablePickerOpen] = useState(false);
  const [colorMenu, setColorMenu] = useState<"text" | "highlight" | null>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);
  const attachmentInputRef = useRef<HTMLInputElement>(null);
  const colorSelectionRef = useRef<{ from: number; to: number } | null>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        code: { HTMLAttributes: { class: "tiptap-inline-code" } },
        codeBlock: false,
      }),
      CharacterCount,
      TextStyle,
      Color,
      BackgroundColor,
      Highlight.configure({ multicolor: true }),
      FontSize,
      FancyCodeBlock,
      Subscript,
      Superscript,
      Image.configure({ allowBase64: false }),
      Link.configure({ openOnClick: false, autolink: true, defaultProtocol: "https" }),
      Placeholder.configure({ placeholder: "从这里开始写作，或使用上方工具栏插入内容…" }),
      Table.configure({
        resizable: true,
        allowTableNodeSelection: false,
        HTMLAttributes: { class: "tiptap-table" },
      }),
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
        words: text.trim()
          ? text
              .trim()
              .split(/\s+|(?<=[\u4e00-\u9fff])(?=[\u4e00-\u9fff])/)
              .filter(Boolean).length
          : 0,
      });
    },
    editorProps: {
      attributes: {
        class:
          "tiptap-editor focus:outline-none min-h-[520px] mx-auto w-full max-w-[720px] px-5 py-10 text-[var(--text)] leading-8 md:px-8",
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

  useEffect(() => {
    if (!tablePickerOpen && !colorMenu) return;
    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (toolbarRef.current?.contains(target)) return;
      setTablePickerOpen(false);
      setColorMenu(null);
    };
    window.addEventListener("mousedown", onPointerDown);
    return () => window.removeEventListener("mousedown", onPointerDown);
  }, [tablePickerOpen, colorMenu]);

  if (!editor) {
    return <div className="tiptap-shell grid min-h-[320px] place-items-center text-sm text-[var(--muted)]">编辑器加载中…</div>;
  }

  const blockValue = editor.isActive("heading", { level: 1 })
    ? "h1"
    : editor.isActive("heading", { level: 2 })
      ? "h2"
      : editor.isActive("heading", { level: 3 })
        ? "h3"
        : "paragraph";

  const currentFontSize = (editor.getAttributes("textStyle").fontSize as string | undefined) || "15px";

  function insertLink() {
    const previous = editor!.getAttributes("link").href as string | undefined;
    const href = window.prompt("链接地址；留空可移除链接", previous || "https://");
    if (href === null) return;
    if (!href.trim()) editor!.chain().focus().unsetLink().run();
    else editor!.chain().focus().extendMarkRange("link").setLink({ href }).run();
  }

  return (
    <div className={`tiptap-shell flex h-full flex-col overflow-hidden ${focusMode ? "fixed inset-4 z-50" : ""}`}>
      <input
        className="sr-only"
        disabled={uploadingFile}
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = "";
          if (!file) return;
          setUploadingFile(true);
          void uploadStorageFile(file)
            .then((uploaded) => editor.chain().focus().insertContent(`<a href="${uploaded.url}">${escapeHTML(file.name)}</a>`).run())
            .catch((cause) => window.alert(cause instanceof Error ? cause.message : "附件上传失败"))
            .finally(() => setUploadingFile(false));
        }}
        ref={attachmentInputRef}
        type="file"
      />
      <BubbleMenu
        editor={editor}
        pluginKey="tableBubbleMenu"
        shouldShow={({ editor: current }) => current.isActive("table")}
      >
        <div className="tiptap-table-bubble">
          <ToolBtn label="上方插入行" onClick={() => editor.chain().focus().addRowBefore().run()}>
            <Rows3 size={16} />
            上行
          </ToolBtn>
          <ToolBtn label="下方插入行" onClick={() => editor.chain().focus().addRowAfter().run()}>
            <Rows3 size={16} />
            下行
          </ToolBtn>
          <ToolBtn label="左侧插入列" onClick={() => editor.chain().focus().addColumnBefore().run()}>
            <Columns3 size={16} />
            左列
          </ToolBtn>
          <ToolBtn label="右侧插入列" onClick={() => editor.chain().focus().addColumnAfter().run()}>
            <Columns3 size={16} />
            右列
          </ToolBtn>
          <span className="tiptap-tool-sep" />
          <ToolBtn label="删除行" onClick={() => editor.chain().focus().deleteRow().run()}>
            <Trash2 size={16} />
            删行
          </ToolBtn>
          <ToolBtn label="删除列" onClick={() => editor.chain().focus().deleteColumn().run()}>
            <Trash2 size={16} />
            删列
          </ToolBtn>
          <ToolBtn label="删除表格" onClick={() => editor.chain().focus().deleteTable().run()}>
            <Trash2 size={16} />
            删表
          </ToolBtn>
        </div>
      </BubbleMenu>

      <div className="tiptap-toolbar" ref={toolbarRef}>
        <ToolGroup>
          <IconBtn active={false} label="撤销" onClick={() => editor.chain().focus().undo().run()}>
            <Undo2 size={18} strokeWidth={1.9} />
          </IconBtn>
          <IconBtn active={false} label="重做" onClick={() => editor.chain().focus().redo().run()}>
            <Redo2 size={18} strokeWidth={1.9} />
          </IconBtn>
        </ToolGroup>

        <ToolGroup>
          <select
            aria-label="段落样式"
            className="tiptap-select"
            value={blockValue}
            onChange={(event) => {
              const value = event.target.value;
              if (value === "paragraph") editor.chain().focus().setParagraph().run();
              else editor.chain().focus().toggleHeading({ level: Number(value.slice(1)) as 1 | 2 | 3 }).run();
            }}
          >
            <option value="paragraph">正文</option>
            <option value="h1">标题 1</option>
            <option value="h2">标题 2</option>
            <option value="h3">标题 3</option>
          </select>
          <select
            aria-label="字号"
            className="tiptap-select tiptap-select-sm"
            value={currentFontSize}
            onChange={(event) => {
              editor.chain().focus().setFontSize(event.target.value).run();
            }}
          >
            {FONT_SIZES.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </ToolGroup>

        <ToolGroup>
          <IconBtn active={editor.isActive("bold")} label="粗体" onClick={() => editor.chain().focus().toggleBold().run()}>
            <Bold size={18} strokeWidth={1.9} />
          </IconBtn>
          <IconBtn active={editor.isActive("italic")} label="斜体" onClick={() => editor.chain().focus().toggleItalic().run()}>
            <Italic size={18} strokeWidth={1.9} />
          </IconBtn>
          <IconBtn active={editor.isActive("underline")} label="下划线" onClick={() => editor.chain().focus().toggleUnderline().run()}>
            <UnderlineIcon size={18} strokeWidth={1.9} />
          </IconBtn>
          <IconBtn active={editor.isActive("strike")} label="删除线" onClick={() => editor.chain().focus().toggleStrike().run()}>
            <Strikethrough size={18} strokeWidth={1.9} />
          </IconBtn>
          <IconBtn active={editor.isActive("superscript")} label="上标" onClick={() => editor.chain().focus().toggleSuperscript().run()}>
            <SuperscriptIcon size={18} strokeWidth={1.9} />
          </IconBtn>
          <IconBtn active={editor.isActive("subscript")} label="下标" onClick={() => editor.chain().focus().toggleSubscript().run()}>
            <SubscriptIcon size={18} strokeWidth={1.9} />
          </IconBtn>
        </ToolGroup>

        <ToolGroup>
          <div className="tiptap-menu-wrap">
            <IconBtn
              active={Boolean(editor.getAttributes("textStyle").color)}
              label="文字颜色"
              onClick={() => {
                rememberColorSelection(editor, colorSelectionRef);
                setColorMenu((value) => (value === "text" ? null : "text"));
              }}
            >
              <Palette size={18} strokeWidth={1.9} />
            </IconBtn>
            {colorMenu === "text" && (
              <ColorPickerMenu
                colors={TEXT_COLORS}
                initialHex={toPickerHex(editor.getAttributes("textStyle").color, "#1c2821")}
                mode="text"
                onPick={(color) => {
                  applyTextColor(editor, color, colorSelectionRef.current);
                }}
                onClear={() => {
                  clearTextColor(editor, colorSelectionRef.current);
                  setColorMenu(null);
                }}
              />
            )}
          </div>
          <div className="tiptap-menu-wrap">
            <IconBtn
              active={
                editor.isActive("highlight") ||
                Boolean(editor.getAttributes("textStyle").backgroundColor)
              }
              label="背景颜色"
              onClick={() => {
                rememberColorSelection(editor, colorSelectionRef);
                setColorMenu((value) => (value === "highlight" ? null : "highlight"));
              }}
            >
              <Highlighter size={18} strokeWidth={1.9} />
            </IconBtn>
            {colorMenu === "highlight" && (
              <ColorPickerMenu
                colors={HIGHLIGHT_COLORS}
                initialHex={toPickerHex(
                  (editor.getAttributes("highlight").color as string) ||
                    (editor.getAttributes("textStyle").backgroundColor as string),
                  "#fff3bf",
                )}
                mode="highlight"
                onPick={(color) => {
                  applyHighlightColor(editor, color, colorSelectionRef.current);
                }}
                onClear={() => {
                  clearHighlightColor(editor, colorSelectionRef.current);
                  setColorMenu(null);
                }}
              />
            )}
          </div>
        </ToolGroup>

        <ToolGroup>
          <IconBtn active={editor.isActive({ textAlign: "left" })} label="左对齐" onClick={() => editor.chain().focus().setTextAlign("left").run()}>
            <AlignLeft size={18} strokeWidth={1.9} />
          </IconBtn>
          <IconBtn active={editor.isActive({ textAlign: "center" })} label="居中" onClick={() => editor.chain().focus().setTextAlign("center").run()}>
            <AlignCenter size={18} strokeWidth={1.9} />
          </IconBtn>
          <IconBtn active={editor.isActive({ textAlign: "right" })} label="右对齐" onClick={() => editor.chain().focus().setTextAlign("right").run()}>
            <AlignRight size={18} strokeWidth={1.9} />
          </IconBtn>
        </ToolGroup>

        <ToolGroup>
          <IconBtn active={editor.isActive("blockquote")} label="引用" onClick={() => editor.chain().focus().toggleBlockquote().run()}>
            <Quote size={18} strokeWidth={1.9} />
          </IconBtn>
          <IconBtn active={editor.isActive("code")} label="行内代码" onClick={() => editor.chain().focus().toggleCode().run()}>
            <Code2 size={18} strokeWidth={1.9} />
          </IconBtn>
          <IconBtn active={editor.isActive("codeBlock")} label="代码块" onClick={() => editor.chain().focus().toggleCodeBlock().run()}>
            <Code2 size={18} strokeWidth={1.9} />
          </IconBtn>
        </ToolGroup>

        <ToolGroup>
          <IconBtn active={editor.isActive("bulletList")} label="无序列表" onClick={() => editor.chain().focus().toggleBulletList().run()}>
            <List size={18} strokeWidth={1.9} />
          </IconBtn>
          <IconBtn active={editor.isActive("orderedList")} label="有序列表" onClick={() => editor.chain().focus().toggleOrderedList().run()}>
            <ListOrdered size={18} strokeWidth={1.9} />
          </IconBtn>
          <IconBtn active={editor.isActive("taskList")} label="任务列表" onClick={() => editor.chain().focus().toggleTaskList().run()}>
            <CheckSquare size={18} strokeWidth={1.9} />
          </IconBtn>
        </ToolGroup>

        <ToolGroup>
          <IconBtn active={editor.isActive("link")} label="插入链接" onClick={insertLink}>
            <LinkIcon size={18} strokeWidth={1.9} />
          </IconBtn>
          <IconBtn active={false} label="插入图片" onClick={() => setImageModalOpen(true)}>
            <ImageIcon size={18} strokeWidth={1.9} />
          </IconBtn>
          <IconBtn active={false} label={uploadingFile ? "附件上传中" : "上传附件"} onClick={() => attachmentInputRef.current?.click()}>
            {uploadingFile ? <Loader2 className="animate-spin" size={18} /> : <Paperclip size={18} strokeWidth={1.9} />}
          </IconBtn>
          <div className="tiptap-menu-wrap">
            <IconBtn
              active={tablePickerOpen || editor.isActive("table")}
              label="插入表格"
              onClick={() => {
                setColorMenu(null);
                setTablePickerOpen((value) => !value);
              }}
            >
              <Table2 size={18} strokeWidth={1.9} />
            </IconBtn>
            {tablePickerOpen && (
              <TableSizePicker
                onPick={(rows, cols) => {
                  editor.chain().focus().insertTable({ rows, cols, withHeaderRow: true }).run();
                  setTablePickerOpen(false);
                }}
              />
            )}
          </div>
          <IconBtn active={false} label="分隔线" onClick={() => editor.chain().focus().setHorizontalRule().run()}>
            <Minus size={18} strokeWidth={1.9} />
          </IconBtn>
          <IconBtn active={false} label="清除格式" onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()}>
            <RemoveFormatting size={18} strokeWidth={1.9} />
          </IconBtn>
          <IconBtn active={focusMode} label="专注模式" onClick={() => setFocusMode((value) => !value)}>
            <Focus size={18} strokeWidth={1.9} />
          </IconBtn>
        </ToolGroup>
      </div>

      <div className="tiptap-canvas flex-1 overflow-y-auto">
        <EditorContent editor={editor} />
      </div>
      <footer className="flex items-center justify-between border-t border-[var(--border-soft)] px-5 py-2.5 text-xs text-[var(--muted)]">
        <span>Ctrl / ⌘ + S 保存 · 表格内可选中单元格后删行/删列</span>
        <span>{editor.storage.characterCount.characters()} 字</span>
      </footer>
      <InsertImageModal
        open={imageModalOpen}
        onClose={() => setImageModalOpen(false)}
        onInsert={({ src, alt }) => {
          editor.chain().focus().setImage({ src, alt }).run();
        }}
      />
    </div>
  );
}

function escapeHTML(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  })[character] || character);
}

function ToolGroup({ children }: { children: ReactNode }) {
  return <div className="tiptap-tool-group">{children}</div>;
}

function IconBtn({
  label,
  active,
  onClick,
  children,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      aria-label={label}
      className={`tiptap-tool-btn${active ? " is-active" : ""}`}
      title={label}
      type="button"
      onMouseDown={(event) => event.preventDefault()}
      onClick={(event) => {
        event.preventDefault();
        onClick();
      }}
    >
      {children}
    </button>
  );
}

function ToolBtn({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button aria-label={label} className="tiptap-table-bubble-btn" title={label} type="button" onClick={onClick}>
      {children}
    </button>
  );
}

function rememberColorSelection(
  editor: Editor,
  ref: { current: { from: number; to: number } | null },
) {
  const { from, to } = editor.state.selection;
  ref.current = { from, to };
}

/** 优先用打开色盘时保存的选区；空选区时扩展到当前文本节点 */
function resolveColorRange(
  editor: Editor,
  saved: { from: number; to: number } | null,
): { from: number; to: number } {
  if (saved && saved.from !== saved.to) return saved;

  const { from, to, empty, $from } = editor.state.selection;
  const baseFrom = saved?.from ?? from;
  const baseTo = saved?.to ?? to;
  if (!empty || (saved && saved.from !== saved.to)) {
    return { from: baseFrom, to: baseTo };
  }

  const blockStart = $from.start();
  let rangeFrom = baseFrom;
  let rangeTo = baseFrom;
  $from.parent.forEach((child: { isText: boolean; nodeSize: number }, offset: number) => {
    if (!child.isText) return;
    const start = blockStart + offset;
    const end = start + child.nodeSize;
    if (baseFrom >= start && baseFrom <= end) {
      rangeFrom = start;
      rangeTo = end;
    }
  });
  return { from: rangeFrom, to: rangeTo };
}

function applyTextColor(
  editor: Editor,
  color: string,
  saved: { from: number; to: number } | null,
) {
  const range = resolveColorRange(editor, saved);
  editor.chain().focus().setTextSelection(range).setColor(color).run();
}

function clearTextColor(editor: Editor, saved: { from: number; to: number } | null) {
  const range = resolveColorRange(editor, saved);
  editor.chain().focus().setTextSelection(range).run();
  stripTextStyleAttribute(editor, "color");
}

function applyHighlightColor(
  editor: Editor,
  color: string,
  saved: { from: number; to: number } | null,
) {
  const range = resolveColorRange(editor, saved);
  editor.chain().focus().setTextSelection(range).run();
  stripTextStyleAttribute(editor, "backgroundColor");
  editor.commands.setHighlight({ color });
}

function clearHighlightColor(editor: Editor, saved: { from: number; to: number } | null) {
  const range = resolveColorRange(editor, saved);
  editor.chain().focus().setTextSelection(range).run();
  editor.commands.unsetHighlight();
  stripTextStyleAttribute(editor, "backgroundColor");
}

function stripTextStyleAttribute(editor: Editor, attribute: "color" | "backgroundColor") {
  editor.commands.command(({ tr, state, dispatch }) => {
    const type = state.schema.marks.textStyle;
    if (!type || !dispatch) return false;

    const { from, to } = state.selection;

    if (from === to) {
      const nextStored = (state.storedMarks || state.selection.$from.marks())
        .map((mark) => {
          if (mark.type !== type) return mark;
          const attrs = { ...mark.attrs, [attribute]: null };
          return Object.values(attrs).some((value) => value != null && value !== "")
            ? type.create(attrs)
            : null;
        })
        .filter((mark) => mark != null);
      tr.setStoredMarks(nextStored);
      dispatch(tr);
      return true;
    }

    state.doc.nodesBetween(from, to, (node, pos) => {
      if (!node.isText) return;
      const mark = node.marks.find((item) => item.type === type);
      if (!mark?.attrs[attribute]) return;
      const clipFrom = Math.max(pos, from);
      const clipTo = Math.min(pos + node.nodeSize, to);
      if (clipFrom >= clipTo) return;
      const attrs = { ...mark.attrs, [attribute]: null };
      tr.removeMark(clipFrom, clipTo, type);
      if (Object.values(attrs).some((value) => value != null && value !== "")) {
        tr.addMark(clipFrom, clipTo, type.create(attrs));
      }
    });

    dispatch(tr);
    return true;
  });
}

function TableSizePicker({ onPick }: { onPick: (rows: number, cols: number) => void }) {
  const [hover, setHover] = useState({ rows: 0, cols: 0 });
  const max = 10;

  return (
    <div className="tiptap-table-picker" onMouseLeave={() => setHover({ rows: 0, cols: 0 })}>
      <div className="tiptap-table-picker-label">
        {hover.rows > 0 ? `${hover.rows} × ${hover.cols}` : "选择表格大小"}
      </div>
      <div className="tiptap-table-picker-grid">
        {Array.from({ length: max }, (_, rowIndex) =>
          Array.from({ length: max }, (_, colIndex) => {
            const rows = rowIndex + 1;
            const cols = colIndex + 1;
            const active = rows <= hover.rows && cols <= hover.cols;
            return (
              <button
                aria-label={`${rows} 行 ${cols} 列`}
                className={`tiptap-table-picker-cell${active ? " is-active" : ""}`}
                key={`${rows}-${cols}`}
                type="button"
                onClick={() => onPick(rows, cols)}
                onMouseEnter={() => setHover({ rows, cols })}
              />
            );
          }),
        )}
      </div>
    </div>
  );
}
