/**
 * 后端 API 客户端（接口见计划书第 9 节）。
 * NEXT_PUBLIC_USE_MOCK=1 时返回 lib/mock-data.ts 的示例数据，不发请求。
 */
import {
  mockChatScript,
  mockDraft,
  mockFavoriteItemIds,
  mockJobs,
  mockLedger,
  mockRecentQuestions,
  mockSessions,
} from "./mock-data";
import type {
  ChatEvent,
  ChatRequest,
  ChatSessionSummary,
  DocType,
  ExtractionDraft,
  ItemFormInput,
  Job,
  LedgerFilters,
  LedgerRow,
  RecentQuestion,
} from "./types";

export const API_BASE = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000").replace(/\/$/, "");
export const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK !== "0";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  // TODO(Phase 1.5)：带上 Supabase 的 JWT —— Authorization: Bearer <token>
  const res = await fetch(`${API_BASE}${path}`, init);
  if (!res.ok) throw new Error(`${init?.method ?? "GET"} ${path} → ${res.status}`);
  return (await res.json()) as T;
}

function query(params: Record<string, string | undefined>): string {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v) sp.set(k, v);
  const s = sp.toString();
  return s ? `?${s}` : "";
}

/* ---------- 健康检查（唤醒 Cloud Run） ---------- */

export async function pingHealth(): Promise<boolean> {
  if (USE_MOCK) return true;
  try {
    const res = await fetch(`${API_BASE}/healthz`, { cache: "no-store" });
    return res.ok;
  } catch {
    return false;
  }
}

/* ---------- 物品台账 ---------- */

export async function listItems(filters: LedgerFilters = {}): Promise<LedgerRow[]> {
  if (USE_MOCK) return mockLedger();
  return request<LedgerRow[]>(
    `/api/items${query({
      q: filters.q,
      category: filters.category,
      warranty_status: filters.warranty_status,
      location: filters.location,
    })}`,
  );
}

export async function getItemForm(itemId: string): Promise<ItemFormInput> {
  if (USE_MOCK) {
    const row = mockLedger().find((r) => r.item_id === itemId);
    return {
      name: row?.name ?? "",
      category: row?.category ?? "appliance",
      brand: row?.brand ?? "",
      model: row?.model ?? "",
      location: row?.location ?? "",
      serial_number: "",
      purchase_date: row?.purchase_date ?? "",
      channel: row?.channel ?? "offline",
      store: row?.store ?? "",
      price: row?.price ?? null,
      order_no: "",
      warranty_months: row?.warranty_end ? 12 : null,
      service_phone: row?.service_phone ?? "",
      part_warranties: [],
      proof_document_id: null,
    };
  }
  return request<ItemFormInput>(`/api/items/${encodeURIComponent(itemId)}`);
}

export async function saveItem(itemId: string | null, input: ItemFormInput): Promise<void> {
  if (USE_MOCK) {
    await sleep(300);
    return;
  }
  await request(itemId ? `/api/items/${encodeURIComponent(itemId)}` : "/api/items", {
    method: itemId ? "PATCH" : "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
}

export function exportCsvUrl(): string {
  return `${API_BASE}/api/items/export.csv`;
}

export async function listFavoriteItemIds(): Promise<string[]> {
  // 后端暂无专门接口；先取前端示例或台账前几项
  if (USE_MOCK) return mockFavoriteItemIds;
  const rows = await listItems();
  return rows.slice(0, 5).map((r) => r.item_id);
}

export async function listRecentQuestions(): Promise<RecentQuestion[]> {
  if (USE_MOCK) return mockRecentQuestions;
  return []; // TODO：后端提供最近提问接口后接入
}

/* ---------- 上传与处理队列 ---------- */

export async function uploadDocument(
  file: File,
  docType: DocType,
  link: { item_id?: string | null },
): Promise<{ document_id: string; job_id: string }> {
  if (USE_MOCK) {
    await sleep(400);
    const id = Math.random().toString(36).slice(2, 8);
    return { document_id: `d-${id}`, job_id: `j-${id}` };
  }
  const form = new FormData();
  form.append("file", file);
  if (docType !== "auto") form.append("doc_type", docType);
  if (link.item_id) form.append("item_id", link.item_id);
  return request(`/api/documents`, { method: "POST", body: form });
}

export async function listJobs(): Promise<Job[]> {
  if (USE_MOCK) return mockJobs;
  return request<Job[]>(`/api/jobs`);
}

export async function retryJob(documentId: string): Promise<void> {
  if (USE_MOCK) return;
  await request(`/api/documents/${encodeURIComponent(documentId)}/reprocess`, { method: "POST" });
}

export async function listDrafts(): Promise<ExtractionDraft[]> {
  if (USE_MOCK) return [mockDraft];
  return request<ExtractionDraft[]>(`/api/drafts`);
}

export async function confirmDraft(draftId: string, input: Partial<ItemFormInput>): Promise<void> {
  if (USE_MOCK) return;
  await request(`/api/drafts/${encodeURIComponent(draftId)}/confirm`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
}

/* ---------- 问答 ---------- */

export async function listChatSessions(): Promise<ChatSessionSummary[]> {
  if (USE_MOCK) return mockSessions;
  return []; // TODO：后端提供对话历史接口后接入
}

/** POST /api/chat，逐个回调 SSE 事件 */
export async function streamChat(
  req: ChatRequest,
  onEvent: (e: ChatEvent) => void,
  signal?: AbortSignal,
): Promise<void> {
  if (USE_MOCK) {
    for (const ev of mockChatScript(req.message, req.scope_item_id)) {
      if (signal?.aborted) return;
      if (ev.type === "delta") {
        // 模拟流式输出
        for (let i = 0; i < ev.text.length; i += 6) {
          if (signal?.aborted) return;
          onEvent({ type: "delta", text: ev.text.slice(i, i + 6) });
          await sleep(18);
        }
      } else {
        await sleep(ev.type === "tool" ? 350 : 60);
        onEvent(ev);
      }
    }
    return;
  }

  const form = new FormData();
  form.append(
    "payload",
    JSON.stringify({
      session_id: req.session_id,
      message: req.message,
      answer_lang: req.answer_lang,
      scope_item_id: req.scope_item_id,
    }),
  );
  if (req.image) form.append("image", req.image);

  const res = await fetch(`${API_BASE}/api/chat`, { method: "POST", body: form, signal });
  if (!res.ok || !res.body) throw new Error(`POST /api/chat → ${res.status}`);

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    let sep: number;
    while ((sep = buffer.indexOf("\n\n")) >= 0) {
      const raw = buffer.slice(0, sep);
      buffer = buffer.slice(sep + 2);
      let event = "message";
      const data: string[] = [];
      for (const line of raw.split("\n")) {
        if (line.startsWith("event:")) event = line.slice(6).trim();
        else if (line.startsWith("data:")) data.push(line.slice(5).trimStart());
      }
      if (!data.length) continue;
      try {
        onEvent({ type: event, ...JSON.parse(data.join("\n")) } as ChatEvent);
      } catch {
        /* 忽略无法解析的事件 */
      }
    }
  }
}

export async function sendFeedback(logId: string, value: 1 | -1): Promise<void> {
  if (USE_MOCK) return;
  await request(`/api/chat/${encodeURIComponent(logId)}/feedback`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ feedback: value }),
  });
}
