/**
 * 前端与后端约定的数据结构（对应计划书第 3、9 节）。
 * 后端的 Pydantic schema 应与这里保持一致。
 */

export type Category = "appliance" | "furniture" | "other";
export type Channel = "online" | "offline";
export type WarrantyStatus = "active" | "expiring" | "expired" | "unknown";
export type AnswerLang = "auto" | "zh" | "ja";

/** GET /api/items —— 对应视图 v_ledger 的一行 */
export interface LedgerRow {
  item_id: string;
  name: string;
  category: Category;
  brand: string | null;
  model: string | null;
  location: string | null;
  purchase_date: string | null; // YYYY-MM-DD
  store: string | null;
  channel: Channel | null;
  price: number | null; // JPY，整数
  warranty_end: string | null;
  warranty_status: WarrantyStatus;
  days_left: number | null;
  service_phone: string | null;
  doc_count: number;
  has_pending_draft: boolean;
  missing_warranty_card: boolean;
  has_extended_warranty?: boolean;
}

export interface LedgerFilters {
  q?: string;
  category?: Category;
  warranty_status?: WarrantyStatus;
  location?: string;
}

export interface PartWarrantyInput {
  part_name: string;
  months: number | null;
}

/** POST /api/items、PATCH /api/items/{id} 的表单负载（手动录入与识别确认共用） */
export interface ItemFormInput {
  name: string;
  category: Category;
  brand: string;
  model: string;
  location: string;
  serial_number: string;
  purchase_date: string;
  channel: Channel;
  store: string;
  price: number | null;
  order_no: string;
  warranty_months: number | null;
  service_phone: string;
  part_warranties: PartWarrantyInput[];
  proof_document_id: string | null;
}

export type DocType =
  | "auto"
  | "manual"
  | "assembly"
  | "invoice"
  | "receipt"
  | "warranty_card"
  | "nameplate"
  | "note"
  | "other";

export type JobStatus = "queued" | "running" | "pending_review" | "done" | "failed";

/** GET /api/jobs */
export interface Job {
  id: string;
  document_id: string;
  filename: string;
  status: JobStatus;
  /** 进度说明，例如「文字抽取 · 第 23 / 60 页」 */
  detail: string;
  /** 0～1；只在 running 时有意义 */
  progress: number | null;
  error: string | null;
}

/** GET /api/drafts —— 识别结果草稿（Phase 2） */
export interface ExtractionDraft {
  id: string;
  document_id: string;
  source_filename: string;
  payload: Partial<ItemFormInput> & { item_label?: string };
  /** 置信度低于阈值的字段名 */
  low_confidence_fields: string[];
}

export interface Citation {
  index: number;
  doc_title: string;
  page_no: number | null;
  /** 章节标题（通常是日文原文） */
  section: string | null;
  section_lang?: "ja" | "zh" | "en";
  page_image_url: string | null;
  kind: "manual" | "ledger";
}

export interface WarrantyNote {
  status: WarrantyStatus;
  text: string;
  citation?: number;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  /**
   * 回答正文（简化 Markdown）：
   * - 以「1. 」开头的行是有序列表
   * - **粗体**
   * - [[切タイマー]] 表示设备上的日文按键名，高亮显示
   * - [1] 表示引用编号
   */
  content: string;
  image_preview?: string | null;
  tool_summary?: string;
  citations?: Citation[];
  warranty?: WarrantyNote;
  /** 组装图等原图 */
  figure?: { label: string; image_url: string | null };
  follow_ups?: string[];
  log_id?: string;
  pending?: boolean;
  error?: string;
}

export interface ChatRequest {
  session_id: string | null;
  message: string;
  answer_lang: AnswerLang;
  scope_item_id: string | null;
  image?: File | null;
}

/**
 * POST /api/chat 的 SSE 事件（event 名 → data JSON）
 */
export type ChatEvent =
  | { type: "session"; session_id: string }
  | { type: "tool"; summary: string }
  | { type: "delta"; text: string }
  | { type: "citations"; citations: Citation[] }
  | { type: "warranty"; warranty: WarrantyNote }
  | { type: "figure"; figure: { label: string; image_url: string | null } }
  | { type: "follow_ups"; items: string[] }
  | { type: "done"; log_id: string }
  | { type: "error"; message: string };

export interface ChatSessionSummary {
  id: string;
  title: string;
  item_id: string | null;
}

export interface RecentQuestion {
  item_id: string;
  item_label: string;
  question: string;
}
