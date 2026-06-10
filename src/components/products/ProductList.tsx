import { ArrowDown, ArrowUp, ChevronRight, ChevronsUpDown, ImageIcon, PackageSearch, ShoppingCart } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatVND } from "@/lib/format";
import { STOCK_META, stockState, type CatalogItem } from "./meta";
import { productStats } from "./productStats";

// Chế độ Danh sách — data table quét nhanh nhiều sản phẩm (mirror OrderList): ảnh thumbnail + tên,
// giá/tồn canh phải tabular, chip tồn (a11y: không chỉ màu), hàng chọn nổi bật + truy cập bàn phím.
// Bấm hàng → mở panel chi tiết. Header cột sắp xếp được (aria-sort); sort do cha quản (controlled)
// để sắp toàn bộ tập rồi mới render — đồng bộ với sort Select trên toolbar.

export type ProductSortKey = "newest" | "name" | "orders" | "price" | "stock";
export type ProductSortDir = "asc" | "desc";

// Hướng mặc định khi mới bấm sang cột: chữ tăng dần (A→Z), số/đơn giảm dần (cao trước),
// tồn tăng dần (ít trước — đưa hàng sắp/hết lên đầu để xử lý).
export const PRODUCT_SORT_DEFAULT_DIR: Record<ProductSortKey, ProductSortDir> = {
  newest: "desc",
  name: "asc",
  orders: "desc",
  price: "desc",
  stock: "asc",
};

export function sortProducts(items: CatalogItem[], key: ProductSortKey, dir: ProductSortDir): CatalogItem[] {
  if (key === "newest") return items; // giữ thứ tự danh mục (item mới prepend lên đầu)
  const sign = dir === "asc" ? 1 : -1;
  const orderCount = new Map<string, number>();
  const orders = (p: CatalogItem) => {
    let n = orderCount.get(p.id);
    if (n === undefined) {
      n = productStats(p.id).orderCount;
      orderCount.set(p.id, n);
    }
    return n;
  };
  return [...items].sort((a, b) => {
    switch (key) {
      case "name":
        return sign * a.name.localeCompare(b.name, "vi");
      case "orders":
        return sign * (orders(a) - orders(b)) || a.name.localeCompare(b.name, "vi");
      case "price":
        return sign * (a.price - b.price);
      default:
        return sign * (a.stock - b.stock); // stock
    }
  });
}

// Cột sắp xếp được. "Đơn liên quan" ẩn dưới lg (giữ className responsive như body).
const COLUMNS: { key: ProductSortKey; label: string; align: "left" | "right"; className?: string }[] = [
  { key: "name", label: "Sản phẩm", align: "left" },
  { key: "orders", label: "Đơn liên quan", align: "right", className: "hidden lg:table-cell" },
  { key: "price", label: "Giá", align: "right" },
  { key: "stock", label: "Tồn", align: "right" },
];

function StockBadge({ item }: { item: CatalogItem }) {
  const meta = STOCK_META[stockState(item)];
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[11px] font-medium", meta.cls)}>
      <meta.icon className="size-2.5" aria-hidden />
      {meta.label}
    </span>
  );
}

export function ProductList({
  items,
  selectedId,
  onOpen,
  sortKey,
  sortDir,
  onSort,
}: {
  items: CatalogItem[];
  selectedId: string | null;
  onOpen: (id: string) => void;
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
      <table className="w-full min-w-[44rem] border-collapse text-left">
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
            <th scope="col" className="w-9">
              <span className="sr-only">Mở chi tiết</span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {items.map((p) => {
            const selected = p.id === selectedId;
            const state = stockState(p);
            const { orderCount, unitsSold } = productStats(p.id);
            return (
              <tr
                key={p.id}
                onClick={() => onOpen(p.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onOpen(p.id);
                  }
                }}
                tabIndex={0}
                aria-selected={selected}
                aria-label={`${p.name}, ${formatVND(p.price)}, tồn ${p.stock}`}
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

                {/* Đơn liên quan — canh phải, ẩn dưới lg */}
                <td className="hidden whitespace-nowrap text-right text-xs tabular-nums text-muted-foreground lg:table-cell">
                  {orderCount > 0 ? (
                    <span className="inline-flex items-center gap-1">
                      <ShoppingCart className="size-3" aria-hidden />
                      {orderCount} đơn · {unitsSold} đã bán
                    </span>
                  ) : (
                    <span className="text-muted-foreground/70">Chưa có đơn</span>
                  )}
                </td>

                {/* Giá — canh phải */}
                <td className="text-right text-sm font-semibold tabular-nums">{formatVND(p.price)}</td>

                {/* Tồn — canh phải, tô nhấn khi sắp/hết */}
                <td
                  className={cn(
                    "text-right text-sm tabular-nums",
                    state !== "in_stock" ? "font-semibold text-amber-600" : "text-foreground",
                  )}
                >
                  {p.stock}
                </td>

                {/* Trạng thái tồn — chip màu + nhãn (a11y: không chỉ màu) */}
                <td>
                  <StockBadge item={p} />
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
