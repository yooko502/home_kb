import type { Category, Channel, DocType, WarrantyStatus } from "./types";

const jpy = new Intl.NumberFormat("ja-JP", { style: "currency", currency: "JPY" });

export function formatJPY(value: number | null | undefined): string {
  return value == null ? "—" : jpy.format(value);
}

export const categoryLabel: Record<Category, string> = {
  appliance: "电器",
  furniture: "家具",
  other: "其他",
};

export const channelLabel: Record<Channel, string> = {
  online: "线上",
  offline: "线下",
};

export const warrantyStatusLabel: Record<WarrantyStatus, string> = {
  active: "在保",
  expiring: "即将到期",
  expired: "已过保",
  unknown: "无保修信息",
};

export const docTypeLabel: Record<DocType, string> = {
  auto: "自动识别",
  manual: "说明书",
  assembly: "组装图",
  invoice: "发票",
  receipt: "小票",
  warranty_card: "保修卡",
  nameplate: "铭牌",
  note: "笔记",
  other: "其他",
};

/** 剩余时间：一年以内按天，否则按「x 年 y 个月」 */
export function formatRemaining(daysLeft: number | null): string {
  if (daysLeft == null) return "";
  if (daysLeft < 365) return `剩 ${daysLeft} 天`;
  const years = Math.floor(daysLeft / 365);
  const months = Math.floor((daysLeft % 365) / 30.4);
  return months > 0 ? `剩 ${years} 年 ${months} 个月` : `剩 ${years} 年`;
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

/** 根据文件名猜测文档类型（仅作为默认值，用户可改） */
export function guessDocType(filename: string): DocType {
  const n = filename.toLowerCase();
  if (/说明书|取扱|manual|説明/.test(n)) return "manual";
  if (/组装|組立|assembly/.test(n)) return "assembly";
  if (/发票|領収|invoice/.test(n)) return "invoice";
  if (/小票|レシート|receipt/.test(n)) return "receipt";
  if (/保修|保証/.test(n)) return "warranty_card";
  if (/铭牌|nameplate/.test(n)) return "nameplate";
  return "auto";
}
