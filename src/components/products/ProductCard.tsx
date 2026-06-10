import { ImageIcon, ShoppingCart } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatVND } from "@/lib/format";
import { STOCK_META, stockState, type CatalogItem } from "./meta";
import { productStats } from "./productStats";

// Card sản phẩm — bấm để mở panel chi tiết (master–detail). Chip tồn + mini-stat liên kết đơn.

export function ProductCard({
  item,
  selected,
  onSelect,
}: {
  item: CatalogItem;
  selected: boolean;
  onSelect: () => void;
}) {
  const state = stockState(item);
  const meta = STOCK_META[state];
  const { orderCount, unitsSold } = productStats(item.id);

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={cn(
        "group flex cursor-pointer flex-col overflow-hidden rounded-xl bg-card text-left ring-1 ring-foreground/10 transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        selected && "ring-2 ring-primary hover:bg-card",
      )}
    >
      {/* Ảnh — dùng ảnh thật nếu có, fallback về gợi ý chữ */}
      <div className="relative flex h-44 items-center justify-center gap-1.5 overflow-hidden bg-muted px-3 text-center text-xs text-muted-foreground">
        {item.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.imageUrl}
            alt={item.name}
            loading="lazy"
            referrerPolicy="no-referrer"
            className="absolute inset-0 size-full object-cover"
          />
        ) : (
          <>
            <ImageIcon className="size-4 shrink-0" aria-hidden />
            <span className="line-clamp-2">{item.imageHint}</span>
          </>
        )}
        <span
          className={cn(
            "absolute right-2 top-2 inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-medium",
            meta.cls,
          )}
        >
          <meta.icon className="size-2.5" aria-hidden />
          {meta.label}
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-1.5 p-3">
        <p className="text-sm font-medium leading-tight">{item.name}</p>
        <p className="text-sm font-semibold tabular-nums">{formatVND(item.price)}</p>
        <p className="line-clamp-2 text-xs text-muted-foreground">{item.description}</p>

        <div className="mt-auto flex items-center justify-between gap-2 pt-1.5 text-[11px] text-muted-foreground">
          <span className={cn("tabular-nums", state !== "in_stock" && "font-medium text-amber-600")}>
            Tồn: {item.stock}
          </span>
          {orderCount > 0 ? (
            <span className="inline-flex items-center gap-1 tabular-nums">
              <ShoppingCart className="size-3" aria-hidden />
              {orderCount} đơn · {unitsSold} đã bán
            </span>
          ) : (
            <span className="text-muted-foreground/70">Chưa có đơn</span>
          )}
        </div>
      </div>
    </button>
  );
}
