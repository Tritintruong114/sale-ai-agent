import { ArrowDownUp, ChevronDown, PencilLine, Plus, Search, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { ProductSortDir, ProductSortKey } from "./ProductList";

// Trigger lọc dạng icon (mirror Orders/Inbox): chevron mảnh & nhạt, nền tô nhẹ khi khác mặc định §6.9.
const FILTER_TRIGGER = "gap-1 px-2 [&>svg:last-child]:size-3 [&>svg:last-child]:text-muted-foreground/60";

// Sort Select đồng bộ với header cột bảng (cùng state). Mỗi mục là một cặp (key, dir);
// cột Sản phẩm vẫn sắp được trực tiếp trên header bảng.
const SORTS: { key: ProductSortKey; dir: ProductSortDir; label: string }[] = [
  { key: "newest", dir: "desc", label: "Mới thêm gần đây" },
  { key: "price", dir: "desc", label: "Giá cao → thấp" },
  { key: "price", dir: "asc", label: "Giá thấp → cao" },
];
const sortValue = (key: ProductSortKey, dir: ProductSortDir) => `${key}:${dir}`;

export function ProductsToolbar({
  query,
  onQuery,
  sortKey,
  sortDir,
  onSort,
  hasFilters,
  onReset,
  onCreateManual,
  onCreateImport,
}: {
  query: string;
  onQuery: (v: string) => void;
  sortKey: ProductSortKey;
  sortDir: ProductSortDir;
  onSort: (key: ProductSortKey, dir: ProductSortDir) => void;
  hasFilters: boolean;
  onReset: () => void;
  onCreateManual: () => void; // thêm thủ công 1 sản phẩm (mở slide-panel)
  onCreateImport: () => void; // nhập từ tệp/link/dán (agent đọc giúp)
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

      {/* Sắp xếp — đồng bộ với header cột bảng. Khi sắp theo cột chỉ có trên bảng
          (Sản phẩm) thì Select không khớp mục nào, hiện nhãn cột đang dùng ở tooltip. */}
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

      {/* CTA chính §4-primary-action — 2 cách thêm: thủ công (slide-panel) hoặc nhập từ nguồn (agent, G4a) */}
      <DropdownMenu>
        <DropdownMenuTrigger render={<Button size="sm" className="ml-auto" />}>
          <Plus className="size-3.5" aria-hidden />
          Thêm sản phẩm
          <ChevronDown className="size-3.5" aria-hidden />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64">
          <DropdownMenuItem onClick={onCreateManual} className="items-start gap-2.5">
            <PencilLine className="mt-0.5 size-4 text-muted-foreground" aria-hidden />
            <span className="min-w-0">
              <span className="block text-sm font-medium">Thêm thủ công</span>
              <span className="block text-xs text-muted-foreground">Tự điền tên, giá, mô tả sản phẩm</span>
            </span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onCreateImport} className="items-start gap-2.5">
            <Sparkles className="mt-0.5 size-4 text-muted-foreground" aria-hidden />
            <span className="min-w-0">
              <span className="block text-sm font-medium">Nhập từ tệp hoặc link</span>
              <span className="block text-xs text-muted-foreground">Agent đọc rồi tạo sản phẩm giúp bạn</span>
            </span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
