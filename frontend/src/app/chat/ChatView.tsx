"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { AssistantMessage } from "@/components/chat/AssistantMessage";
import { Composer } from "@/components/chat/Composer";
import { BackIcon, CloseIcon, MenuIcon, PlusIcon } from "@/components/icons";
import { useApp } from "@/components/providers";
import { Chip, LanguageToggle } from "@/components/ui";
import { listChatSessions, listItems, streamChat } from "@/lib/api";
import { cn } from "@/lib/cn";
import { takePendingImage } from "@/lib/handoff";
import type { AnswerLang, ChatEvent, ChatMessage, ChatSessionSummary, LedgerRow } from "@/lib/types";

const langCycle: Record<AnswerLang, AnswerLang> = { auto: "zh", zh: "ja", ja: "auto" };
const langShort: Record<AnswerLang, string> = { auto: "自动", zh: "中文", ja: "日本語" };

let seq = 0;
const newId = () => `m${Date.now().toString(36)}${(seq++).toString(36)}`;

export function ChatView() {
  const router = useRouter();
  const params = useSearchParams();
  const { answerLang, setAnswerLang, backend } = useApp();

  const [items, setItems] = useState<LedgerRow[]>([]);
  const [sessions, setSessions] = useState<ChatSessionSummary[]>([]);
  const [scopeItemId, setScopeItemId] = useState<string | null>(params.get("item"));
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [busy, setBusy] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);

  const abortRef = useRef<AbortController | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const initialAsked = useRef(false);

  useEffect(() => {
    listItems().then(setItems).catch(() => {});
    listChatSessions().then(setSessions).catch(() => {});
    return () => abortRef.current?.abort();
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [messages]);

  const scopeItem = items.find((i) => i.item_id === scopeItemId) ?? null;

  const patch = (id: string, fn: (m: ChatMessage) => ChatMessage) =>
    setMessages((ms) => ms.map((m) => (m.id === id ? fn(m) : m)));

  const send = useCallback(
    async (text: string, image: File | null) => {
      abortRef.current?.abort();
      const ctrl = new AbortController();
      abortRef.current = ctrl;

      const userMsg: ChatMessage = {
        id: newId(),
        role: "user",
        content: text,
        image_preview: image ? URL.createObjectURL(image) : null,
      };
      const botId = newId();
      setMessages((ms) => [...ms, userMsg, { id: botId, role: "assistant", content: "", pending: true }]);
      setBusy(true);

      const onEvent = (e: ChatEvent) => {
        switch (e.type) {
          case "session":
            setSessionId(e.session_id);
            break;
          case "tool":
            patch(botId, (m) => ({ ...m, tool_summary: e.summary }));
            break;
          case "delta":
            patch(botId, (m) => ({ ...m, content: m.content + e.text }));
            break;
          case "citations":
            patch(botId, (m) => ({ ...m, citations: e.citations }));
            break;
          case "warranty":
            patch(botId, (m) => ({ ...m, warranty: e.warranty }));
            break;
          case "figure":
            patch(botId, (m) => ({ ...m, figure: e.figure }));
            break;
          case "follow_ups":
            patch(botId, (m) => ({ ...m, follow_ups: e.items }));
            break;
          case "done":
            patch(botId, (m) => ({ ...m, pending: false, log_id: e.log_id }));
            break;
          case "error":
            patch(botId, (m) => ({ ...m, pending: false, error: e.message }));
            break;
        }
      };

      try {
        await streamChat(
          { session_id: sessionId, message: text, answer_lang: answerLang, scope_item_id: scopeItemId, image },
          onEvent,
          ctrl.signal,
        );
        patch(botId, (m) => ({ ...m, pending: false }));
      } catch (err) {
        if (!ctrl.signal.aborted) {
          patch(botId, (m) => ({
            ...m,
            pending: false,
            error: "暂时连不上后端，请稍后再试。" + (err instanceof Error ? `（${err.message}）` : ""),
          }));
        }
      } finally {
        if (abortRef.current === ctrl) setBusy(false);
      }
    },
    [answerLang, scopeItemId, sessionId],
  );

  // 从首页带着问题跳转过来时自动提问
  useEffect(() => {
    const q = params.get("q");
    if (q && !initialAsked.current) {
      initialAsked.current = true;
      send(q, takePendingImage());
    }
  }, [params, send]);

  function newChat() {
    abortRef.current?.abort();
    setMessages([]);
    setSessionId(null);
    setBusy(false);
    setHistoryOpen(false);
    router.replace(scopeItemId ? `/chat?item=${encodeURIComponent(scopeItemId)}` : "/chat");
  }

  function changeScope(id: string | null) {
    setScopeItemId(id);
    router.replace(id ? `/chat?item=${encodeURIComponent(id)}` : "/chat");
  }

  const chipItems = items.slice(0, 3);
  const moreItems = items.slice(3);
  const placeholder = scopeItem ? `接着问${scopeItem.name}…` : "问问家里的东西，比如：空调怎么开睡眠模式？";

  const historyList = (
    <>
      <div className="px-2.5 pb-1 text-xs text-ink-muted">最近</div>
      {sessions.map((s) => (
        <button
          key={s.id}
          type="button"
          aria-current={s.id === sessionId ? "true" : undefined}
          onClick={() => {
            // TODO：后端提供对话历史接口后加载该对话
            setSessionId(s.id);
            setHistoryOpen(false);
          }}
          className={cn(
            "min-h-11 rounded-lg px-3 py-2.5 text-left text-sm",
            s.id === sessionId ? "bg-muted text-ink" : "text-ink-2 hover:bg-muted/60",
          )}
        >
          {s.title}
        </button>
      ))}
    </>
  );

  return (
    <div className="flex h-dvh flex-col md:block md:h-auto">
      {/* ---------- 手机顶栏 ---------- */}
      <header className="flex h-14 shrink-0 items-center gap-1 border-b border-line bg-surface px-2 md:hidden">
        <Link href="/" aria-label="返回" className="inline-flex h-11 w-11 items-center justify-center text-ink">
          <BackIcon size={22} />
        </Link>
        <div className="min-w-0 flex-1">
          <div className="truncate text-base font-bold">{scopeItem?.name ?? "全部物品"}</div>
          <div className="truncate text-xs text-ink-muted">
            {scopeItem ? `${scopeItem.brand ?? ""} · 只在这台的说明书里查` : "在所有资料里查"}
          </div>
        </div>
        <button
          type="button"
          onClick={() => setAnswerLang(langCycle[answerLang])}
          aria-label={`回答语言：${langShort[answerLang]}，点击切换`}
          className="h-8 rounded-full border border-line-strong bg-surface px-3 text-[13px] text-ink"
        >
          {langShort[answerLang]} ⇄
        </button>
        <button
          type="button"
          aria-label="对话记录"
          onClick={() => setHistoryOpen(true)}
          className="inline-flex h-11 w-11 items-center justify-center text-ink"
        >
          <MenuIcon size={20} />
        </button>
      </header>

      {/* 手机：历史记录抽屉 */}
      {historyOpen && (
        <div className="fixed inset-0 z-40 md:hidden" role="dialog" aria-modal="true" aria-label="对话记录">
          <button type="button" aria-label="关闭" className="absolute inset-0 bg-black/30" onClick={() => setHistoryOpen(false)} />
          <div className="absolute inset-y-0 right-0 flex w-[280px] flex-col gap-1.5 bg-surface p-4">
            <div className="mb-2 flex items-center justify-between">
              <span className="font-bold">对话记录</span>
              <button type="button" aria-label="关闭" onClick={() => setHistoryOpen(false)} className="inline-flex h-11 w-11 items-center justify-center">
                <CloseIcon size={18} />
              </button>
            </div>
            <button type="button" onClick={newChat} className="mb-3 h-11 rounded-[10px] bg-accent text-[15px] font-medium text-white">
              ＋ 新对话
            </button>
            {historyList}
          </div>
        </div>
      )}

      <main className="flex min-h-0 flex-1 flex-col md:mx-auto md:max-w-[1200px] md:flex-row md:flex-wrap md:items-start md:gap-5 md:px-6 md:pb-10 md:pt-6">
        {/* ---------- 电脑：左侧历史对话 ---------- */}
        <aside aria-label="对话记录" className="hidden min-w-0 flex-[1_1_220px] flex-col gap-1.5 md:flex">
          <button
            type="button"
            onClick={newChat}
            className="mb-3 inline-flex h-11 items-center justify-center gap-1 rounded-[10px] bg-accent text-[15px] font-medium text-white hover:bg-accent-strong"
          >
            <PlusIcon size={16} /> 新对话
          </button>
          {historyList}
        </aside>

        <section
          aria-label="对话"
          className="flex min-h-0 min-w-0 flex-1 flex-col md:min-h-[720px] md:flex-[999_1_600px] md:rounded-[14px] md:border md:border-line md:bg-surface"
        >
          {/* 电脑：查询范围 + 回答语言 */}
          <div className="hidden flex-wrap items-center gap-2 border-b border-line px-5 py-3.5 md:flex">
            <span className="mr-1 text-[13px] text-ink-muted">查询范围</span>
            <Chip pressed={scopeItemId == null} onClick={() => changeScope(null)}>
              全部物品
            </Chip>
            {chipItems.map((it) => (
              <Chip key={it.item_id} pressed={scopeItemId === it.item_id} onClick={() => changeScope(it.item_id)}>
                {it.name}
              </Chip>
            ))}
            {moreItems.length > 0 && (
              <label className="relative">
                <span className="sr-only">更多物品</span>
                <select
                  value={moreItems.some((i) => i.item_id === scopeItemId) ? scopeItemId! : ""}
                  onChange={(e) => changeScope(e.target.value || null)}
                  className={cn(
                    "h-[34px] cursor-pointer rounded-full border px-3 text-[13px]",
                    moreItems.some((i) => i.item_id === scopeItemId)
                      ? "border-accent bg-accent-soft font-medium text-accent-strong"
                      : "border-transparent bg-transparent text-accent",
                  )}
                >
                  <option value="">更多…</option>
                  {moreItems.map((it) => (
                    <option key={it.item_id} value={it.item_id}>
                      {it.name}
                    </option>
                  ))}
                </select>
              </label>
            )}
            <LanguageToggle value={answerLang} onChange={setAnswerLang} className="ml-auto" />
          </div>

          {/* 消息列表 */}
          <div className="flex min-h-0 flex-1 flex-col gap-3.5 overflow-y-auto px-3.5 py-4 md:gap-6 md:overflow-visible md:p-6">
            {messages.length === 0 && (
              <div className="m-auto max-w-sm py-10 text-center text-ink-muted">
                <p className="mb-1 text-base font-medium text-ink">
                  {scopeItem ? `关于「${scopeItem.name}」想问什么？` : "想问家里哪件东西？"}
                </p>
                <p className="text-sm">可以直接打字，也可以拍下面板或遥控器提问。</p>
              </div>
            )}
            {messages.map((m) =>
              m.role === "user" ? (
                <div
                  key={m.id}
                  className="flex max-w-[80%] flex-col gap-2 self-end rounded-[16px_16px_4px_16px] bg-muted px-3.5 py-2.5 text-[15px] md:max-w-[72%] md:rounded-[14px_14px_4px_14px] md:px-4 md:py-3"
                >
                  {m.image_preview && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={m.image_preview} alt="提问附带的照片" className="max-h-40 rounded-lg object-cover" />
                  )}
                  {m.content}
                </div>
              ) : (
                <AssistantMessage key={m.id} msg={m} onFollowUp={(q) => send(q, null)} />
              ),
            )}
            <div ref={bottomRef} />
          </div>

          {/* 输入区 */}
          <div className="shrink-0 border-t border-line bg-surface px-3.5 pb-[calc(18px+env(safe-area-inset-bottom))] pt-2.5 md:px-5 md:pb-[18px] md:pt-4">
            <div className="hidden md:block">
              <Composer variant="desktop" placeholder={placeholder} onSubmit={send} disabled={busy} />
            </div>
            <div className="md:hidden">
              <Composer placeholder={placeholder} onSubmit={send} disabled={busy} />
            </div>
            <div className="mt-2 pl-1 text-xs text-ink-muted" role="status">
              {backend === "connecting"
                ? "正在连接…"
                : backend === "offline"
                  ? "后端暂时连不上，可以先输入问题。"
                  : <span className="hidden md:inline">回答只依据你上传的资料，每条结论都会标出处；找不到时会直接说明。</span>}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
