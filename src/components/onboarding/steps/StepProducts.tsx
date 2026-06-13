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
  ExternalLink,
  FileText,
  Link2,
  Loader2,
  Plus,
  Sparkles,
  Upload,
  X,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { formatVND } from "@/lib/format";
import { SAMPLE_SUGGESTED_PRODUCTS, isProductIncomplete, type DraftProduct } from "@/data/onboarding";
import type { StepProps } from "../types";

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

// Link mẫu để bấm thử nhanh (web bán hàng, Google Sheets, Facebook Page).
const EXAMPLE_LINKS: { label: string; url: string }[] = [
  { label: "Web bán hàng", url: "https://shopee.vn/lg_official_store" },
  {
    label: "Google Sheets",
    url: "https://docs.google.com/spreadsheets/d/1n8VhPVzeL5gWEPxVRa2QvqKLuERGKt4kXrIFpOYXxuA/edit?gid=0#gid=0",
  },
  { label: "Facebook Page", url: "https://www.facebook.com/profile.php?id=61573582498740" },
];

// File mẫu cho các nguồn tải tệp (prototype tạo tại chỗ).
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
        selected ? "bg-primary/5" : "opacity-60 hover:opacity-100 hover:bg-muted/40",
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
        <span className="shrink-0 text-sm tabular-nums text-muted-foreground">
          {formatVND(product.price)}
        </span>
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

export function StepProducts({ draft, update }: StepProps) {
  const [method, setMethod] = useState<MethodKey>("docs");
  const [url, setUrl] = useState("");
  const [links, setLinks] = useState<string[]>([]);
  const [raw, setRaw] = useState("");
  const [files, setFiles] = useState<string[]>([]);
  const [scanning, setScanning] = useState(false);
  const [scanned, setScanned] = useState(draft.products.length > 0);
  const [showAll, setShowAll] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  const PREVIEW_COUNT = 3;

  const runImport = () => {
    setScanning(true);
    // Mock: agent đọc tệp/URL → gợi ý sản phẩm có cấu trúc, chọn sẵn tất cả.
    setTimeout(() => {
      update({ products: SAMPLE_SUGGESTED_PRODUCTS });
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
    // Gộp link đang gõ (nếu có) vào danh sách trước khi quét.
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
    setFiles(names);
    runImport();
  };

  const isSelected = (id: string) => draft.products.some((p) => p.id === id);
  const toggle = (product: DraftProduct) =>
    update({
      products: isSelected(product.id)
        ? draft.products.filter((p) => p.id !== product.id)
        : [...draft.products, product],
    });

  const activeMethod = METHODS.find((m) => m.key === method)!;
  const incompleteCount = SAMPLE_SUGGESTED_PRODUCTS.filter(isProductIncomplete).length;

  return (
    <div className="space-y-4">
      

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
          <label htmlFor="scan-url" className="text-sm font-medium">
            Dán link web bán hàng, Google Sheets hoặc Facebook Page
          </label>
          <div className="flex items-center gap-2">
            <Input
              id="scan-url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addLink();
                }
              }}
              placeholder="vd: shopee.vn/lg_official_store"
              disabled={scanning}
            />
            <Button variant="outline" size="lg" onClick={addLink} disabled={scanning || !url.trim()}>
              <Plus className="size-4" aria-hidden />
              Thêm link
            </Button>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs text-muted-foreground">Ví dụ:</span>
            {EXAMPLE_LINKS.map((ex) => (
              <a
                key={ex.url}
                href={ex.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
              >
                {ex.label}
                <ExternalLink className="size-3 text-muted-foreground" aria-hidden />
              </a>
            ))}
          </div>

          {links.length > 0 && (
            <ul className="space-y-1.5">
              {links.map((link) => (
                <li
                  key={link}
                  className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm"
                >
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

          <Button
            size="lg"
            onClick={runImportLinks}
            disabled={scanning || (links.length === 0 && !url.trim())}
          >
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
          <label htmlFor="paste-content" className="text-sm font-medium">
            Nội dung sản phẩm
          </label>
          <Textarea
            id="paste-content"
            value={raw}
            onChange={(e) => setRaw(e.target.value)}
            placeholder={"Tên: iPhone 17\nGiá: 17.000.000\nMô tả: 256GB, etc…"}
            rows={5}
            disabled={scanning}
          />
          <Button size="lg" onClick={runImport} disabled={scanning || !raw.trim()}>
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
              {files.length > 0 ? `Đã chọn: ${files.join(", ")}` : ""}
            </span>
            {SAMPLES[method] && (
              <button
                type="button"
                onClick={() => downloadSample(method)}
                className="flex shrink-0 items-center gap-1.5 underline-offset-2 hover:text-foreground hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
              >
                <Download className="size-3.5" aria-hidden />
                Tải tệp mẫu
              </button>
            )}
          </div>
        </div>
      )}

      {scanning && <ScanSkeleton />}

      {scanned && !scanning && (
        <>
          {/* Trạng thái đọc nguồn: tổng đã tổng hợp + số item còn thiếu thông tin. */}
          <div
            className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-xl border bg-muted/30 px-4 py-3 text-sm"
            role="status"
          >
            <span className="flex items-center gap-1.5 font-medium">
              <CheckCircle2 className="size-4 text-emerald-600" aria-hidden />
              Đã tổng hợp {SAMPLE_SUGGESTED_PRODUCTS.length} sản phẩm
            </span>
            {incompleteCount > 0 && (
              <span className="flex items-center gap-1.5 text-amber-700">
                <AlertTriangle className="size-4" aria-hidden />
                {incompleteCount} sản phẩm thiếu thông tin (giá/mô tả)
              </span>
            )}
          </div>
          <div className="divide-y overflow-hidden rounded-xl border">
            {(showAll ? SAMPLE_SUGGESTED_PRODUCTS : SAMPLE_SUGGESTED_PRODUCTS.slice(0, PREVIEW_COUNT)).map(
              (p) => (
                <ProductRow
                  key={p.id}
                  product={p}
                  selected={isSelected(p.id)}
                  onToggle={() => toggle(p)}
                />
              ),
            )}
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
          <p className="text-xs text-muted-foreground">
            Đang chọn {draft.products.length} sản phẩm
          </p>
        </>
      )}
    </div>
  );
}
