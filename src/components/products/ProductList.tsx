import { ArrowDown, ArrowUp, ChevronRight, ChevronsUpDown, ImageIcon, PackageSearch, Pause, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatVND } from "@/lib/format";
import { type CatalogItem } from "./meta";

// Chế độ Danh sách — data table quét nhanh nhiều sản phẩm (mirror OrderList): ảnh thumbnail + tên,
// giá canh phải tabular. Bấm hàng → mở panel chi tiết. Header cột sắp xếp được (aria-sort); sort do
// cha quản (controlled) để sắp toàn bộ tập rồi mới render — đồng bộ với sort Select trên toolbar.

export type ProductSortKey = "newest" | "name" | "price";
export type ProductSortDir = "asc" | "desc";

// Hướng mặc định khi mới bấm sang cột: chữ tăng dần (A→Z), giá giảm dần (cao trước).
export const PRODUCT_SORT_DEFAULT_DIR: Record<ProductSortKey, ProductSortDir> = {
  newest: "desc",
  name: "asc",
  price: "desc",
};

export function sortProducts(items: CatalogItem[], key: ProductSortKey, dir: ProductSortDir): CatalogItem[] {
  if (key === "newest") return items; // giữ thứ tự danh mục (item mới prepend lên đầu)
  const sign = dir === "asc" ? 1 : -1;
  return [...items].sort((a, b) => {
    switch (key) {
      case "name":
        return sign * a.name.localeCompare(b.name, "vi");
      default:
        return sign * (a.price - b.price); // price
    }
  });
}

const COLUMNS: { key: ProductSortKey; label: string; align: "left" | "right"; className?: string }[] = [
  { key: "name", label: "Sản phẩm", align: "left" },
  { key: "price", label: "Giá", align: "right" },
];

export function ProductList({
  items,
  selectedId,
  onOpen,
  onTogglePause,
  sortKey,
  sortDir,
  onSort,
}: {
  items: CatalogItem[];
  selectedId: string | null;
  onOpen: (id: string) => void;
  onTogglePause: (id: string) => void;
  sortKey: ProductSortKey;
  sortDir: ProductSortDir;
  onSort: (key: ProductSortKey) => void;
}) {
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center gap-1.5 rounded-xl border border-dashed py-12 text-center">
        <PackageSearch className="size-6 text-muted-foreground" aria-hidden />
        <p className="text-sm text-muted-foreground">Không có sản phẩm nào khớp bộ lọc</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg ring-1 ring-foreground/10">
      <table className="w-full min-w-[40rem] border-collapse text-left">
        <caption className="sr-only">
          Danh sách sản phẩm — bấm tiêu đề cột để sắp xếp, bấm một hàng để xem chi tiết.
        </caption>
        <thead>
          <tr className="border-b bg-muted/40 [&_th]:h-9 [&_th]:px-3 [&_th]:align-middle">
            {/* Cột ảnh — thumbnail, không tiêu đề */}
            <th scope="col" className="w-12">
              <span className="sr-only">Ảnh</span>
            </th>
            {COLUMNS.map((col) => {
              const active = sortKey === col.key;
              const SortIcon = !active ? ChevronsUpDown : sortDir === "asc" ? ArrowUp : ArrowDown;
              return (
                <th
                  key={col.key}
                  scope="col"
                  aria-sort={active ? (sortDir === "asc" ? "ascending" : "descending") : "none"}
                  className={col.className}
                >
                  <button
                    type="button"
                    onClick={() => onSort(col.key)}
                    className={cn(
                      "group inline-flex w-full items-center gap-1 rounded-md text-[11px] font-semibold uppercase tracking-wide transition-colors cursor-pointer outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50",
                      col.align === "right" && "justify-end",
                      active ? "text-foreground" : "text-muted-foreground",
                    )}
                    title={`Sắp xếp theo ${col.label.toLowerCase()}`}
                  >
                    {col.label}
                    <SortIcon
                      className={cn(
                        "size-3 shrink-0 transition-opacity",
                        active ? "opacity-100" : "opacity-0 group-hover:opacity-50",
                      )}
                      aria-hidden
                    />
                  </button>
                </th>
              );
            })}
            <th scope="col" className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Trạng thái
            </th>
            <th scope="col" className="w-px">
              <span className="sr-only">Tạm ngưng / mở bán</span>
            </th>
            <th scope="col" className="w-9">
              <span className="sr-only">Mở chi tiết</span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {items.map((p) => {
            const selected = p.id === selectedId;
            return (
              <tr
                key={p.id}
                onClick={() => onOpen(p.id)}
                onKeyDown={(e) => {
                  if (e.target !== e.currentTarget) return; // bỏ qua khi thao tác trên nút bên trong hàng
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onOpen(p.id);
                  }
                }}
                tabIndex={0}
                aria-selected={selected}
                aria-label={`${p.name}, ${formatVND(p.price)}`}
                className={cn(
                  "cursor-pointer outline-none transition-colors [&>td]:px-3 [&>td]:py-2.5 [&>td]:align-middle",
                  "focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring/50",
                  selected ? "bg-primary/5" : "hover:bg-muted/50",
                )}
              >
                {/* Ảnh + dải nhấn hàng đang chọn */}
                <td className={cn("border-l-2", selected ? "border-primary" : "border-transparent")}>
                  <span className="flex size-9 items-center justify-center overflow-hidden rounded-md bg-muted text-muted-foreground">
                    {p.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={p.imageUrl}
                        alt=""
                        loading="lazy"
                        referrerPolicy="no-referrer"
                        className="size-full object-cover"
                      />
                    ) : (
                      <ImageIcon className="size-4" aria-hidden />
                    )}
                  </span>
                </td>

                {/* Tên + mô tả */}
                <td className="max-w-0">
                  <p className="truncate text-sm font-medium">{p.name}</p>
                  <p className="truncate text-[11px] text-muted-foreground">{p.description}</p>
                </td>

                {/* Giá — canh phải */}
                <td className="text-right text-sm font-semibold tabular-nums">{formatVND(p.price)}</td>

                {/* Trạng thái bán — Tạm ngưng / đang bán */}
                <td>
                  {p.paused ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-slate-200 px-1.5 py-0.5 text-[11px] font-medium text-slate-700">
                      Tạm ngưng
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-1.5 py-0.5 text-[11px] font-medium text-emerald-700">
                      Đang bán
                    </span>
                  )}
                </td>

                {/* Tạm ngưng / mở bán lại — hành động ngay trên hàng (chặn nổi bọt để không mở chi tiết) */}
                <td className="whitespace-nowrap text-right">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onTogglePause(p.id);
                    }}
                    className={cn("h-7", !p.paused && "text-amber-700 hover:text-amber-800")}
                  >
                    {p.paused ? <Play className="size-3.5" aria-hidden /> : <Pause className="size-3.5" aria-hidden />}
                    {p.paused ? "Mở bán lại" : "Tạm ngưng"}
                  </Button>
                </td>

                <td className="text-right">
                  <ChevronRight className="inline size-4 text-muted-foreground" aria-hidden />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
