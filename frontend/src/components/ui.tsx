"use client";

import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { formatRemaining, warrantyStatusLabel } from "@/lib/format";
import type { AnswerLang, WarrantyStatus } from "@/lib/types";

/* ---------- Button ---------- */

type Variant = "primary" | "secondary" | "ghost" | "danger-ghost";
const variants: Record<Variant, string> = {
  primary: "bg-accent text-white font-medium hover:bg-accent-strong",
  secondary: "border border-line-strong bg-surface text-ink hover:bg-subtle",
  ghost: "bg-transparent text-ink hover:bg-muted",
  "danger-ghost": "bg-transparent text-danger hover:bg-danger-soft",
};

export const Button = forwardRef<
  HTMLButtonElement,
  ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: "md" | "sm" }
>(function Button({ variant = "secondary", size = "md", className, type = "button", ...rest }, ref) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-[10px] text-[15px] transition-colors disabled:cursor-not-allowed disabled:opacity-50",
        size === "md" ? "h-11 px-[18px]" : "h-8 rounded-lg px-3 text-[13px]",
        variants[variant],
        className,
      )}
      {...rest}
    />
  );
});

export function IconButton({
  label,
  className,
  children,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={cn(
        "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-ink-muted hover:bg-muted hover:text-ink",
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
}

/* ---------- 状态徽章 ---------- */

export type Tone = "ok" | "warn" | "danger" | "info" | "neutral";
const tones: Record<Tone, string> = {
  ok: "text-ok bg-ok-soft",
  warn: "text-warn bg-warn-soft",
  danger: "text-danger bg-danger-soft",
  info: "text-info bg-info-soft",
  neutral: "text-ink-muted bg-line-soft",
};

export function Badge({ tone, children, className }: { tone: Tone; children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "inline-block whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

export const warrantyTone: Record<WarrantyStatus, Tone> = {
  active: "ok",
  expiring: "warn",
  expired: "danger",
  unknown: "neutral",
};

/** 台账表格用：「在保 · 剩 101 天」 */
export function WarrantyBadge({
  status,
  daysLeft,
  compact = false,
}: {
  status: WarrantyStatus;
  daysLeft: number | null;
  compact?: boolean;
}) {
  let text: string = warrantyStatusLabel[status];
  if (status === "active" || status === "expiring") {
    text = compact ? formatRemaining(daysLeft) : `${text} · ${formatRemaining(daysLeft)}`;
  }
  return <Badge tone={warrantyTone[status]}>{text}</Badge>;
}

/* ---------- 回答语言切换 ---------- */

const langOptions: { value: AnswerLang; label: string; lang?: string }[] = [
  { value: "auto", label: "自动" },
  { value: "zh", label: "中文" },
  { value: "ja", label: "日本語", lang: "ja" },
];

export function LanguageToggle({
  value,
  onChange,
  className,
}: {
  value: AnswerLang;
  onChange: (v: AnswerLang) => void;
  className?: string;
}) {
  return (
    <div role="group" aria-label="回答语言" className={cn("flex rounded-full bg-muted p-[3px]", className)}>
      {langOptions.map((o) => (
        <button
          key={o.value}
          type="button"
          lang={o.lang}
          aria-pressed={value === o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            "h-8 min-w-11 rounded-full px-2.5 text-[13px]",
            value === o.value ? "bg-surface font-medium text-ink shadow-[0_1px_0_rgba(0,0,0,0.04)]" : "text-ink-muted",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/* ---------- 筛选胶囊 ---------- */

export function Chip({
  pressed,
  className,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { pressed: boolean }) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      className={cn(
        "h-[34px] shrink-0 whitespace-nowrap rounded-full border px-3.5 text-[13px]",
        pressed
          ? "border-accent bg-accent-soft font-medium text-accent-strong"
          : "border-line-strong bg-surface text-ink hover:bg-subtle",
        className,
      )}
      {...rest}
    />
  );
}

/** 表单控件的统一样式（手机端字号 16px，避免 iOS 聚焦放大） */
export const fieldClass =
  "h-10 w-full rounded-lg border border-line-strong bg-surface px-3 text-base text-ink placeholder:text-ink-faint md:text-sm";

export const labelClass = "flex flex-col gap-1.5 text-[13px] text-ink-muted";
