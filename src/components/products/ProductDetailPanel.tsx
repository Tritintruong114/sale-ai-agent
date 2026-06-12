"use client";

import { useState } from "react";
import { Pause, Plus, Trash2, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { formatVND } from "@/lib/format";
import { type CatalogItem } from "./meta";

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
type PanelDraft = { name: string; price: number; description: string; images: string[] };
const makeDraft = (it: CatalogItem): PanelDraft => ({
  name: it.name,
  price: it.price,
  description: it.description,
  images: it.images ?? [],
});
const imagesEqual = (a: string[], b: string[]) => a.length === b.length && a.every((x, i) => x === b[i]);

// Panel chi tiết sản phẩm — docked phải (không overlay). Form Thông tin (sửa nhanh) + ảnh.
// Footer: Tạm ngưng/mở bán (đổi ngay) + Cập nhật (gom thay đổi nháp).
// mode="create": tái dùng đúng form Thông tin để thêm thủ công 1 sản phẩm (ẩn nút Tạm ngưng;
// footer đổi thành "Thêm vào danh mục"). onCreate trả về item hoàn chỉnh để màn nạp vào catalog.

export function ProductDetailPanel({
  item,
  mode = "edit",
  onClose,
  onChange,
  onCreate,
  onDelete,
}: {
  item: CatalogItem;
  mode?: "edit" | "create";
  onClose: () => void;
  onChange?: (patch: Partial<CatalogItem>) => void;
  onCreate?: (item: CatalogItem) => void;
  onDelete?: (id: string) => void;
}) {
  const isCreate = mode === "create";
  const [confirmDelete, setConfirmDelete] = useState(false);

  const [draft, setDraft] = useState<PanelDraft>(() => makeDraft(item));
  // Đổi sản phẩm (hoặc sau khi commit/Tạm ngưng → item là object mới) → nạp lại nháp theo item mới.
  // Chỉnh state lúc render khi đầu vào đổi (pattern của dự án), không dùng effect.
  const [draftFor, setDraftFor] = useState(item);
  if (draftFor !== item) {
    setDraftFor(item);
    setDraft(makeDraft(item));
  }

  const dirty =
    draft.name !== item.name ||
    draft.price !== item.price ||
    draft.description !== item.description ||
    !imagesEqual(draft.images, item.images ?? []);

  // Tạo mới: cần tối thiểu tên + giá hợp lệ trước khi thêm vào danh mục.
  const createValid = draft.name.trim().length > 0 && draft.price > 0;

  const removeImage = (idx: number) =>
    setDraft((d) => ({ ...d, images: d.images.filter((_, i) => i !== idx) }));

  const onUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;
    const urls = Array.from(files).map((f) => URL.createObjectURL(f));
    setDraft((d) => ({ ...d, images: [...d.images, ...urls] }));
    e.target.value = ""; // cho phép chọn lại cùng file
  };

  // Gom nháp thành item hoàn chỉnh — dùng chung cho cả cập nhật (patch) lẫn tạo mới.
  const buildItem = (): CatalogItem => ({
    ...item,
    name: draft.name.trim(),
    price: draft.price,
    description: draft.description,
    images: draft.images,
    imageUrl: draft.images[0] ?? null,
  });

  const handleUpdate = () => onChange?.(buildItem());
  const handleCreate = () => onCreate?.(buildItem());

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* Header */}
      <div className="flex items-start gap-2 border-b p-4">
        <div className="min-w-0 flex-1">
          {isCreate ? (
            <>
              <p className="text-sm font-semibold leading-tight">Sản phẩm mới</p>
              <p className="mt-0.5 text-xs text-muted-foreground">Điền thông tin rồi thêm vào danh mục.</p>
            </>
          ) : (
            <>
              <div className="flex flex-wrap items-center gap-2">
                <p className="truncate text-sm font-semibold leading-tight">{item.name}</p>
                {item.paused ? (
                  <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-slate-200 px-1.5 py-0.5 text-[10px] font-medium text-slate-700">
                    <Pause className="size-2.5" aria-hidden />
                    Tạm ngưng
                  </span>
                ) : null}
              </div>
              <p className="mt-0.5 font-mono text-xs text-muted-foreground">
                {item.id} · {formatVND(item.price)}
              </p>
            </>
          )}
        </div>
        <Button variant="ghost" size="icon-sm" className="-mr-1 -mt-1" onClick={onClose} aria-label={isCreate ? "Đóng" : "Đóng chi tiết sản phẩm"}>
          <X />
        </Button>
      </div>

      {/* Thông tin — ảnh (tải lên / xoá) + sửa nhanh */}
      <div className="min-h-0 flex-1 space-y-5 overflow-auto p-4">
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
            <Field label="Giá (đ)">
              <Input
                type="number"
                value={draft.price}
                onChange={(e) => setDraft((d) => ({ ...d, price: Number(e.target.value) }))}
              />
            </Field>
            <Field label="Mô tả">
              <Textarea
                rows={2}
                value={draft.description}
                onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
              />
            </Field>
          </div>
        </Section>
      </div>

      {/* Footer — tạo mới: Huỷ + Thêm vào danh mục. Sửa: Tạm ngưng/mở bán + Cập nhật (active khi có sửa). */}
      {isCreate ? (
      <div className="flex shrink-0 items-center justify-end gap-2 border-t bg-muted/30 p-3">
        <Button variant="outline" size="sm" onClick={onClose}>
          Huỷ
        </Button>
        <Button size="sm" onClick={handleCreate} disabled={!createValid}>
          <Plus className="size-3.5" aria-hidden />
          Thêm vào danh mục
        </Button>
      </div>
      ) : (
      <div className="flex shrink-0 items-center justify-between gap-2 border-t bg-muted/30 p-3">
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => setConfirmDelete(true)}
          aria-label="Xoá sản phẩm"
          title="Xoá sản phẩm"
          className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
        >
          <Trash2 className="size-4" aria-hidden />
        </Button>
        <Button size="sm" onClick={handleUpdate} disabled={!dirty}>
          Cập nhật
        </Button>
      </div>
      )}

      {/* Xác nhận xoá — hành động phá huỷ, không hoàn tác (đồng bộ dialog xoá ở Cấu hình Agent). */}
      <Dialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Xoá sản phẩm?</DialogTitle>
            <DialogDescription>
              Xoá <span className="font-medium text-foreground">{item.name}</span> khỏi danh mục — agent sẽ không còn tư vấn hay báo giá sản phẩm này. Không hoàn tác được.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>Huỷ</DialogClose>
            <Button
              variant="destructive"
              onClick={() => {
                setConfirmDelete(false);
                onDelete?.(item.id);
              }}
            >
              <Trash2 className="size-4" aria-hidden />
              Xoá sản phẩm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
