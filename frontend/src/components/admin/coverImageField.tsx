"use client";

import { useState } from "react";
import { ImagePlus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { InsertImageModal } from "@/components/admin/insertImageModal";

type CoverImageFieldProps = {
  value: string;
  onChange: (value: string) => void;
};

export function CoverImageField({ value, onChange }: CoverImageFieldProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="cover-image-field">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-[var(--muted)]">封面图片</span>
        {value && (
          <button
            className="inline-flex items-center gap-1 text-xs font-medium text-[var(--coral)] hover:underline"
            type="button"
            onClick={() => onChange("")}
          >
            <Trash2 size={12} />
            清除
          </button>
        )}
      </div>

      {value ? (
        <div className="cover-image-preview">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img alt="文章封面预览" src={value} />
          <div className="cover-image-preview-actions">
            <Button icon={<ImagePlus size={15} />} variant="secondary" onClick={() => setOpen(true)}>
              更换封面
            </Button>
          </div>
        </div>
      ) : (
        <button className="cover-image-empty" type="button" onClick={() => setOpen(true)}>
          <ImagePlus size={22} />
          <strong>设置封面图片</strong>
          <span>支持链接或本地上传，与正文插图相同</span>
        </button>
      )}

      <InsertImageModal
        confirmLabel="设为封面"
        open={open}
        title="设置封面图片"
        onClose={() => setOpen(false)}
        onInsert={({ src }) => {
          onChange(src);
          setOpen(false);
        }}
      />
    </div>
  );
}
