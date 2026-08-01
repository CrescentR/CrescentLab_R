"use client";

import { Check, Copy } from "lucide-react";
import { useEffect, useRef, useState } from "react";

type ColorPickerMenuProps = {
  colors: string[];
  initialHex: string;
  mode: "text" | "highlight";
  onPick: (color: string) => void;
  onClear: () => void;
};

type Hsv = { h: number; s: number; v: number };

export function ColorPickerMenu({ colors, initialHex, mode, onPick, onClear }: ColorPickerMenuProps) {
  const [hex, setHex] = useState(normalizeHex(initialHex));
  const [hsv, setHsv] = useState<Hsv>(() => hexToHsv(normalizeHex(initialHex)));
  const [copied, setCopied] = useState(false);
  const svRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const hsvRef = useRef(hsv);
  const onPickRef = useRef(onPick);

  const safeHex = /^#[0-9a-fA-F]{6}$/.test(hex)
    ? hex
    : mode === "text"
      ? "#1c2821"
      : "#fff3bf";

  useEffect(() => {
    hsvRef.current = hsv;
  }, [hsv]);

  useEffect(() => {
    onPickRef.current = onPick;
  }, [onPick]);

  function commitHex(value: string) {
    const next = normalizeHex(value);
    if (!/^#[0-9a-fA-F]{6}$/.test(next)) return;
    setHex(next);
    setHsv(hexToHsv(next));
    onPickRef.current(next);
  }

  function commitHsv(next: Hsv) {
    const nextHex = hsvToHex(next);
    hsvRef.current = next;
    setHsv(next);
    setHex(nextHex);
    onPickRef.current(nextHex);
  }

  function updateSvFromPointer(clientX: number, clientY: number) {
    const el = svRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const s = clamp((clientX - rect.left) / rect.width, 0, 1);
    const v = clamp(1 - (clientY - rect.top) / rect.height, 0, 1);
    commitHsv({ ...hsvRef.current, s, v });
  }

  useEffect(() => {
    function onMove(event: PointerEvent) {
      if (!dragging.current || !svRef.current) return;
      const rect = svRef.current.getBoundingClientRect();
      const s = clamp((event.clientX - rect.left) / rect.width, 0, 1);
      const v = clamp(1 - (event.clientY - rect.top) / rect.height, 0, 1);
      const next = { ...hsvRef.current, s, v };
      const nextHex = hsvToHex(next);
      hsvRef.current = next;
      setHsv(next);
      setHex(nextHex);
      onPickRef.current(nextHex);
    }
    function onUp() {
      dragging.current = false;
    }
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, []);

  async function copyHex() {
    try {
      await navigator.clipboard.writeText(safeHex);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1200);
    } catch {
      // ignore
    }
  }

  const pureHue = hsvToHex({ h: hsv.h, s: 1, v: 1 });

  return (
    <div
      className={`tiptap-color-menu tiptap-color-menu--${mode}`}
      onMouseDown={(event) => {
        const target = event.target as HTMLElement;
        if (target.closest("input[type='text'], textarea")) return;
        event.preventDefault();
      }}
    >
      <div className="tiptap-color-grid">
        {colors.map((color) => (
          <button
            aria-label={color}
            className={`tiptap-color-swatch${safeHex.toLowerCase() === color.toLowerCase() ? " is-active" : ""}${isLightColor(color) ? " is-light" : ""}`}
            key={color}
            style={{ background: color }}
            type="button"
            onClick={() => commitHex(color)}
          />
        ))}
      </div>

      <div className="tiptap-color-picker">
        <div
          ref={svRef}
          className="tiptap-color-sv"
          style={{ backgroundColor: pureHue }}
          onPointerDown={(event) => {
            dragging.current = true;
            svRef.current?.setPointerCapture(event.pointerId);
            updateSvFromPointer(event.clientX, event.clientY);
          }}
        >
          <span
            className="tiptap-color-sv-thumb"
            style={{ left: `${hsv.s * 100}%`, top: `${(1 - hsv.v) * 100}%` }}
          />
        </div>

        <input
          aria-label="色相"
          className="tiptap-color-hue"
          max={360}
          min={0}
          type="range"
          value={Math.round(hsv.h)}
          onChange={(event) => commitHsv({ ...hsv, h: Number(event.target.value) })}
        />

        <div className="tiptap-color-hex-row">
          <span className="tiptap-color-hex-swatch" style={{ background: safeHex }} />
          <input
            aria-label="十六进制颜色"
            className="tiptap-color-hex-input"
            maxLength={7}
            placeholder="#27F59C"
            type="text"
            value={hex}
            onChange={(event) => setHex(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") commitHex(hex);
            }}
            onBlur={() => commitHex(hex)}
          />
          <button
            aria-label="复制颜色"
            className="tiptap-color-copy"
            type="button"
            onClick={copyHex}
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
          </button>
          <button className="tiptap-color-apply" type="button" onClick={() => commitHex(hex)}>
            应用
          </button>
        </div>
      </div>

      <button className="tiptap-menu-clear" type="button" onClick={onClear}>
        {mode === "highlight" ? "清除高亮" : "清除颜色"}
      </button>
    </div>
  );
}

export function normalizeHex(value: string): string {
  const trimmed = value.trim();
  if (/^[0-9a-fA-F]{6}$/.test(trimmed)) return `#${trimmed}`;
  if (/^#[0-9a-fA-F]{3}$/.test(trimmed)) {
    const [, r, g, b] = trimmed;
    return `#${r}${r}${g}${g}${b}${b}`;
  }
  return trimmed.startsWith("#") ? trimmed : `#${trimmed}`;
}

export function toPickerHex(value: string | null | undefined, fallback: string): string {
  if (!value) return fallback;
  const normalized = normalizeHex(value);
  if (/^#[0-9a-fA-F]{6}$/.test(normalized)) return normalized;
  const rgb = value.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
  if (!rgb) return fallback;
  const hex = rgb
    .slice(1, 4)
    .map((part) => Number(part).toString(16).padStart(2, "0"))
    .join("");
  return `#${hex}`;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function hexToHsv(hex: string): Hsv {
  const raw = normalizeHex(hex).replace("#", "");
  if (raw.length !== 6) return { h: 150, s: 0.4, v: 0.9 };
  const r = Number.parseInt(raw.slice(0, 2), 16) / 255;
  const g = Number.parseInt(raw.slice(2, 4), 16) / 255;
  const b = Number.parseInt(raw.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  let h = 0;
  if (d !== 0) {
    if (max === r) h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
    if (h < 0) h += 360;
  }
  const s = max === 0 ? 0 : d / max;
  return { h, s, v: max };
}

function hsvToHex({ h, s, v }: Hsv): string {
  const c = v * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = v - c;
  let r = 0;
  let g = 0;
  let b = 0;
  if (h < 60) [r, g, b] = [c, x, 0];
  else if (h < 120) [r, g, b] = [x, c, 0];
  else if (h < 180) [r, g, b] = [0, c, x];
  else if (h < 240) [r, g, b] = [0, x, c];
  else if (h < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  const toHex = (n: number) =>
    Math.round((n + m) * 255)
      .toString(16)
      .padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function isLightColor(color: string): boolean {
  const hex = normalizeHex(color).replace("#", "");
  if (hex.length !== 6) return false;
  const r = Number.parseInt(hex.slice(0, 2), 16);
  const g = Number.parseInt(hex.slice(2, 4), 16);
  const b = Number.parseInt(hex.slice(4, 6), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 > 210;
}
