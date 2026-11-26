/**
 * 示例数据：后端未接入时（NEXT_PUBLIC_USE_MOCK=1）由 lib/api.ts 返回。
 * 保修状态与剩余天数按当天日期实时计算，和 v_ledger 的规则一致。
 */
import type {
  ChatEvent,
  ChatSessionSummary,
  ExtractionDraft,
  Job,
  LedgerRow,
  RecentQuestion,
} from "./types";
import { statusFor } from "./warranty";

type Seed = Omit<LedgerRow, "warranty_status" | "days_left">;

const seeds: Seed[] = [
  {
    item_id: "washer",
    name: "洗衣机",
    category: "appliance",
    brand: "Panasonic",
    model: null,
    location: "阳台",
    purchase_date: "2023-12-20",
    store: "ヨドバシカメラ",
    channel: "offline",
    price: 118000,
    warranty_end: "2026-12-19",
    service_phone: "0120-878-365",
    doc_count: 2,
    has_pending_draft: false,
    missing_warranty_card: true,
  },
  {
    item_id: "aircon",
    name: "客厅空调",
    category: "appliance",
    brand: "Daikin",
    model: null,
    location: "客厅",
    purchase_date: "2024-06-01",
    store: "ビックカメラ",
    channel: "offline",
    price: 89800,
    warranty_end: "2029-05-31",
    service_phone: "0120-88-1081",
    doc_count: 3,
    has_pending_draft: false,
    missing_warranty_card: false,
    has_extended_warranty: true,
  },
  {
    item_id: "tv",
    name: "电视",
    category: "appliance",
    brand: "Sony",
    model: null,
    location: "客厅",
    purchase_date: "2026-03-08",
    store: "ケーズデンキ",
    channel: "offline",
    price: 128000,
    warranty_end: "2027-03-07",
    service_phone: "0120-777-886",
    doc_count: 2,
    has_pending_draft: false,
    missing_warranty_card: false,
  },
  {
    item_id: "microwave",
    name: "微波炉",
    category: "appliance",
    brand: "Sharp",
    model: null,
    location: "厨房",
    purchase_date: "2026-02-01",
    store: "ヨドバシカメラ",
    channel: "offline",
    price: 32800,
    warranty_end: "2027-01-31",
    service_phone: "0120-078-178",
    doc_count: 2,
    has_pending_draft: false,
    missing_warranty_card: false,
  },
  {
    item_id: "heater",
    name: "热水器",
    category: "appliance",
    brand: "Rinnai",
    model: null,
    location: "厨房",
    purchase_date: "2022-05-18",
    store: "地元の設備店",
    channel: "offline",
    price: 168000,
    warranty_end: "2025-05-17",
    service_phone: null,
    doc_count: 1,
    has_pending_draft: false,
    missing_warranty_card: true,
  },
  {
    item_id: "billy",
    name: "BILLY 书柜",
    category: "furniture",
    brand: "IKEA",
    model: "BILLY",
    location: "书房",
    purchase_date: "2023-09-02",
    store: "IKEA 店舗",
    channel: "offline",
    price: 12990,
    warranty_end: null,
    service_phone: null,
    doc_count: 1,
    has_pending_draft: false,
    missing_warranty_card: false,
  },
  {
    item_id: "sofa",
    name: "三人位沙发",
    category: "furniture",
    brand: "ニトリ",
    model: null,
    location: "客厅",
    purchase_date: "2025-02-14",
    store: "ニトリ",
    channel: "online",
    price: 59900,
    warranty_end: "2028-02-13",
    service_phone: null,
    doc_count: 1,
    has_pending_draft: true,
    missing_warranty_card: false,
  },
];

export function mockLedger(): LedgerRow[] {
  return seeds.map((s) => {
    const { status, daysLeft } = statusFor(s.warranty_end);
    return { ...s, warranty_status: status, days_left: daysLeft };
  });
}

/** 问答首页的常用物品（前 5 个） */
export const mockFavoriteItemIds = ["aircon", "tv", "washer", "microwave", "heater"];

export const mockRecentQuestions: RecentQuestion[] = [
  { item_id: "aircon", item_label: "空调", question: "怎么设置 2 小时后自动关机" },
  { item_id: "tv", item_label: "电视", question: "快捷菜单怎么添加常用项" },
  { item_id: "washer", item_label: "洗衣机", question: "槽清洁多久做一次" },
];

export const mockSessions: ChatSessionSummary[] = [
  { id: "s1", title: "洗衣机 E4 报错 + 保修", item_id: "washer" },
  { id: "s2", title: "空调滤网怎么拆洗", item_id: "aircon" },
  { id: "s3", title: "哪些东西明年过保", item_id: null },
  { id: "s4", title: "路由器恢复出厂设置", item_id: null },
];

export const mockJobs: Job[] = [
  {
    id: "j1",
    document_id: "d1",
    filename: "Panasonic 洗濯機 取扱説明書.pdf",
    status: "running",
    detail: "文字抽取 · 第 23 / 60 页",
    progress: 0.38,
    error: null,
  },
  {
    id: "j2",
    document_id: "d2",
    filename: "BILLY 书柜组装说明.pdf",
    status: "running",
    detail: "图纸逐页描述 · 20 / 32 页",
    progress: 0.62,
    error: null,
  },
  {
    id: "j3",
    document_id: "d3",
    filename: "ニトリ 領収書.jpg",
    status: "pending_review",
    detail: "识别出 1 条购买记录",
    progress: null,
    error: null,
  },
  {
    id: "j4",
    document_id: "d4",
    filename: "Sony テレビ 取扱説明書.pdf",
    status: "done",
    detail: "92 页 · 214 个片段 · 3 分钟前",
    progress: null,
    error: null,
  },
  {
    id: "j5",
    document_id: "d5",
    filename: "热水器说明书_拍照.jpg",
    status: "failed",
    detail: "图片模糊，文字识别率过低",
    progress: null,
    error: "low_ocr_confidence",
  },
];

export const mockDraft: ExtractionDraft = {
  id: "draft1",
  document_id: "d3",
  source_filename: "ニトリ 領収書.jpg",
  payload: {
    item_label: "三人位沙发 · ニトリ",
    purchase_date: "2025-02-14",
    store: "ニトリ",
    price: 59900,
    order_no: "2846 1937 552?",
    warranty_months: 36,
    service_phone: "",
  },
  low_confidence_fields: ["order_no"],
};

/* ---------------- 问答示例 ---------------- */

type Script = ChatEvent[];

const washerScript: Script = [
  { type: "tool", summary: "已查询：识别物品「洗衣机」 · 说明书检索 5 段 · 保修信息" },
  {
    type: "delta",
    text:
      "E4 在这台洗衣机上表示**给水异常**：启动后在规定时间内没有达到设定水位[1]。可以按下面的顺序排查：\n" +
      "1. 确认水龙头已打开、水压正常；\n" +
      "2. 检查进水管有没有弯折或被压住；\n" +
      "3. 关上水龙头，拆下[[給水口]]的过滤网清除杂质[2]。\n" +
      "如果还是报错，说明书建议联系售后，不要自行拆机[1]。",
  },
  {
    type: "warranty",
    warranty: {
      status: "expiring",
      text: "2023-12-20 购于 ヨドバシカメラ，整机保修至 2026-12-19，即将到期",
      citation: 3,
    },
  },
  {
    type: "citations",
    citations: [
      { index: 1, kind: "manual", doc_title: "洗衣机说明书", page_no: 34, section: "エラー表示が出たら", section_lang: "ja", page_image_url: null },
      { index: 2, kind: "manual", doc_title: "洗衣机说明书", page_no: 41, section: "お手入れ", section_lang: "ja", page_image_url: null },
      { index: 3, kind: "ledger", doc_title: "物品台账", page_no: null, section: "购买与保修记录", page_image_url: null },
    ],
  },
  { type: "follow_ups", items: ["槽清洁怎么做", "保修卡在哪里", "拨打售后"] },
  { type: "done", log_id: "log-washer" },
];

const airconScript: Script = [
  { type: "tool", summary: "已查询：取扱説明書 第 24–25 页" },
  {
    type: "delta",
    text:
      "用遥控器上的 [[切タイマー]]（关机定时）键[1]：\n" +
      "1. 按一下 [[切タイマー]]，遥控器屏幕上出现时间\n" +
      "2. 按 [[▲]] [[▼]] 调到「2 時間」\n" +
      "3. 对准空调按 [[送信]]（发送），听到提示音即可\n" +
      "取消：再按一次 [[取消]][2]",
  },
  {
    type: "citations",
    citations: [
      { index: 1, kind: "manual", doc_title: "取扱説明書", page_no: 24, section: "タイマーの使いかた", section_lang: "ja", page_image_url: null },
      { index: 2, kind: "manual", doc_title: "取扱説明書", page_no: 25, section: "タイマーを取り消すとき", section_lang: "ja", page_image_url: null },
    ],
  },
  { type: "follow_ups", items: ["设置开机定时", "睡眠模式", "滤网清洁"] },
  { type: "done", log_id: "log-aircon" },
];

const billyScript: Script = [
  { type: "tool", summary: "已查询：BILLY 书柜组装说明 · 第 7 页" },
  {
    type: "delta",
    text:
      "第 5 步是把中间层板装到两块侧板之间。图纸上标出的零件以 VLM 从图纸中识别的结果为准[1]。文字只是辅助，请对照下面的原图操作。",
  },
  { type: "figure", figure: { label: "原图：BILLY 书柜组装说明 · 第 7 页", image_url: null } },
  {
    type: "citations",
    citations: [
      { index: 1, kind: "manual", doc_title: "BILLY 书柜组装说明", page_no: 7, section: "Step 5", section_lang: "en", page_image_url: null },
    ],
  },
  { type: "done", log_id: "log-billy" },
];

const fallbackScript: Script = [
  { type: "tool", summary: "示例模式：后端尚未接入" },
  {
    type: "delta",
    text:
      "现在是**示例模式**，回答来自前端内置的示例数据。后端的 `/api/chat` 接入后，这里会显示根据说明书检索生成的回答，并标出处。",
  },
  { type: "done", log_id: "log-fallback" },
];

export function mockChatScript(message: string, scopeItemId: string | null): Script {
  if (/E4|洗衣|洗濯/.test(message) || scopeItemId === "washer") return washerScript;
  if (/书柜|BILLY|第\s*5\s*步|组装/.test(message) || scopeItemId === "billy") return billyScript;
  if (/定时|关机|タイマー|空调/.test(message) || scopeItemId === "aircon") return airconScript;
  return fallbackScript;
}
