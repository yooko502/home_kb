"use client";

import { useState } from "react";
import { AnswerBody, plainText } from "@/components/chat/AnswerBody";
import { CalendarIcon, CheckIcon, CopyIcon, ImageIcon, ThumbDownIcon, ThumbUpIcon } from "@/components/icons";
import { BrandMark } from "@/components/nav/TopNav";
import { IconButton } from "@/components/ui";
import { sendFeedback } from "@/lib/api";
import { cn } from "@/lib/cn";
import type { ChatMessage, Citation, WarrantyStatus } from "@/lib/types";

const warrantyBox: Record<WarrantyStatus, { cls: string; title: string }> = {
  active: { cls: "bg-ok-soft text-ok-ink", title: "在保修期内" },
  expiring: { cls: "bg-warn-soft text-warn", title: "保修即将到期" },
  expired: { cls: "bg-danger-soft text-danger", title: "已过保修期" },
  unknown: { cls: "bg-line-soft text-ink-muted", title: "没有保修信息" },
};

export function AssistantMessage({
  msg,
  onFollowUp,
}: {
  msg: ChatMessage;
  onFollowUp: (q: string) => void;
}) {
  const [feedback, setFeedback] = useState<1 | -1 | null>(null);
  const [copied, setCopied] = useState(false);

  const vote = (v: 1 | -1) => {
    setFeedback(v);
    if (msg.log_id) sendFeedback(msg.log_id, v).catch(() => {});
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(plainText(msg.content));
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="flex items-start gap-3">
      <span className="hidden md:inline-flex" aria-hidden="true">
        <BrandMark />
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-2.5 md:gap-3">
        {msg.tool_summary && (
          <div className="inline-flex items-center gap-1.5 text-xs text-ink-muted">
            <CheckIcon size={14} className="text-ok" />
            {msg.tool_summary}
          </div>
        )}
        {msg.pending && !msg.content && !msg.tool_summary && (
          <div className="text-sm text-ink-muted" role="status">
            正在查资料…
          </div>
        )}

        {msg.content && (
          <div
            className={cn(
              "text-[15px] leading-[1.8]",
              // 手机：回答放在白色气泡里；电脑：直接排在对话区
              "rounded-[4px_16px_16px_16px] border border-line bg-surface px-4 py-3.5 md:rounded-none md:border-0 md:bg-transparent md:p-0 md:leading-[1.75]",
            )}
          >
            <AnswerBody text={msg.content} />
          </div>
        )}

        {msg.error && (
          <div className="rounded-[10px] bg-danger-soft px-3.5 py-3 text-sm text-danger" role="alert">
            {msg.error}
          </div>
        )}

        {msg.warranty && (
          <div className={cn("rounded-[10px] px-3.5 py-3 text-sm leading-relaxed", warrantyBox[msg.warranty.status].cls)}>
            <strong>{warrantyBox[msg.warranty.status].title}</strong>　{msg.warranty.text}
            {msg.warranty.citation != null && <sup className="cite !bg-surface">{msg.warranty.citation}</sup>}
          </div>
        )}

        {msg.figure && (
          <button
            type="button"
            aria-label={`放大查看${msg.figure.label}`}
            className="flex h-[280px] w-full max-w-[520px] flex-col items-center justify-center gap-2 rounded-xl border border-line bg-readonly text-ink-muted"
          >
            {msg.figure.image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={msg.figure.image_url} alt={msg.figure.label} className="h-full w-full rounded-xl object-contain" />
            ) : (
              <>
                <ImageIcon size={40} strokeWidth={1.4} className="text-ink-faint" />
                <span className="text-sm">{msg.figure.label}</span>
                <span className="text-xs">点击放大</span>
              </>
            )}
          </button>
        )}

        {msg.citations && msg.citations.length > 0 && <CitationCards citations={msg.citations} />}

        {!msg.pending && !msg.error && (
          <div className="flex gap-1">
            <IconButton
              label="有帮助"
              aria-pressed={feedback === 1}
              onClick={() => vote(1)}
              className={cn("md:h-9 md:w-9 h-10 w-10", feedback === 1 && "bg-accent-soft text-accent-strong")}
            >
              <ThumbUpIcon size={17} />
            </IconButton>
            <IconButton
              label="没帮助"
              aria-pressed={feedback === -1}
              onClick={() => vote(-1)}
              className={cn("md:h-9 md:w-9 h-10 w-10", feedback === -1 && "bg-danger-soft text-danger")}
            >
              <ThumbDownIcon size={17} />
            </IconButton>
            <span className="hidden md:contents">
              <IconButton label={copied ? "已复制" : "复制回答"} onClick={copy}>
                {copied ? <CheckIcon size={17} className="text-ok" /> : <CopyIcon size={17} />}
              </IconButton>
            </span>
          </div>
        )}

        {msg.follow_ups && msg.follow_ups.length > 0 && (
          <div aria-label="接着问" className="flex flex-wrap gap-2">
            {msg.follow_ups.map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => onFollowUp(q)}
                className="h-9 rounded-full border border-line-strong bg-surface px-3.5 text-sm text-ink hover:bg-subtle"
              >
                {q}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/** 引用卡片：手机横向滑动，电脑一行三张 */
function CitationCards({ citations }: { citations: Citation[] }) {
  return (
    <div
      aria-label="出处"
      className="no-scrollbar -mx-3.5 flex snap-x gap-2 overflow-x-auto px-3.5 md:mx-0 md:grid md:grid-cols-3 md:gap-2.5 md:overflow-visible md:px-0"
    >
      {citations.map((c) => (
        <button
          key={c.index}
          type="button"
          className="flex min-w-0 shrink-0 basis-[210px] snap-start items-center gap-2.5 rounded-xl border border-line bg-surface p-2 text-left hover:border-line-strong md:basis-auto md:rounded-[10px] md:p-2.5"
        >
          {c.kind === "ledger" ? (
            <span aria-hidden="true" className="inline-flex h-12 w-9 shrink-0 items-center justify-center rounded bg-ok-soft text-ok md:h-[52px] md:w-10">
              <CalendarIcon size={18} />
            </span>
          ) : c.page_image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={c.page_image_url} alt="" className="h-12 w-9 shrink-0 rounded border border-placeholder object-cover md:h-[52px] md:w-10" />
          ) : (
            <span aria-hidden="true" className="h-12 w-9 shrink-0 rounded border border-placeholder bg-muted md:h-[52px] md:w-10" />
          )}
          <span className="flex min-w-0 flex-col gap-0.5">
            <span className="truncate text-[13px] font-medium text-ink">
              [{c.index}] {c.kind === "ledger" ? c.doc_title : `${c.doc_title}`}
            </span>
            <span lang={c.section_lang} className="truncate text-xs text-ink-muted">
              {c.page_no != null ? `第 ${c.page_no} 页` : ""}
              {c.page_no != null && c.section ? " · " : ""}
              {c.section}
            </span>
          </span>
        </button>
      ))}
    </div>
  );
}
