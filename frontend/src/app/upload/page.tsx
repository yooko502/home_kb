"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type DragEvent } from "react";
import { CameraIcon, CloseIcon, FileIcon, ImageIcon, UploadIcon } from "@/components/icons";
import { Badge, Button, IconButton, fieldClass, labelClass, type Tone } from "@/components/ui";
import { confirmDraft, listDrafts, listItems, listJobs, retryJob, uploadDocument } from "@/lib/api";
import { cn } from "@/lib/cn";
import { docTypeLabel, formatFileSize, formatJPY, guessDocType } from "@/lib/format";
import type { DocType, ExtractionDraft, Job, JobStatus, LedgerRow } from "@/lib/types";
import { previewWarrantyEnd } from "@/lib/warranty";

interface PickedFile {
  key: string;
  file: File;
  docType: DocType;
}

const docTypeOptions: DocType[] = ["auto", "manual", "assembly", "invoice", "receipt", "warranty_card", "nameplate", "note", "other"];

const jobBadge: Record<JobStatus, { tone: Tone; label: string }> = {
  queued: { tone: "neutral", label: "排队中" },
  running: { tone: "warn", label: "解析中" },
  pending_review: { tone: "info", label: "待确认" },
  done: { tone: "ok", label: "已完成" },
  failed: { tone: "danger", label: "失败" },
};

export default function UploadPage() {
  const [files, setFiles] = useState<PickedFile[]>([]);
  const [items, setItems] = useState<LedgerRow[]>([]);
  const [ownerId, setOwnerId] = useState("");
  const [jobs, setJobs] = useState<Job[]>([]);
  const [drafts, setDrafts] = useState<ExtractionDraft[]>([]);
  const [dragging, setDragging] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const pickRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    listItems().then(setItems).catch(() => {});
    listJobs().then(setJobs).catch(() => {});
    listDrafts().then(setDrafts).catch(() => {});
    // TODO：接入后端后轮询 GET /api/jobs 更新进度
  }, []);

  function addFiles(list: FileList | null) {
    if (!list) return;
    const added = Array.from(list).map((file) => ({
      key: `${file.name}-${file.size}-${file.lastModified}-${Math.random()}`,
      file,
      docType: guessDocType(file.name),
    }));
    setFiles((fs) => [...fs, ...added]);
  }

  function onDrop(e: DragEvent) {
    e.preventDefault();
    setDragging(false);
    addFiles(e.dataTransfer.files);
  }

  async function startIngest() {
    if (!files.length) return;
    setSubmitting(true);
    try {
      const created: Job[] = [];
      for (const f of files) {
        const res = await uploadDocument(f.file, f.docType, { item_id: ownerId || null });
        created.push({
          id: res.job_id,
          document_id: res.document_id,
          filename: f.file.name,
          status: "queued",
          detail: "等待处理",
          progress: null,
          error: null,
        });
      }
      setJobs((js) => [...created, ...js]);
      setFiles([]);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="pb-[calc(64px+env(safe-area-inset-bottom))] md:pb-0">
      <main className="mx-auto flex max-w-[1200px] flex-wrap items-start gap-6 px-[18px] pb-12 pt-5 md:px-6 md:pt-8">
        <section className="flex min-w-0 flex-[999_1_560px] flex-col gap-5">
          <div>
            <h1 className="mb-1.5 text-[22px] font-bold md:text-[26px]">上传入库</h1>
            <p className="text-[15px] text-ink-muted">上传说明书、组装图、发票或保修卡，后台会自动解析并建立索引。</p>
          </div>

          <div className="flex flex-col gap-[22px] rounded-[14px] border border-line bg-surface p-4 md:p-6">
            {/* 1 · 选择文件 */}
            <div className="flex flex-col gap-3">
              <h2 className="text-base font-bold">1 · 选择文件</h2>
              <input ref={pickRef} type="file" multiple accept=".pdf,.jpg,.jpeg,.png,.heic,.txt,.md,image/*,application/pdf,text/plain" className="sr-only" tabIndex={-1} onChange={(e) => { addFiles(e.target.files); e.target.value = ""; }} />
              <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="sr-only" tabIndex={-1} onChange={(e) => { addFiles(e.target.files); e.target.value = ""; }} />
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragging(true);
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={onDrop}
                className={cn(
                  "flex flex-col items-center gap-2.5 rounded-xl border-2 border-dashed px-5 py-6 text-center md:py-8",
                  dragging ? "border-accent bg-accent-soft" : "border-line-strong bg-subtle",
                )}
              >
                <UploadIcon size={36} strokeWidth={1.6} className="hidden text-ink-muted md:block" />
                <div className="hidden text-base font-medium md:block">拖拽文件到这里，可一次多个</div>
                <div className="text-[13px] text-ink-muted">支持 PDF、JPG、PNG、HEIC、TXT，单个文件不超过 50 MB</div>
                <div className="mt-1.5 flex w-full flex-col-reverse flex-wrap justify-center gap-2.5 md:w-auto md:flex-row">
                  <Button variant="primary" onClick={() => pickRef.current?.click()} className="px-5">
                    选择文件
                  </Button>
                  {/* 手机上拍照按钮最显眼 */}
                  <Button onClick={() => cameraRef.current?.click()} className="max-md:h-12 max-md:border-accent max-md:text-accent-strong">
                    <CameraIcon size={18} />
                    拍照上传
                  </Button>
                </div>
              </div>

              {files.length > 0 && (
                <ul className="flex flex-col gap-2">
                  {files.map((f) => {
                    const isPdf = /pdf$/i.test(f.file.name) || f.file.type === "application/pdf";
                    const isImg = f.file.type.startsWith("image/");
                    return (
                      <li key={f.key} className="flex flex-wrap items-center gap-3 rounded-[10px] border border-line px-3.5 py-3">
                        <span
                          className={cn(
                            "inline-flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-lg",
                            isPdf ? "bg-danger-soft text-danger" : isImg ? "bg-info-soft text-info" : "bg-muted text-ink-muted",
                          )}
                        >
                          {isImg ? <ImageIcon size={18} /> : <FileIcon size={18} />}
                        </span>
                        <div className="min-w-0 flex-[1_1_200px]">
                          <div className="truncate text-[15px] font-medium">{f.file.name}</div>
                          <div className="text-[13px] text-ink-muted">
                            {formatFileSize(f.file.size)}
                            {["invoice", "receipt", "warranty_card"].includes(f.docType) && " · 入库后会自动识别购买与保修信息"}
                          </div>
                        </div>
                        <label className="flex items-center gap-2 text-[13px] text-ink-muted">
                          类型
                          <select
                            value={f.docType}
                            onChange={(e) =>
                              setFiles((fs) => fs.map((x) => (x.key === f.key ? { ...x, docType: e.target.value as DocType } : x)))
                            }
                            className="h-9 rounded-lg border border-line-strong bg-surface px-2.5 text-sm text-ink"
                          >
                            {docTypeOptions.map((t) => (
                              <option key={t} value={t}>
                                {docTypeLabel[t]}
                              </option>
                            ))}
                          </select>
                        </label>
                        <IconButton label="移除该文件" onClick={() => setFiles((fs) => fs.filter((x) => x.key !== f.key))}>
                          <CloseIcon size={16} />
                        </IconButton>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            {/* 2 · 归属物品 */}
            <div className="flex flex-col gap-2.5">
              <h2 className="text-base font-bold">2 · 归属物品</h2>
              <div className="flex flex-wrap items-center gap-2.5">
                <label className="min-w-0 flex-[1_1_320px]">
                  <span className="sr-only">选择归属物品</span>
                  <select
                    value={ownerId}
                    onChange={(e) => setOwnerId(e.target.value)}
                    className="h-11 w-full rounded-[10px] border border-line-strong bg-surface px-3.5 text-base text-ink md:text-[15px]"
                  >
                    <option value="">暂不指定（入库后再关联）</option>
                    {items.map((it) => (
                      <option key={it.item_id} value={it.item_id}>
                        {it.name}
                        {it.brand ? ` · ${it.brand}` : ""}
                        {it.model ? ` ${it.model}` : ""}
                      </option>
                    ))}
                  </select>
                </label>
                <Link
                  href="/ledger?form=new"
                  className="inline-flex h-11 items-center rounded-[10px] border border-line-strong bg-surface px-4 text-[15px] text-ink no-underline hover:bg-subtle hover:text-ink"
                >
                  ＋ 新建物品
                </Link>
              </div>
              <div className="text-[13px] text-ink-muted">
                说明书和组装图会挂到这件物品的型号上，同型号的其他物品自动共享。没有凭证？
                <Link href="/ledger?form=new" className="font-medium">
                  手动填写购买与保修信息
                </Link>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-[18px]">
              <div className="text-sm text-ink-muted">{files.length ? `共 ${files.length} 个文件` : "还没有选择文件"}</div>
              <Button variant="primary" disabled={!files.length || submitting} onClick={startIngest} className="px-7 max-md:w-full">
                {submitting ? "上传中…" : "开始入库"}
              </Button>
            </div>
          </div>

          {drafts.map((d) => (
            <DraftCard key={d.id} draft={d} onResolved={() => setDrafts((ds) => ds.filter((x) => x.id !== d.id))} />
          ))}
        </section>

        <JobQueue
          jobs={jobs}
          onRetry={(j) => {
            retryJob(j.document_id).catch(() => {});
            setJobs((js) => js.map((x) => (x.id === j.id ? { ...x, status: "queued", detail: "等待重新处理", error: null } : x)));
          }}
        />
      </main>
    </div>
  );
}

function JobQueue({ jobs, onRetry }: { jobs: Job[]; onRetry: (j: Job) => void }) {
  return (
    <aside aria-label="处理队列" className="flex min-w-0 flex-[1_1_320px] flex-col gap-1 rounded-[14px] border border-line bg-surface p-[22px]">
      <div className="mb-2 flex items-baseline justify-between">
        <h2 className="text-base font-bold">处理队列</h2>
        <span className="text-[13px] text-ink-muted">{jobs.length} 项</span>
      </div>
      {jobs.length === 0 && <p className="py-4 text-sm text-ink-muted">暂无任务</p>}
      {jobs.map((j) => (
        <div key={j.id} className="flex flex-col gap-1.5 border-b border-line-soft py-3 last:border-b-0">
          <div className="flex items-center justify-between gap-2">
            <span className="truncate text-sm font-medium">{j.filename}</span>
            <Badge tone={jobBadge[j.status].tone}>{jobBadge[j.status].label}</Badge>
          </div>
          <div className="text-xs text-ink-muted">
            {j.detail}
            {j.status === "pending_review" && (
              <>
                {" · "}
                <a href="#drafts" className="font-medium">
                  去确认
                </a>
              </>
            )}
          </div>
          {j.status === "running" && j.progress != null && (
            <div className="h-1.5 rounded-[3px] bg-muted" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(j.progress * 100)} aria-label={`${j.filename} 处理进度`}>
              <div className="h-1.5 rounded-[3px] bg-accent" style={{ width: `${Math.round(j.progress * 100)}%` }} />
            </div>
          )}
          {j.status === "failed" && (
            <div className="mt-0.5 flex gap-2">
              <Button size="sm" onClick={() => onRetry(j)}>
                重试
              </Button>
              <Button size="sm">重新上传</Button>
            </div>
          )}
        </div>
      ))}
      <div className="mt-2.5 text-xs text-ink-muted">关闭页面不影响后台处理，完成后会在这里更新。</div>
    </aside>
  );
}

/** 识别结果待确认（Phase 2：发票 / 小票 / 保修卡识别） */
function DraftCard({ draft, onResolved }: { draft: ExtractionDraft; onResolved: () => void }) {
  const [v, setV] = useState(draft.payload);
  const low = (f: string) => draft.low_confidence_fields.includes(f);
  const end = previewWarrantyEnd(v.purchase_date ?? "", v.warranty_months ?? null);

  const field = (key: "item_label" | "purchase_date" | "store" | "order_no" | "service_phone", label: string, placeholder?: string) => (
    <label className={cn(labelClass, low(key) && "text-warn")}>
      {label}
      {low(key) && " · 识别置信度低，请核对"}
      <input
        value={(v[key] as string | undefined) ?? ""}
        placeholder={placeholder}
        onChange={(e) => setV({ ...v, [key]: e.target.value })}
        className={cn(fieldClass, low(key) && "border-2 border-warn-line bg-warn-field px-[11px]")}
      />
    </label>
  );

  return (
    <div id="drafts" className="flex scroll-mt-6 flex-col gap-[18px] rounded-[14px] border border-line bg-surface p-4 md:p-6">
      <div className="flex flex-wrap items-center gap-2.5">
        <h2 className="text-lg font-bold">识别结果待确认</h2>
        <Badge tone="warn" className="px-2.5 py-[3px]">
          来自 {draft.source_filename}
        </Badge>
      </div>
      <div className="flex flex-wrap gap-5">
        <button
          type="button"
          className="flex h-56 flex-[0_0_168px] items-center justify-center rounded-[10px] border border-line bg-muted p-3 text-center text-[13px] text-ink-muted max-md:h-40 max-md:flex-[1_1_100%]"
        >
          原图预览
          <br />
          点击放大核对
        </button>
        <div className="grid min-w-0 flex-[1_1_360px] grid-cols-1 gap-x-4 gap-y-3.5 sm:grid-cols-2">
          {field("item_label", "物品")}
          {field("purchase_date", "购买日期")}
          {field("store", "店铺")}
          <label className={labelClass}>
            价格（日元）
            <input
              inputMode="numeric"
              value={v.price != null ? v.price.toLocaleString("ja-JP") : ""}
              onChange={(e) => setV({ ...v, price: Number(e.target.value.replace(/[^\d]/g, "")) || null })}
              className={fieldClass}
              aria-describedby={`${draft.id}-price`}
            />
            <span id={`${draft.id}-price`} className="sr-only">
              {formatJPY(v.price ?? null)}
            </span>
          </label>
          {field("order_no", "订单号")}
          <label className={labelClass}>
            整机保修（月）
            <input
              inputMode="numeric"
              value={v.warranty_months ?? ""}
              onChange={(e) => setV({ ...v, warranty_months: Number(e.target.value.replace(/[^\d]/g, "")) || null })}
              className={fieldClass}
            />
          </label>
          <div className={labelClass}>
            保修到期（自动计算）
            <div className="flex h-10 items-center rounded-lg bg-readonly px-3 text-sm text-ink">{end ?? "—"}</div>
          </div>
          {field("service_phone", "售后电话", "未识别到，可手动填写")}
        </div>
      </div>
      <div className="flex flex-wrap justify-end gap-2.5">
        <Button variant="danger-ghost" onClick={onResolved}>
          丢弃
        </Button>
        <Button>稍后处理</Button>
        <Button
          variant="primary"
          className="px-6"
          onClick={async () => {
            await confirmDraft(draft.id, v).catch(() => {});
            onResolved();
          }}
        >
          确认保存
        </Button>
      </div>
    </div>
  );
}
