import type { WarrantyStatus } from "./types";

/**
 * 保修到期日预览：end = start + months − 1 天（计划书 3.5）。
 * 仅用于表单里的即时显示；正式值由后端计算并写入。
 */
export function previewWarrantyEnd(start: string, months: number | null): string | null {
  if (!start || !months || months <= 0) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(start);
  if (!m) return null;
  const d = new Date(Date.UTC(+m[1], +m[2] - 1 + months, +m[3]));
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

export function todayISO(): string {
  const d = new Date();
  const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

export function daysBetween(fromISO: string, toISO: string): number {
  const a = Date.parse(fromISO + "T00:00:00Z");
  const b = Date.parse(toISO + "T00:00:00Z");
  return Math.round((b - a) / 86400000);
}

/** 与 v_ledger 中的 CASE 表达式一致 */
export function statusFor(end: string | null, today = todayISO()): {
  status: WarrantyStatus;
  daysLeft: number | null;
} {
  if (!end) return { status: "unknown", daysLeft: null };
  const daysLeft = daysBetween(today, end);
  if (daysLeft < 0) return { status: "expired", daysLeft };
  if (daysLeft < 30) return { status: "expiring", daysLeft };
  return { status: "active", daysLeft };
}
