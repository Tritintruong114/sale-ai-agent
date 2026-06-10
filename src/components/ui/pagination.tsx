import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Pagination primitive — footer phân trang cho bảng/list. Tái dùng Button + Select sẵn có.
// Tất định, không tự giữ state: trang & số dòng/trang do cha sở hữu (controlled).

export function Pagination({
  page,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [5, 10, 20],
  unitLabel = "mục",
}: {
  page: number; // 1-based
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  pageSizeOptions?: number[];
  unitLabel?: string;
}) {
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const current = Math.min(page, pageCount);
  const from = total === 0 ? 0 : (current - 1) * pageSize + 1;
  const to = Math.min(current * pageSize, total);

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
      {/* Phạm vi đang hiển thị */}
      <p className="text-muted-foreground">
        Hiển thị <span className="font-medium tabular-nums text-foreground">{from}–{to}</span> trong{" "}
        <span className="font-medium tabular-nums text-foreground">{total}</span> {unitLabel}
      </p>

      {/* Số dòng/trang */}
      <div className="flex items-center gap-1.5">
        <span className="text-muted-foreground">Số dòng/trang</span>
        <Select value={String(pageSize)} onValueChange={(v) => onPageSizeChange(Number(v))}>
          <SelectTrigger size="sm" aria-label="Số dòng mỗi trang" className="tabular-nums">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="min-w-20">
            {pageSizeOptions.map((n) => (
              <SelectItem key={n} value={String(n)} className="tabular-nums">
                {n}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Điều hướng trang */}
      <div className="ml-auto flex items-center gap-1.5">
        <span className="text-muted-foreground tabular-nums">
          Trang {current}/{pageCount}
        </span>
        <Button
          variant="outline"
          size="icon-sm"
          onClick={() => onPageChange(current - 1)}
          disabled={current <= 1}
          aria-label="Trang trước"
        >
          <ChevronLeft aria-hidden />
        </Button>
        <Button
          variant="outline"
          size="icon-sm"
          onClick={() => onPageChange(current + 1)}
          disabled={current >= pageCount}
          aria-label="Trang sau"
        >
          <ChevronRight aria-hidden />
        </Button>
      </div>
    </div>
  );
}
