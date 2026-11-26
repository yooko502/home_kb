"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { PlusIcon, SearchIcon } from "@/components/icons";
import { PurchaseForm } from "@/components/ledger/PurchaseForm";
import { Badge, Button, Chip, WarrantyBadge } from "@/components/ui";
import { USE_MOCK, exportCsvUrl, listItems } from "@/lib/api";
import { cn } from "@/lib/cn";
import { categoryLabel, channelLabel, formatJPY } from "@/lib/format";
import type { Category, LedgerRow, WarrantyStatus } from "@/lib/types";

type Quick = "all" | "expiring" | "expired" | "missing_card";

export function LedgerView() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const [rows, setRows] = useState<LedgerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [category, setCategory] = useState<Category | "all">("all");
  const [warranty, setWarranty] = useState<WarrantyStatus | "all">("all");
  const [location, setLocation] = useState("all");
  const [quick, setQuick] = useState<Quick>("all");

  // ?form=new 新建；?edit=<id> 编辑
  const formMode = params.get("form") === "new" ? "new" : params.get("edit");

  const load = useCallback(() => {
    setLoading(true);
    listItems()
      .then(setRows)
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(load, [load]);

  const openForm = (id: string | null) => router.push(`${pathname}?${id ? `edit=${encodeURIComponent(id)}` : "form=new"}`);
  const closeForm = useCallback(() => router.push(pathname), [router, pathname]);

  const locations = useMemo(() => [...new Set(rows.map((r) => r.location).filter(Boolean))] as string[], [rows]);
  const count = (fn: (r: LedgerRow) => boolean) => rows.filter(fn).length;

  const filtered = useMemo(() => {
    const kw = q.trim().toLowerCase();
    return rows.filter((r) => {
      if (kw && ![r.name, r.brand, r.model].some((v) => v?.toLowerCase().includes(kw))) return false;
      if (category !== "all" && r.category !== category) return false;
      if (warranty !== "all" && r.warranty_status !== warranty) return false;
      if (location !== "all" && r.location !== location) return false;
      if (quick === "expiring" && r.warranty_status !== "expiring") return false;
      if (quick === "expired" && r.warranty_status !== "expired") return false;
      if (quick === "missing_card" && !r.missing_warranty_card) return false;
      return true;
    });
  }, [rows, q, category, warranty, location, quick]);

  const nExpiring = count((r) => r.warranty_status === "expiring");
  const nExpired = count((r) => r.warranty_status === "expired");
  const nMissing = count((r) => r.missing_warranty_card);

  const exportCsv = () => {
    if (USE_MOCK) {
      const head = ["物品", "品牌", "型号", "类别", "位置", "购买日期", "店铺", "渠道", "价格", "保修到期", "售后电话"];
      const lines = rows.map((r) =>
        [r.name, r.brand, r.model, categoryLabel[r.category], r.location, r.purchase_date, r.store, r.channel && channelLabel[r.channel], r.price, r.warranty_end, r.service_phone]
          .map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`)
          .join(","),
      );
      const blob = new Blob(["﻿" + [head.join(","), ...lines].join("\n")], { type: "text/csv" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "ledger.csv";
      a.click();
      URL.revokeObjectURL(a.href);
    } else {
      window.location.href = exportCsvUrl();
    }
  };

  return (
    <div className="pb-[calc(64px+env(safe-area-inset-bottom))] md:pb-0">
      <main className="mx-auto flex max-w-[1200px] flex-col gap-2.5 px-[18px] pb-6 pt-3.5 md:gap-[18px] md:px-6 md:pb-12 md:pt-8">
        <div className="flex flex-wrap items-center justify-between gap-4 md:items-end">
          <div>
            <h1 className="text-xl font-bold md:mb-1.5 md:text-[26px]">物品台账</h1>
            <p className="hidden text-[15px] text-ink-muted md:block">
              {rows.length} 件物品 · {nExpiring} 件 30 天内过保 · {nExpired} 件已过保
            </p>
          </div>
          <div className="flex gap-2.5">
            <span className="hidden md:contents">
              <Button onClick={exportCsv}>导出 CSV</Button>
            </span>
            <Button variant="primary" onClick={() => openForm(null)} className="w-11 px-0 md:w-auto md:px-5" aria-label="添加物品">
              <span className="md:hidden">
                <PlusIcon size={20} />
              </span>
              <span className="hidden md:inline">＋ 添加物品</span>
            </Button>
          </div>
        </div>

        {/* 筛选 */}
        <div className="flex flex-wrap items-center gap-2.5">
          <label className="flex h-11 min-w-0 flex-[1_1_280px] items-center gap-2 rounded-xl border border-line-strong bg-surface px-3 md:h-[42px] md:rounded-[10px]">
            <SearchIcon size={16} className="text-ink-muted" />
            <input
              aria-label="搜索物品"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="搜索名称、品牌、型号"
              className="min-w-0 flex-1 border-0 bg-transparent text-base text-ink outline-none placeholder:text-ink-faint focus-visible:outline-none md:text-sm"
            />
          </label>

          {/* 电脑：类别 + 保修 + 位置 */}
          <div role="group" aria-label="类别" className="hidden gap-1 rounded-[10px] bg-muted p-1 md:flex">
            {([
              ["all", `全部 ${rows.length}`],
              ["appliance", `电器 ${count((r) => r.category === "appliance")}`],
              ["furniture", `家具 ${count((r) => r.category === "furniture")}`],
            ] as const).map(([v, label]) => (
              <button
                key={v}
                type="button"
                aria-pressed={category === v}
                onClick={() => setCategory(v)}
                className={cn(
                  "h-[34px] rounded-[7px] px-3.5 text-sm",
                  category === v ? "bg-surface font-medium text-ink" : "text-ink-muted",
                )}
              >
                {label}
              </button>
            ))}
          </div>
          <label className="hidden items-center gap-2 text-[13px] text-ink-muted md:flex">
            保修
            <select
              value={warranty}
              onChange={(e) => setWarranty(e.target.value as WarrantyStatus | "all")}
              className="h-[42px] rounded-[10px] border border-line-strong bg-surface px-2.5 text-sm text-ink"
            >
              <option value="all">全部状态</option>
              <option value="active">在保</option>
              <option value="expiring">30 天内到期</option>
              <option value="expired">已过保</option>
              <option value="unknown">无保修信息</option>
            </select>
          </label>
          <label className="hidden items-center gap-2 text-[13px] text-ink-muted md:flex">
            位置
            <select
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="h-[42px] rounded-[10px] border border-line-strong bg-surface px-2.5 text-sm text-ink"
            >
              <option value="all">全部位置</option>
              {locations.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
          </label>

          {/* 手机：快捷筛选 */}
          <div role="group" aria-label="筛选" className="no-scrollbar -mx-[18px] flex w-[calc(100%+36px)] gap-1.5 overflow-x-auto px-[18px] md:hidden">
            <Chip pressed={quick === "all"} onClick={() => setQuick("all")}>全部 {rows.length}</Chip>
            <Chip pressed={quick === "expiring"} onClick={() => setQuick("expiring")}>快到期 {nExpiring}</Chip>
            <Chip pressed={quick === "expired"} onClick={() => setQuick("expired")}>已过保 {nExpired}</Chip>
            <Chip pressed={quick === "missing_card"} onClick={() => setQuick("missing_card")}>缺保修卡 {nMissing}</Chip>
          </div>
        </div>

        {loading ? (
          <p className="py-10 text-center text-sm text-ink-muted">加载中…</p>
        ) : filtered.length === 0 ? (
          <p className="py-10 text-center text-sm text-ink-muted">没有符合条件的物品</p>
        ) : (
          <>
            <LedgerTable rows={filtered} onEdit={openForm} />
            <div className="flex flex-col gap-2.5 pt-0.5 md:hidden">
              {filtered.map((r) => (
                <LedgerCard key={r.item_id} row={r} onEdit={() => openForm(r.item_id)} />
              ))}
            </div>
          </>
        )}

        <p className="hidden text-[13px] leading-relaxed text-ink-muted md:block">
          保修到期日和剩余时间由系统根据购买日期与保修月数计算。「识别待确认」的记录来自发票自动识别，确认前不参与保修提醒。家电缺少保修卡（保証書）时会提示。
        </p>
      </main>

      {formMode && (
        <PurchaseForm
          itemId={formMode === "new" ? null : formMode}
          onClose={closeForm}
          onSaved={() => {
            closeForm();
            load();
          }}
        />
      )}
    </div>
  );
}

const th = "whitespace-nowrap border-b border-line bg-subtle px-3.5 py-3 text-left text-xs font-medium text-ink-muted";
const td = "whitespace-nowrap border-b border-line-soft p-3.5 align-middle text-sm";

function LedgerTable({ rows, onEdit }: { rows: LedgerRow[]; onEdit: (id: string) => void }) {
  return (
    <div className="hidden overflow-x-auto rounded-[14px] border border-line bg-surface md:block">
      <table className="w-full min-w-[1080px] border-collapse">
        <thead>
          <tr>
            <th className={th}>物品</th>
            <th className={th}>位置</th>
            <th className={th}>购买日期</th>
            <th className={th}>店铺 / 渠道</th>
            <th className={cn(th, "text-right")}>价格</th>
            <th className={th}>保修</th>
            <th className={th}>售后电话</th>
            <th className={th}>资料</th>
            <th className={th}>
              <span className="sr-only">操作</span>
            </th>
          </tr>
        </thead>
        <tbody className="[&>tr:last-child>td]:border-b-0">
          {rows.map((r) => (
            <tr key={r.item_id}>
              <td className={td}>
                <div className="font-medium">{r.name}</div>
                <div className="text-xs text-ink-muted">
                  {[r.brand, r.model].filter(Boolean).join(" ") || "—"} · {categoryLabel[r.category]}
                </div>
              </td>
              <td className={td}>{r.location ?? "—"}</td>
              <td className={td}>{r.purchase_date ?? "—"}</td>
              <td className={td}>
                {r.store ?? "—"}
                {r.channel && <div className="text-xs text-ink-muted">{channelLabel[r.channel]}</div>}
              </td>
              <td className={cn(td, "text-right tabular-nums")}>{formatJPY(r.price)}</td>
              <td className={td}>
                <div className={r.warranty_end ? "" : "text-ink-muted"}>{r.warranty_end ?? "—"}</div>
                <div className="mt-1">
                  <WarrantyBadge status={r.warranty_status} daysLeft={r.days_left} />
                </div>
              </td>
              <td className={td}>
                {r.service_phone ? (
                  <a href={`tel:${r.service_phone}`} className="text-ink no-underline hover:text-accent">
                    {r.service_phone}
                  </a>
                ) : r.category === "appliance" ? (
                  <>
                    <span className="text-ink-muted">未填写 · </span>
                    <button type="button" onClick={() => onEdit(r.item_id)} className="text-sm text-accent hover:text-accent-strong">
                      补充
                    </button>
                  </>
                ) : (
                  <span className="text-ink-muted">—</span>
                )}
              </td>
              <td className={cn(td, "text-ink-muted")}>
                {r.doc_count} 份
                {r.missing_warranty_card && (
                  <div className="mt-1">
                    <Badge tone="warn">缺保修卡</Badge>
                  </div>
                )}
              </td>
              <td className={td}>
                {r.has_pending_draft ? (
                  <button
                    type="button"
                    onClick={() => onEdit(r.item_id)}
                    className="rounded-full bg-warn-soft px-2.5 py-1 text-[13px] font-medium text-warn"
                  >
                    识别待确认
                  </button>
                ) : (
                  <button
                    type="button"
                    aria-label={`编辑 ${r.name}`}
                    onClick={() => onEdit(r.item_id)}
                    className="text-sm font-medium text-accent hover:text-accent-strong"
                  >
                    编辑
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function LedgerCard({ row: r, onEdit }: { row: LedgerRow; onEdit: () => void }) {
  const sub = [r.brand, r.model ?? (r.category === "appliance" ? null : categoryLabel[r.category])]
    .filter(Boolean)
    .join(" · ");
  const meta: string[] = [];
  if (r.warranty_end) meta.push(`保修至 ${r.warranty_end}`);
  if (r.purchase_date) meta.push(`${r.purchase_date} 购于 ${r.store ?? "—"}`);
  if (r.price != null) meta.push(formatJPY(r.price));
  if (r.warranty_status === "expired" && !r.service_phone) meta.splice(1, meta.length - 1, "售后电话未填写");

  const showFooter = r.missing_warranty_card || r.service_phone || r.has_extended_warranty || r.has_pending_draft;

  return (
    <div className="rounded-[14px] border border-line bg-surface px-3.5 py-3">
      <div className="flex items-start justify-between gap-2">
        <button type="button" onClick={onEdit} aria-label={`编辑 ${r.name}`} className="min-w-0 text-left">
          <div className="text-base font-medium">{r.name}</div>
          <div className="text-xs text-ink-muted">{sub || "—"}</div>
        </button>
        <WarrantyBadge status={r.warranty_status} daysLeft={r.days_left} compact />
      </div>
      {r.warranty_status !== "unknown" && meta.length > 0 && (
        <div className="mt-2 text-[13px] text-ink-muted">{meta.join(" · ")}</div>
      )}
      {showFooter && (
        <div className="mt-2 flex items-center justify-between gap-2">
          {r.has_pending_draft ? (
            <Badge tone="warn">识别待确认</Badge>
          ) : r.missing_warranty_card ? (
            <Badge tone="warn">缺保修卡</Badge>
          ) : r.has_extended_warranty ? (
            <span className="text-xs text-ink-muted">含延长保修</span>
          ) : (
            <span />
          )}
          {r.service_phone ? (
            <a href={`tel:${r.service_phone}`} className="inline-flex min-h-11 items-center text-sm font-medium no-underline">
              拨打售后
            </a>
          ) : (
            <button type="button" onClick={onEdit} className="min-h-11 text-sm font-medium text-accent">
              补充信息
            </button>
          )}
        </div>
      )}
    </div>
  );
}
