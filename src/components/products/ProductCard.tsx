import { ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatVND } from "@/lib/format";
import { type CatalogItem } from "./meta";

// Card sản phẩm — bấm để mở panel chi tiết (master–detail).

export function ProductCard({
  item,
  selected,
  onSelect,
}: {
  item: CatalogItem;
  selected: boolean;
  onSelect: () => void;
}) {
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
      </div>

      <div className="flex flex-1 flex-col gap-1.5 p-3">
        <p className="text-sm font-medium leading-tight">{item.name}</p>
        <p className="text-sm font-semibold tabular-nums">{formatVND(item.price)}</p>
        <p className="line-clamp-2 text-xs text-muted-foreground">{item.description}</p>
      </div>
    </button>
  );
}
