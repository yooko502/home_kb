"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { CameraIcon, CloseIcon, SendIcon } from "@/components/icons";
import { cn } from "@/lib/cn";

/**
 * 输入框 + 拍照提问（计划书 5.5）。
 * 拍照按钮放在输入框左边；照片只随本次提问发送，默认不保存。
 */
export function Composer({
  placeholder,
  disabled,
  onSubmit,
  variant = "mobile",
  autoFocus,
}: {
  placeholder: string;
  disabled?: boolean;
  onSubmit: (text: string, image: File | null) => void;
  variant?: "mobile" | "desktop";
  autoFocus?: boolean;
}) {
  const [text, setText] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!image) {
      setPreview(null);
      return;
    }
    const url = URL.createObjectURL(image);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [image]);

  const canSend = !disabled && (text.trim().length > 0 || image != null);

  function submit(e?: FormEvent) {
    e?.preventDefault();
    if (!canSend) return;
    onSubmit(text.trim() || "这个是什么？", image);
    setText("");
    setImage(null);
    if (fileRef.current) fileRef.current.value = "";
  }

  const desktop = variant === "desktop";

  return (
    <form onSubmit={submit} className="flex flex-col gap-2">
      {preview && (
        <div className="flex items-center gap-2 text-xs text-ink-muted">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={preview} alt="待发送的照片" className="h-12 w-12 rounded-lg border border-line object-cover" />
          <span>照片只用于这次提问，不会保存</span>
          <button
            type="button"
            aria-label="移除照片"
            onClick={() => setImage(null)}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg hover:bg-muted"
          >
            <CloseIcon size={14} />
          </button>
        </div>
      )}
      <div
        className={cn(
          "flex items-center gap-2",
          desktop && "items-end gap-2.5 rounded-xl border border-line-strong bg-surface py-2 pl-1.5 pr-2",
        )}
      >
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="sr-only"
          tabIndex={-1}
          onChange={(e) => setImage(e.target.files?.[0] ?? null)}
        />
        <button
          type="button"
          aria-label="拍下面板或遥控器提问"
          title="拍下面板或遥控器提问"
          onClick={() => fileRef.current?.click()}
          className={cn(
            "inline-flex shrink-0 items-center justify-center text-ink",
            desktop
              ? "h-10 w-10 rounded-lg text-ink-muted hover:bg-muted"
              : "h-12 w-12 rounded-[14px] border border-line-strong bg-surface",
          )}
        >
          <CameraIcon size={desktop ? 19 : 22} />
        </button>
        {desktop ? (
          <textarea
            aria-label="输入问题"
            rows={2}
            value={text}
            autoFocus={autoFocus}
            placeholder={placeholder}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                e.preventDefault();
                submit();
              }
            }}
            className="min-w-0 flex-1 resize-none border-0 bg-transparent px-1 py-2 text-[15px] leading-normal text-ink outline-none placeholder:text-ink-faint focus-visible:outline-none"
          />
        ) : (
          <input
            aria-label="输入问题"
            value={text}
            autoFocus={autoFocus}
            enterKeyHint="send"
            placeholder={placeholder}
            onChange={(e) => setText(e.target.value)}
            className="h-12 min-w-0 flex-1 rounded-[14px] border border-line-strong bg-surface px-3.5 text-base text-ink placeholder:text-ink-faint"
          />
        )}
        <button
          type="submit"
          aria-label="发送"
          disabled={!canSend}
          className={cn(
            "inline-flex shrink-0 items-center justify-center bg-accent text-white hover:bg-accent-strong disabled:opacity-50",
            desktop ? "h-11 w-11 rounded-[10px]" : "h-12 w-12 rounded-[14px]",
          )}
        >
          <SendIcon size={desktop ? 18 : 20} />
        </button>
      </div>
    </form>
  );
}
