"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, PackageSearch, Pause, Play, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { formatVND } from "@/lib/format";
import { StatusChip } from "@/components/orders/bits";
import { STOCK_META, stockState, type CatalogItem } from "./meta";
import { productStats } from "./productStats";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2.5">
      <h3 className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{title}</h3>
      {children}
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

// Bản nháp sửa cục bộ — chỉ ghi về danh mục khi bấm "Cập nhật" (nút active khi có thay đổi).
type PanelDraft = { name: string; price: number; stock: number; description: string; images: string[] };
const makeDraft = (it: CatalogItem): PanelDraft => ({
  name: it.name,
  price: it.price,
  stock: it.stock,
  description: it.description,
  images: it.images ?? [],
});
const imagesEqual = (a: string[], b: string[]) => a.length === b.length && a.every((x, i) => x === b[i]);

// Panel chi tiết sản phẩm — docked phải (không overlay). 2 tab: Thông tin (sửa) ↔ Đơn hàng.
// Footer: tạm ngưng/mở bán (đổi ngay) + Cập nhật (gom thay đổi nháp). Ảnh: tải lên + hover xoá.

export function ProductDetailPanel({
  item,
  onClose,
  onChange,
}: {
  item: CatalogItem;
  onClose: () => void;
  onChange: (patch: Partial<CatalogItem>) => void;
}) {
  const router = useRouter();
  const state = stockState(item);
  const meta = STOCK_META[state];
  const { orderCount, unitsSold, revenue, relatedOrders } = productStats(item.id);

  const [draft, setDraft] = useState<PanelDraft>(() => makeDraft(item));
  // Đổi sản phẩm (hoặc sau khi commit/tạm ngưng) → nạp lại nháp theo item mới.
  useEffect(() => setDraft(makeDraft(item)), [item]);

  const dirty =
    draft.name !== item.name ||
    draft.price !== item.price ||
    draft.stock !== item.stock ||
    draft.description !== item.description ||
    !imagesEqual(draft.images, item.images ?? []);

  const removeImage = (idx: number) =>
    setDraft((d) => ({ ...d, images: d.images.filter((_, i) => i !== idx) }));

  const onUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;
    const urls = Array.from(files).map((f) => URL.createObjectURL(f));
    setDraft((d) => ({ ...d, images: [...d.images, ...urls] }));
    e.target.value = ""; // cho phép chọn lại cùng file
  };

  const handleUpdate = () =>
    onChange({
      name: draft.name,
      price: draft.price,
      stock: draft.stock,
      lowStock: draft.stock > 0 && draft.stock <= 5,
      description: draft.description,
      images: draft.images,
      imageUrl: draft.images[0] ?? null,
    });

  const togglePause = () => onChange({ paused: !item.paused });

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* Header */}
      <div className="flex items-start gap-2 border-b p-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate text-sm font-semibold leading-tight">{item.name}</p>
            <span
              className={cn(
                "inline-flex shrink-0 items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-medium",
                meta.cls,
              )}
            >
              <meta.icon className="size-2.5" aria-hidden />
              {meta.label}
            </span>
            {item.paused ? (
              <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-slate-200 px-1.5 py-0.5 text-[10px] font-medium text-slate-700">
                <Pause className="size-2.5" aria-hidden />
                Tạm ngưng bán
              </span>
            ) : null}
          </div>
          <p className="mt-0.5 font-mono text-xs text-muted-foreground">
            {item.id} · {formatVND(item.price)} · tồn {item.stock}
          </p>
        </div>
        <Button variant="ghost" size="icon-sm" className="-mr-1 -mt-1" onClick={onClose} aria-label="Đóng chi tiết sản phẩm">
          <X />
        </Button>
      </div>

      {/* 2 tab dưới header: Thông tin (sửa) ↔ Đơn hàng (số liệu + đơn liên quan) */}
      <Tabs defaultValue="info" className="flex min-h-0 flex-1 flex-col gap-0">
        <TabsList variant="line" className="h-10 shrink-0 gap-4 border-b px-4">
          <TabsTrigger value="info" className="flex-none px-0">
            Thông tin
          </TabsTrigger>
          <TabsTrigger value="orders" className="flex-none px-0">
            Đơn hàng
            {orderCount > 0 ? (
              <span className="ml-0.5 inline-flex min-w-4 items-center justify-center rounded-full bg-muted px-1 text-[10px] font-semibold tabular-nums text-muted-foreground">
                {orderCount}
              </span>
            ) : null}
          </TabsTrigger>
        </TabsList>

        {/* Tab Thông tin — ảnh (tải lên / xoá) + sửa nhanh */}
        <TabsContent value="info" className="min-h-0 flex-1 space-y-5 overflow-auto p-4">
          <Section title="Hình ảnh">
            <div className="space-y-2">
              {draft.images.length > 0 ? (
                <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
                  {draft.images.map((src, i) => (
                    <div key={`${i}-${src}`} className="group relative shrink-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={src}
                        alt={`${item.name} ${i + 1}`}
                        loading="lazy"
                        referrerPolicy="no-referrer"
                        className="h-32 w-32 rounded-lg object-cover ring-1 ring-foreground/10"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(i)}
                        aria-label={`Xoá ảnh ${i + 1}`}
                        className="absolute right-1 top-1 flex size-6 cursor-pointer items-center justify-center rounded-full bg-foreground/70 text-background opacity-0 transition-opacity duration-150 hover:bg-foreground focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 group-hover:opacity-100 motion-reduce:transition-none"
                      >
                        <X className="size-3.5" aria-hidden />
                      </button>
                    </div>
                  ))}
                </div>
              ) : null}

              {/* Tải ảnh lên — dưới list hình */}
              <label className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-foreground/20 py-3 text-sm text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground">
                <Upload className="size-4" aria-hidden />
                Tải ảnh lên
                <input type="file" accept="image/*" multiple className="sr-only" onChange={onUpload} />
              </label>
            </div>
          </Section>

          <Section title="Thông tin sản phẩm">
            <div className="space-y-2">
              <Field label="Tên sản phẩm">
                <Input value={draft.name} onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))} />
              </Field>
              <div className="grid grid-cols-2 gap-2">
                <Field label="Giá (đ)">
                  <Input
                    type="number"
                    value={draft.price}
                    onChange={(e) => setDraft((d) => ({ ...d, price: Number(e.target.value) }))}
                  />
                </Field>
                <Field label="Tồn kho">
                  <Input
                    type="number"
                    value={draft.stock}
                    onChange={(e) => setDraft((d) => ({ ...d, stock: Number(e.target.value) }))}
                  />
                </Field>
              </div>
              <Field label="Mô tả">
                <Textarea
                  rows={2}
                  value={draft.description}
                  onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
                />
              </Field>
            </div>
          </Section>
        </TabsContent>

        {/* Tab Đơn hàng — số liệu bán + đơn hàng liên quan */}
        <TabsContent value="orders" className="min-h-0 flex-1 space-y-5 overflow-auto p-4">
          <Section title="Số liệu bán">
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: "Đơn", value: `${orderCount}` },
                { label: "Đã bán", value: `${unitsSold}` },
                { label: "Doanh thu", value: formatVND(revenue) },
              ].map((s) => (
                <div key={s.label} className="rounded-lg bg-muted/50 px-3 py-2">
                  <p className="text-[11px] text-muted-foreground">{s.label}</p>
                  <p className="text-sm font-semibold tabular-nums">{s.value}</p>
                </div>
              ))}
            </div>
          </Section>

          {/* Đơn hàng liên quan → /orders?o= */}
          <Section title={`Đơn hàng liên quan${orderCount ? ` (${orderCount})` : ""}`}>
            {relatedOrders.length > 0 ? (
              <ul className="space-y-1.5">
                {relatedOrders.map((o) => (
                  <li key={o.id}>
                    <button
                      type="button"
                      onClick={() => router.push(`/orders?o=${o.id}`)}
                      className="group flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-left ring-1 ring-foreground/10 transition-colors hover:bg-muted/60"
                    >
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium group-hover:underline">{o.customerName}</span>
                        <span className="font-mono text-[11px] text-muted-foreground">
                          {o.id} · {o.qty} cái · {formatVND(o.lineTotal)}
                        </span>
                      </span>
                      <StatusChip status={o.status} />
                      <ArrowRight className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="flex flex-col items-center gap-1.5 rounded-lg border border-dashed border-foreground/15 py-6 text-center">
                <PackageSearch className="size-5 text-muted-foreground" aria-hidden />
                <p className="text-xs text-muted-foreground">Chưa có đơn nào chứa sản phẩm này.</p>
              </div>
            )}
          </Section>
        </TabsContent>
      </Tabs>

      {/* Footer — tạm ngưng/mở bán (đổi ngay) + Cập nhật (gom thay đổi nháp, active khi có sửa) */}
      <div className="flex shrink-0 items-center justify-between gap-2 border-t bg-muted/30 p-3">
        <Button
          variant="outline"
          size="sm"
          onClick={togglePause}
          className={cn(!item.paused && "text-amber-700 hover:text-amber-800")}
        >
          {item.paused ? <Play className="size-3.5" aria-hidden /> : <Pause className="size-3.5" aria-hidden />}
          {item.paused ? "Mở bán lại" : "Tạm ngưng bán"}
        </Button>
        <Button size="sm" onClick={handleUpdate} disabled={!dirty}>
          Cập nhật
        </Button>
      </div>
    </div>
  );
}
