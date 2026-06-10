import { ArrowDownUp, Boxes, LayoutGrid, List, Plus, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { STOCK_META, type StockState } from "./meta";
import type { ProductSortDir, ProductSortKey } from "./ProductList";

export type StockFilter = StockState | "all";
export type View = "grid" | "list";

// Trigger lọc dạng icon (mirror Orders/Inbox): chevron mảnh & nhạt, nền tô nhẹ khi khác mặc định §6.9.
const FILTER_TRIGGER = "gap-1 px-2 [&>svg:last-child]:size-3 [&>svg:last-child]:text-muted-foreground/60";

const STOCK_ORDER: StockState[] = ["in_stock", "low", "out"];

// Sort Select đồng bộ với header cột bảng (cùng state). Mỗi mục là một cặp (key, dir);
// các cột khác (Sản phẩm/Đơn) vẫn sắp được trực tiếp trên header bảng.
const SORTS: { key: ProductSortKey; dir: ProductSortDir; label: string }[] = [
  { key: "newest", dir: "desc", label: "Mới thêm gần đây" },
  { key: "price", dir: "desc", label: "Giá cao → thấp" },
  { key: "price", dir: "asc", label: "Giá thấp → cao" },
  { key: "stock", dir: "asc", label: "Tồn ít → nhiều" },
  { key: "stock", dir: "desc", label: "Tồn nhiều → ít" },
];
const sortValue = (key: ProductSortKey, dir: ProductSortDir) => `${key}:${dir}`;

export function ProductsToolbar({
  query,
  onQuery,
  stock,
  onStock,
  sortKey,
  sortDir,
  onSort,
  view,
  onView,
  stockCounts,
  hasFilters,
  onReset,
  onCreate,
}: {
  query: string;
  onQuery: (v: string) => void;
  stock: StockFilter;
  onStock: (v: StockFilter) => void;
  sortKey: ProductSortKey;
  sortDir: ProductSortDir;
  onSort: (key: ProductSortKey, dir: ProductSortDir) => void;
  view: View;
  onView: (v: View) => void;
  stockCounts: Record<string, number>;
  hasFilters: boolean;
  onReset: () => void;
  onCreate: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Tìm kiếm */}
      <div className="relative min-w-0 flex-1 basis-48">
        <Search
          className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <input
          value={query}
          onChange={(e) => onQuery(e.target.value)}
          placeholder="Tìm theo tên hoặc mô tả sản phẩm…"
          aria-label="Tìm sản phẩm"
          className="h-8 w-full rounded-lg border bg-background pl-8 pr-8 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40"
        />
        {query ? (
          <button
            type="button"
            onClick={() => onQuery("")}
            aria-label="Xoá tìm kiếm"
            className="absolute right-1.5 top-1/2 flex size-6 -translate-y-1/2 cursor-pointer items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <X className="size-3.5" aria-hidden />
          </button>
        ) : null}
      </div>

      {/* Lọc theo tồn kho */}
      <Select value={stock} onValueChange={(v) => onStock(v as StockFilter)}>
        <SelectTrigger
          size="sm"
          className={cn(FILTER_TRIGGER, stock !== "all" && STOCK_META[stock as StockState].tint)}
          aria-label="Lọc theo tồn kho"
          title={`Tồn kho: ${stock === "all" ? "Tất cả" : STOCK_META[stock as StockState].label}`}
        >
          {stock === "all" ? (
            <Boxes className="size-4 text-muted-foreground" aria-hidden />
          ) : (
            <span className="flex size-4 items-center justify-center" aria-hidden>
              <span className={cn("size-2.5 rounded-full", STOCK_META[stock as StockState].dot)} />
            </span>
          )}
        </SelectTrigger>
        <SelectContent className="min-w-48">
          <div className="px-1.5 pb-1 pt-0.5 text-[11px] font-medium text-muted-foreground">Tồn kho</div>
          <SelectItem value="all">
            <Boxes className="size-4 text-muted-foreground" aria-hidden />
            Tất cả
            <span className="ml-auto tabular-nums text-xs text-muted-foreground">{stockCounts.all ?? 0}</span>
          </SelectItem>
          {STOCK_ORDER.map((s) => (
            <SelectItem key={s} value={s}>
              <span className="flex size-4 items-center justify-center" aria-hidden>
                <span className={cn("size-2.5 rounded-full", STOCK_META[s].dot)} />
              </span>
              {STOCK_META[s].label}
              {(stockCounts[s] ?? 0) > 0 ? (
                <span className="ml-auto tabular-nums text-xs text-muted-foreground">{stockCounts[s]}</span>
              ) : null}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Sắp xếp — đồng bộ với header cột bảng. Khi sắp theo cột chỉ có trên bảng
          (Sản phẩm/Đơn) thì Select không khớp mục nào, hiện nhãn cột đang dùng ở tooltip. */}
      <Select
        value={SORTS.some((s) => s.key === sortKey && s.dir === sortDir) ? sortValue(sortKey, sortDir) : ""}
        onValueChange={(v) => {
          if (!v) return;
          const [key, dir] = v.split(":") as [ProductSortKey, ProductSortDir];
          onSort(key, dir);
        }}
      >
        <SelectTrigger
          size="sm"
          className={cn(FILTER_TRIGGER, sortKey !== "newest" && "border-foreground/25 bg-foreground/5")}
          aria-label="Sắp xếp danh mục"
          title={`Sắp xếp: ${SORTS.find((s) => s.key === sortKey && s.dir === sortDir)?.label ?? "theo cột bảng"}`}
        >
          <ArrowDownUp
            className={cn("size-4", sortKey !== "newest" ? "text-foreground/70" : "text-muted-foreground")}
            aria-hidden
          />
        </SelectTrigger>
        <SelectContent className="min-w-48">
          <div className="px-1.5 pb-1 pt-0.5 text-[11px] font-medium text-muted-foreground">Sắp xếp</div>
          {SORTS.map((s) => (
            <SelectItem key={`${s.key}:${s.dir}`} value={sortValue(s.key, s.dir)}>
              {s.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {hasFilters ? (
        <Button variant="ghost" size="sm" onClick={onReset} className="px-2 text-muted-foreground">
          <X className="size-3.5" aria-hidden />
          Xoá lọc
        </Button>
      ) : null}

      {/* Chuyển chế độ xem Lưới ↔ Danh sách (mirror Orders) */}
      <div className="ml-auto flex items-center rounded-lg bg-muted p-0.5" role="group" aria-label="Chế độ xem">
        {([
          { key: "grid", label: "Lưới", icon: LayoutGrid },
          { key: "list", label: "Danh sách", icon: List },
        ] as const).map((v) => (
          <button
            key={v.key}
            type="button"
            onClick={() => onView(v.key)}
            aria-pressed={view === v.key}
            title={v.label}
            className={cn(
              "flex h-7 items-center gap-1.5 rounded-md px-2.5 text-xs font-medium transition-colors cursor-pointer",
              view === v.key ? "bg-card text-foreground ring-1 ring-foreground/10" : "text-muted-foreground hover:text-foreground",
            )}
          >
            <v.icon className="size-3.5" aria-hidden />
            <span className="hidden sm:inline">{v.label}</span>
          </button>
        ))}
      </div>

      {/* CTA chính §4-primary-action — thêm sản phẩm (mở modal nạp 3 nguồn như onboarding, G4a) */}
      <Button size="sm" onClick={onCreate}>
        <Plus className="size-3.5" aria-hidden />
        Thêm sản phẩm
      </Button>
    </div>
  );
}
