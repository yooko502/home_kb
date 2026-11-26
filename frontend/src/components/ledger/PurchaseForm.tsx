"use client";

import { useEffect, useId, useState, type FormEvent } from "react";
import { CloseIcon, ImageIcon } from "@/components/icons";
import { Button, IconButton, fieldClass, labelClass } from "@/components/ui";
import { getItemForm, saveItem } from "@/lib/api";
import { cn } from "@/lib/cn";
import type { Category, ItemFormInput } from "@/lib/types";
import { previewWarrantyEnd } from "@/lib/warranty";

const empty: ItemFormInput = {
  name: "",
  category: "appliance",
  brand: "",
  model: "",
  location: "",
  serial_number: "",
  purchase_date: "",
  channel: "offline",
  store: "",
  price: null,
  order_no: "",
  warranty_months: null,
  service_phone: "",
  part_warranties: [],
  proof_document_id: null,
};

/**
 * 购买与保修表单（计划书 6.2）：手动录入、编辑、识别确认共用。
 * 电脑上是弹窗（两列），手机上是全屏页面（一列）。
 */
export function PurchaseForm({
  itemId,
  onClose,
  onSaved,
}: {
  itemId: string | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const titleId = useId();
  const [form, setForm] = useState<ItemFormInput>(empty);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (itemId) getItemForm(itemId).then(setForm).catch(() => setError("读取物品信息失败"));
    else setForm(empty);
  }, [itemId]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  const set = <K extends keyof ItemFormInput>(k: K, v: ItemFormInput[K]) => setForm((f) => ({ ...f, [k]: v }));
  const num = (s: string) => {
    const n = Number(s.replace(/[^\d]/g, ""));
    return s.trim() === "" || Number.isNaN(n) ? null : n;
  };

  const warrantyEnd = previewWarrantyEnd(form.purchase_date, form.warranty_months);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) {
      setError("请填写物品名称");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await saveItem(itemId, form);
      onSaved();
    } catch {
      setError("保存失败，请稍后再试");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-stretch justify-center md:items-center md:p-6">
      <button type="button" aria-label="关闭" tabIndex={-1} onClick={onClose} className="absolute inset-0 hidden bg-black/35 md:block" />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative flex w-full flex-col bg-surface md:max-h-[calc(100dvh-48px)] md:max-w-[640px] md:rounded-2xl md:shadow-2xl"
      >
        <div className="flex items-start justify-between gap-3 border-b border-line px-5 pb-[18px] pt-5 md:px-7 md:pt-6">
          <div>
            <h1 id={titleId} className="mb-1 text-xl font-bold">
              {itemId ? "编辑购买与保修信息" : "添加物品"}
            </h1>
            <p className="text-sm text-ink-muted">手动录入和发票识别共用这张表单，保存后写入物品台账</p>
          </div>
          <IconButton label="关闭" onClick={onClose}>
            <CloseIcon size={16} />
          </IconButton>
        </div>

        <form id="purchase-form" onSubmit={submit} className="flex flex-1 flex-col gap-[22px] overflow-y-auto px-5 py-[22px] md:px-7">
          <Section legend="物品">
            <label className={labelClass}>
              名称
              <input className={fieldClass} value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="家里的叫法，如：主卧空调" required />
            </label>
            <label className={labelClass}>
              类别
              <select className={fieldClass} value={form.category} onChange={(e) => set("category", e.target.value as Category)}>
                <option value="appliance">电器</option>
                <option value="furniture">家具</option>
                <option value="other">其他</option>
              </select>
            </label>
            <label className={labelClass}>
              品牌
              <input className={fieldClass} value={form.brand} onChange={(e) => set("brand", e.target.value)} />
            </label>
            <label className={labelClass}>
              {/* TODO：调用 GET /api/products?brand_id=&model= 判断是否已有同型号说明书 */}
              型号（同型号说明书自动共享）
              <input className={fieldClass} value={form.model} onChange={(e) => set("model", e.target.value)} />
            </label>
            <label className={labelClass}>
              摆放位置
              <input className={fieldClass} value={form.location} onChange={(e) => set("location", e.target.value)} placeholder="客厅、主卧…" />
            </label>
            <label className={labelClass}>
              序列号（可选）
              <input className={fieldClass} value={form.serial_number} onChange={(e) => set("serial_number", e.target.value)} placeholder="铭牌上的 S/N" />
            </label>
          </Section>

          <Section legend="购买信息">
            <label className={labelClass}>
              购买日期
              <input type="date" className={fieldClass} value={form.purchase_date} onChange={(e) => set("purchase_date", e.target.value)} />
            </label>
            <div className={labelClass}>
              <span id={`${titleId}-ch`}>渠道</span>
              <div role="radiogroup" aria-labelledby={`${titleId}-ch`} className="flex h-10 gap-1 rounded-lg bg-muted p-[3px]">
                {(["online", "offline"] as const).map((c) => (
                  <button
                    key={c}
                    type="button"
                    role="radio"
                    aria-checked={form.channel === c}
                    onClick={() => set("channel", c)}
                    className={cn(
                      "flex-1 rounded-md text-sm",
                      form.channel === c ? "bg-surface font-medium text-ink" : "text-ink-muted",
                    )}
                  >
                    {c === "online" ? "线上" : "线下"}
                  </button>
                ))}
              </div>
            </div>
            <label className={labelClass}>
              店铺 / 平台
              <input className={fieldClass} value={form.store} onChange={(e) => set("store", e.target.value)} />
            </label>
            <label className={labelClass}>
              价格（日元）
              <input
                inputMode="numeric"
                className={fieldClass}
                value={form.price == null ? "" : form.price.toLocaleString("ja-JP")}
                onChange={(e) => set("price", num(e.target.value))}
              />
            </label>
            <label className={cn(labelClass, "md:col-span-2")}>
              订单号（可选）
              <input className={fieldClass} value={form.order_no} onChange={(e) => set("order_no", e.target.value)} placeholder="订单号或小票号" />
            </label>
          </Section>

          <Section legend="保修与售后">
            <label className={labelClass}>
              整机保修（月）
              <input
                inputMode="numeric"
                className={fieldClass}
                value={form.warranty_months ?? ""}
                onChange={(e) => set("warranty_months", num(e.target.value))}
              />
            </label>
            <div className={labelClass}>
              保修到期（自动计算）
              <div className="flex h-10 items-center rounded-lg bg-readonly px-3 text-sm text-ink" aria-live="polite">
                {warrantyEnd ?? "—"}
              </div>
            </div>
            <label className={cn(labelClass, "md:col-span-2")}>
              售后电话
              <input
                type="tel"
                className={fieldClass}
                value={form.service_phone}
                onChange={(e) => set("service_phone", e.target.value)}
                placeholder="留空则使用该品牌登记的服务热线"
              />
            </label>
            <div className="flex flex-col gap-2 md:col-span-2">
              <div className="text-[13px] text-ink-muted">部件保修 / 延保（可选）</div>
              {form.part_warranties.map((pw, i) => (
                <div key={i} className="flex items-center gap-2.5">
                  <input
                    aria-label="部件名称"
                    className={cn(fieldClass, "min-w-0 flex-1")}
                    value={pw.part_name}
                    placeholder="如：压缩机"
                    onChange={(e) =>
                      set(
                        "part_warranties",
                        form.part_warranties.map((x, j) => (j === i ? { ...x, part_name: e.target.value } : x)),
                      )
                    }
                  />
                  <input
                    aria-label="部件保修月数"
                    inputMode="numeric"
                    className={cn(fieldClass, "w-24")}
                    value={pw.months ?? ""}
                    onChange={(e) =>
                      set(
                        "part_warranties",
                        form.part_warranties.map((x, j) => (j === i ? { ...x, months: num(e.target.value) } : x)),
                      )
                    }
                  />
                  <span className="text-sm text-ink-muted">个月</span>
                  <IconButton
                    label="删除这条部件保修"
                    onClick={() => set("part_warranties", form.part_warranties.filter((_, j) => j !== i))}
                  >
                    <CloseIcon size={16} />
                  </IconButton>
                </div>
              ))}
              <button
                type="button"
                onClick={() => set("part_warranties", [...form.part_warranties, { part_name: "", months: null }])}
                className="h-9 self-start rounded-lg border border-dashed border-line-strong bg-surface px-3 text-[13px] text-ink hover:bg-subtle"
              >
                ＋ 添加部件保修
              </button>
            </div>
          </Section>

          <fieldset className="flex flex-col gap-2.5">
            <legend className="mb-2.5 text-[15px] font-bold">凭证（可选）</legend>
            <div className="flex items-center gap-3 rounded-[10px] border border-line px-3 py-2.5">
              <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent-soft text-accent-strong">
                <ImageIcon size={18} />
              </span>
              <div className="min-w-0 flex-1 text-sm">
                {form.proof_document_id ? "已关联凭证" : "未关联凭证"}
                <div className="text-xs text-ink-muted">发票、小票或保修卡（保証書）；没有凭证也可以直接保存</div>
              </div>
              {/* TODO：选择文件后调用 POST /api/documents 上传并关联到订单 */}
              <Button size="sm">{form.proof_document_id ? "更换" : "上传"}</Button>
            </div>
          </fieldset>

          {error && (
            <p role="alert" className="text-sm text-danger">
              {error}
            </p>
          )}
        </form>

        <div className="flex justify-end gap-2.5 border-t border-line px-5 pb-[calc(16px+env(safe-area-inset-bottom))] pt-4 md:px-7 md:pb-4">
          <Button onClick={onClose}>取消</Button>
          <Button type="submit" form="purchase-form" variant="primary" disabled={saving} className="px-6">
            {saving ? "保存中…" : "保存"}
          </Button>
        </div>
      </div>
    </div>
  );
}

function Section({ legend, children }: { legend: string; children: React.ReactNode }) {
  return (
    <fieldset className="flex flex-col gap-3">
      <legend className="mb-3 text-[15px] font-bold">{legend}</legend>
      <div className="grid grid-cols-1 gap-x-4 gap-y-3.5 md:grid-cols-2">{children}</div>
    </fieldset>
  );
}
