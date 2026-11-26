"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Composer } from "@/components/chat/Composer";
import { BrandMark } from "@/components/nav/TopNav";
import { useApp } from "@/components/providers";
import { LanguageToggle } from "@/components/ui";
import { listFavoriteItemIds, listItems, listRecentQuestions } from "@/lib/api";
import { setPendingImage } from "@/lib/handoff";
import type { LedgerRow, RecentQuestion } from "@/lib/types";

/** 问答首页：常用物品大按钮 + 最近问过 + 输入框（手机优先） */
export default function HomePage() {
  const router = useRouter();
  const { answerLang, setAnswerLang } = useApp();
  const [items, setItems] = useState<LedgerRow[]>([]);
  const [recent, setRecent] = useState<RecentQuestion[]>([]);

  useEffect(() => {
    Promise.all([listItems(), listFavoriteItemIds(), listRecentQuestions()])
      .then(([rows, favIds, rq]) => {
        const byId = new Map(rows.map((r) => [r.item_id, r]));
        setItems(favIds.map((id) => byId.get(id)).filter((r): r is LedgerRow => !!r));
        setRecent(rq);
      })
      .catch(() => {});
  }, []);

  function ask(text: string, image: File | null) {
    setPendingImage(image);
    router.push(`/chat?q=${encodeURIComponent(text)}`);
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-[720px] flex-col pb-[calc(64px+env(safe-area-inset-bottom))] md:min-h-0 md:px-6 md:pb-12 md:pt-8">
      <header className="flex items-center justify-between gap-3 px-[18px] pb-1.5 pt-3.5 md:px-0">
        <div className="flex items-center gap-2 text-base font-bold md:hidden">
          <BrandMark size={28} />
          家庭物品助手
        </div>
        <span className="hidden text-sm text-ink-muted md:block">回答语言</span>
        <LanguageToggle value={answerLang} onChange={setAnswerLang} />
      </header>

      <main className="flex flex-1 flex-col gap-[18px] px-[18px] pt-2.5 md:px-0">
        <h1 className="mt-1 text-[22px] font-bold md:text-[26px]">今天想问哪件东西？</h1>

        <section aria-label="常用物品" className="grid grid-cols-2 gap-2.5 md:grid-cols-3">
          {items.map((it) => (
            <Link
              key={it.item_id}
              href={`/chat?item=${encodeURIComponent(it.item_id)}`}
              className="flex min-h-16 flex-col justify-center gap-0.5 rounded-[14px] border border-line bg-surface px-3.5 py-3 text-ink no-underline hover:border-line-strong hover:text-ink"
            >
              <span className="text-[15px] font-medium">{it.name}</span>
              <span className="text-xs text-ink-muted">{it.brand ?? "—"}</span>
            </Link>
          ))}
          <Link
            href="/ledger"
            className="flex min-h-16 items-center justify-center rounded-[14px] border border-dashed border-line-strong text-sm text-ink-muted no-underline hover:text-ink"
          >
            全部物品 ›
          </Link>
        </section>

        {recent.length > 0 && (
          <section aria-label="最近问过" className="flex flex-col gap-1">
            <h2 className="mb-1 text-[13px] font-medium text-ink-muted">最近问过</h2>
            {recent.map((r, i) => (
              <Link
                key={i}
                href={`/chat?item=${encodeURIComponent(r.item_id)}&q=${encodeURIComponent(r.question)}`}
                className="flex min-h-12 items-center gap-2.5 border-b border-line px-0.5 text-[15px] text-ink no-underline last:border-b-0 hover:text-ink"
              >
                <span className="shrink-0 rounded-full bg-accent-soft px-2 py-0.5 text-xs text-accent-strong">
                  {r.item_label}
                </span>
                {r.question}
              </Link>
            ))}
          </section>
        )}

        <div className="hidden md:block">
          <Composer variant="desktop" placeholder="直接问，比如：空调怎么开除湿" onSubmit={ask} />
        </div>
      </main>

      {/* 手机：输入框固定在底部标签栏上方 */}
      <div className="sticky bottom-[calc(64px+env(safe-area-inset-bottom))] bg-canvas px-3.5 py-2.5 md:hidden">
        <Composer placeholder="直接问，比如：空调怎么开除湿" onSubmit={ask} />
      </div>
    </div>
  );
}
