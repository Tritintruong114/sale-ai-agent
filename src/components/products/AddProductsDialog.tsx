"use client";

import { useRef, useState } from "react";
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ClipboardPaste,
  Download,
  FileText,
  Link2,
  Loader2,
  PackagePlus,
  Plus,
  Sparkles,
  Upload,
  X,
  type LucideIcon,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { formatVND } from "@/lib/format";
import { SAMPLE_SUGGESTED_PRODUCTS, isProductIncomplete, type DraftProduct } from "@/data/onboarding";
import { type CatalogItem } from "./meta";

// Thêm sản phẩm — tái dùng luồng nạp 3 nguồn của onboarding (StepProducts) trong Dialog: chọn nguồn →
// agent quét (mock) → duyệt danh sách gợi ý (tick chọn) → thêm vào danh mục. Khác onboarding ở chỗ
// đích đến là catalog (CatalogItem) thay vì draft wizard; nên giữ state cục bộ, không đụng store onboarding.

type MethodKey = "docs" | "url" | "paste";

const METHODS: { key: MethodKey; label: string; icon: LucideIcon; accept?: string; formats?: string }[] = [
  {
    key: "docs",
    label: "Tài liệu",
    icon: FileText,
    accept: ".pdf,.doc,.docx,.txt,.xlsx,.xls,.csv",
    formats: "PDF, Word (.doc, .docx), Excel (.xls, .xlsx), CSV, TXT",
  },
  { key: "url", label: "Link", icon: Link2 },
  { key: "paste", label: "Dán nội dung", icon: ClipboardPaste },
];

const SAMPLES: Partial<Record<MethodKey, { filename: string; mime: string; content: string }>> = {
  docs: {
    filename: "san-pham-mau.csv",
    mime: "text/csv;charset=utf-8",
    content:
      "Tên,Giá,Mô tả\n" +
      "Sầu riêng Musanking,120000,Cơm vàng dẻo béo hạt lép hàng mới về\n" +
      "Giỏ Tinh Khôi,550000,Giỏ quà trái cây tông trắng xanh tặng thăm hỏi\n",
  },
};

function downloadSample(method: MethodKey) {
  const s = SAMPLES[method];
  if (!s) return;
  const url = URL.createObjectURL(new Blob([s.content], { type: s.mime }));
  const a = document.createElement("a");
  a.href = url;
  a.download = s.filename;
  a.click();
  URL.revokeObjectURL(url);
}

// Draft → mục danh mục: mặc định tồn 20, chưa cảnh báo (mirror AgentCreateDialog). id gắn timestamp tránh trùng.
function toCatalogItem(p: DraftProduct, seq: number): CatalogItem {
  return {
    id: `cat-${p.id}-${Date.now()}-${seq}`,
    name: p.name,
    price: p.price,
    description: p.description,
    imageHint: p.imageHint,
    stock: 20,
    lowStock: false,
  };
}

function ProductRow({
  product,
  selected,
  onToggle,
}: {
  product: DraftProduct;
  selected: boolean;
  onToggle: () => void;
}) {
  const incomplete = isProductIncomplete(product);
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={selected}
      aria-label={`${product.name} — ${incomplete ? "thiếu thông tin" : formatVND(product.price)}`}
      className={cn(
        "flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors",
        "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset focus-visible:outline-none",
        selected ? "bg-primary/5" : "opacity-60 hover:bg-muted/40 hover:opacity-100",
      )}
    >
      <span
        className={cn(
          "flex size-4 shrink-0 items-center justify-center rounded border transition-colors",
          selected ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground/40",
        )}
      >
        {selected && <Check className="size-3" aria-hidden />}
      </span>
      <span className="min-w-0 flex-1 truncate text-sm font-medium">{product.name}</span>
      {incomplete ? (
        <span className="flex shrink-0 items-center gap-1 text-xs font-medium text-amber-700">
          <AlertTriangle className="size-3.5" aria-hidden />
          Thiếu thông tin
        </span>
      ) : (
        <span className="shrink-0 text-sm tabular-nums text-muted-foreground">{formatVND(product.price)}</span>
      )}
    </button>
  );
}

function ScanSkeleton() {
  return (
    <div className="space-y-2" aria-busy="true" aria-label="Đang xử lý nguồn">
      <p className="flex items-center gap-2 text-sm font-medium">
        <Loader2 className="size-4 motion-safe:animate-spin" aria-hidden />
        Agent đang đọc nguồn để tìm sản phẩm…
      </p>
      {[0, 1, 2].map((i) => (
        <div key={i} className="flex items-center gap-3 rounded-xl border p-3">
          <span className="size-5 rounded-md bg-muted motion-safe:animate-pulse" />
          <div className="flex-1 space-y-1.5">
            <span className="block h-3 w-2/5 rounded bg-muted motion-safe:animate-pulse" />
            <span className="block h-2.5 w-3/5 rounded bg-muted motion-safe:animate-pulse" />
          </div>
          <span className="h-3 w-16 rounded bg-muted motion-safe:animate-pulse" />
        </div>
      ))}
    </div>
  );
}

const PREVIEW_COUNT = 3;

export function AddProductsDialog({
  open,
  onOpenChange,
  onAdd,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (items: CatalogItem[]) => void;
}) {
  const [method, setMethod] = useState<MethodKey>("docs");
  const [url, setUrl] = useState("");
  const [links, setLinks] = useState<string[]>([]);
  const [raw, setRaw] = useState("");
  const [files, setFiles] = useState<string[]>([]);
  const [scanning, setScanning] = useState(false);
  const [scanned, setScanned] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const fileInput = useRef<HTMLInputElement>(null);

  const reset = () => {
    setMethod("docs");
    setUrl("");
    setLinks([]);
    setRaw("");
    setFiles([]);
    setScanning(false);
    setScanned(false);
    setShowAll(false);
    setSelectedIds(new Set());
  };

  const handleOpenChange = (next: boolean) => {
    if (!next) reset();
    onOpenChange(next);
  };

  const runImport = () => {
    setScanning(true);
    // Mock: agent đọc tệp/URL → gợi ý sản phẩm có cấu trúc, chọn sẵn tất cả.
    window.setTimeout(() => {
      setSelectedIds(new Set(SAMPLE_SUGGESTED_PRODUCTS.map((p) => p.id)));
      setScanning(false);
      setScanned(true);
    }, 1200);
  };

  const addLink = () => {
    const v = url.trim();
    if (!v || links.includes(v)) return;
    setLinks([...links, v]);
    setUrl("");
  };

  const runImportLinks = () => {
    const v = url.trim();
    if (v && !links.includes(v)) {
      setLinks([...links, v]);
      setUrl("");
    }
    runImport();
  };

  const onPickFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const names = Array.from(e.target.files ?? []).map((f) => f.name);
    if (names.length === 0) return;
    // Gộp thêm vào danh sách (dedup theo tên), cho chọn nhiều lần trước khi quét — không tự quét ngay.
    setFiles((prev) => [...prev, ...names.filter((n) => !prev.includes(n))]);
    e.target.value = ""; // reset để chọn lại cùng tệp vẫn kích hoạt onChange
  };

  const toggle = (id: string) =>
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const confirm = () => {
    const picked = SAMPLE_SUGGESTED_PRODUCTS.filter((p) => selectedIds.has(p.id));
    if (picked.length === 0) return;
    onAdd(picked.map(toCatalogItem));
    handleOpenChange(false);
  };

  const activeMethod = METHODS.find((m) => m.key === method)!;
  const incompleteCount = SAMPLE_SUGGESTED_PRODUCTS.filter(isProductIncomplete).length;
  const selectedCount = selectedIds.size;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PackagePlus className="size-4 text-muted-foreground" aria-hidden />
            Thêm sản phẩm
          </DialogTitle>
          <DialogDescription>Chọn một nguồn — agent tự đọc và gom thành sản phẩm để bạn duyệt.</DialogDescription>
        </DialogHeader>

        {/* Body cuộn nội bộ khi nội dung dài (danh sách gợi ý) */}
        <div className="-mx-1 max-h-[58vh] space-y-4 overflow-y-auto px-1">
          {/* Chọn nguồn nạp */}
          <div className="flex flex-wrap gap-2">
            {METHODS.map((m) => {
              const Icon = m.icon;
              const active = m.key === method;
              return (
                <button
                  key={m.key}
                  type="button"
                  onClick={() => setMethod(m.key)}
                  aria-pressed={active}
                  className={cn(
                    "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs transition-colors",
                    "focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                    active ? "border-primary bg-primary text-primary-foreground" : "hover:bg-muted",
                  )}
                >
                  <Icon className="size-3.5" aria-hidden />
                  {m.label}
                </button>
              );
            })}
          </div>

          {/* Vùng nhập theo nguồn */}
          {method === "url" ? (
            <div className="space-y-2">
              <label htmlFor="add-scan-url" className="text-sm font-medium">
                Link trang / bài đăng / album
              </label>
              <div className="flex items-center gap-2">
                <Input
                  id="add-scan-url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addLink();
                    }
                  }}
                  placeholder="vd: facebook.com/trang-cua-ban hoặc link Google Sheets"
                  disabled={scanning}
                  aria-describedby="add-scan-url-hint"
                />
                <Button variant="outline" onClick={addLink} disabled={scanning || !url.trim()}>
                  <Plus className="size-4" aria-hidden />
                  Thêm link
                </Button>
              </div>
              <p id="add-scan-url-hint" className="text-xs text-muted-foreground">
                Thêm nhiều link — trang, bài đăng, web bán hàng, Google Sheets…
              </p>

              {links.length > 0 && (
                <ul className="space-y-1.5">
                  {links.map((link) => (
                    <li key={link} className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm">
                      <Link2 className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
                      <span className="min-w-0 flex-1 truncate">{link}</span>
                      <button
                        type="button"
                        onClick={() => setLinks(links.filter((l) => l !== link))}
                        disabled={scanning}
                        aria-label={`Xoá link ${link}`}
                        className="shrink-0 rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                      >
                        <X className="size-3.5" aria-hidden />
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              <Button onClick={runImportLinks} disabled={scanning || (links.length === 0 && !url.trim())}>
                {scanning ? (
                  <Loader2 className="size-4 motion-safe:animate-spin" aria-hidden />
                ) : (
                  <Sparkles className="size-4" aria-hidden />
                )}
                Lấy sản phẩm{links.length > 0 ? ` từ ${links.length} link` : ""}
              </Button>
            </div>
          ) : method === "paste" ? (
            <div className="space-y-2">
              <label htmlFor="add-paste-content" className="text-sm font-medium">
                Nội dung sản phẩm
              </label>
              <Textarea
                id="add-paste-content"
                value={raw}
                onChange={(e) => setRaw(e.target.value)}
                placeholder={"Tên: iPhone 17\nGiá: 17.000.000\nMô tả: 256GB, etc…"}
                rows={5}
                disabled={scanning}
              />
              <Button onClick={runImport} disabled={scanning || !raw.trim()}>
                {scanning ? (
                  <Loader2 className="size-4 motion-safe:animate-spin" aria-hidden />
                ) : (
                  <Sparkles className="size-4" aria-hidden />
                )}
                Lấy sản phẩm
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              <input
                ref={fileInput}
                type="file"
                multiple
                accept={activeMethod.accept}
                className="hidden"
                onChange={onPickFiles}
              />
              <button
                type="button"
                onClick={() => fileInput.current?.click()}
                disabled={scanning}
                className={cn(
                  "flex w-full flex-col items-center gap-2 rounded-xl border border-dashed py-8 text-center transition-colors",
                  "focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none hover:bg-muted/50",
                )}
              >
                <Upload className="size-6 text-muted-foreground" aria-hidden />
                <span className="text-sm font-medium">Kéo thả hoặc bấm để chọn tài liệu</span>
                <span className="text-xs text-muted-foreground">{activeMethod.formats}</span>
              </button>

              <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
                <span className="min-w-0 truncate">
                  {files.length > 0 ? `Đã chọn ${files.length} tệp` : "Có thể chọn nhiều tệp"}
                </span>
                {SAMPLES[method] && (
                  <button
                    type="button"
                    onClick={() => downloadSample(method)}
                    className="flex shrink-0 items-center gap-1.5 underline-offset-2 hover:text-foreground hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                  >
                    <Download className="size-3.5" aria-hidden />
                    Tải file mẫu
                  </button>
                )}
              </div>

              {/* Danh sách tệp đã chọn — xoá được từng tệp (mirror danh sách Link) */}
              {files.length > 0 && (
                <ul className="space-y-1.5">
                  {files.map((name) => (
                    <li key={name} className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm">
                      <FileText className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
                      <span className="min-w-0 flex-1 truncate">{name}</span>
                      <button
                        type="button"
                        onClick={() => setFiles(files.filter((f) => f !== name))}
                        disabled={scanning}
                        aria-label={`Xoá tệp ${name}`}
                        className="shrink-0 rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                      >
                        <X className="size-3.5" aria-hidden />
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              <Button onClick={runImport} disabled={scanning || files.length === 0}>
                {scanning ? (
                  <Loader2 className="size-4 motion-safe:animate-spin" aria-hidden />
                ) : (
                  <Sparkles className="size-4" aria-hidden />
                )}
                Lấy sản phẩm{files.length > 0 ? ` từ ${files.length} tệp` : ""}
              </Button>
            </div>
          )}

          {scanning && <ScanSkeleton />}

          {scanned && !scanning && (
            <>
              {/* Trạng thái map nguồn: tổng đã map + số item còn thiếu thông tin. */}
              <div
                className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-xl border bg-muted/30 px-4 py-3 text-sm"
                role="status"
              >
                <span className="flex items-center gap-1.5 font-medium">
                  <CheckCircle2 className="size-4 text-emerald-600" aria-hidden />
                  Đã map {SAMPLE_SUGGESTED_PRODUCTS.length} sản phẩm
                </span>
                {incompleteCount > 0 && (
                  <span className="flex items-center gap-1.5 text-amber-700">
                    <AlertTriangle className="size-4" aria-hidden />
                    {incompleteCount} sản phẩm thiếu thông tin (giá/mô tả)
                  </span>
                )}
              </div>
              <div className="divide-y overflow-hidden rounded-xl border">
                {(showAll ? SAMPLE_SUGGESTED_PRODUCTS : SAMPLE_SUGGESTED_PRODUCTS.slice(0, PREVIEW_COUNT)).map((p) => (
                  <ProductRow key={p.id} product={p} selected={selectedIds.has(p.id)} onToggle={() => toggle(p.id)} />
                ))}
                {SAMPLE_SUGGESTED_PRODUCTS.length > PREVIEW_COUNT && (
                  <button
                    type="button"
                    onClick={() => setShowAll((s) => !s)}
                    className="flex w-full items-center justify-center gap-1 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted/40 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset focus-visible:outline-none"
                  >
                    {showAll ? (
                      <>
                        <ChevronUp className="size-3.5" aria-hidden />
                        Thu gọn
                      </>
                    ) : (
                      <>
                        <ChevronDown className="size-3.5" aria-hidden />
                        Xem thêm {SAMPLE_SUGGESTED_PRODUCTS.length - PREVIEW_COUNT} sản phẩm
                      </>
                    )}
                  </button>
                )}
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Huỷ
          </Button>
          <Button onClick={confirm} disabled={selectedCount === 0}>
            <Plus className="size-4" aria-hidden />
            Thêm {selectedCount > 0 ? `${selectedCount} ` : ""}sản phẩm
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
