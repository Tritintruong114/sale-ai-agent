import { CircleDot, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { PAY_STATE_META, PAY_STATE_ORDER, type PayState } from "./meta";

export type PayStateFilter = PayState | "all";

// Trigger lọc dạng icon (§6.9, mirror OrdersToolbar): chevron mảnh & nhạt, nền tint theo trạng thái khi khác mặc định.
const FILTER_TRIGGER = "gap-1 px-2 [&>svg:last-child]:size-3 [&>svg:last-child]:text-muted-foreground/60";

export function PaymentsToolbar({
  query,
  onQuery,
  state,
  onState,
  stateCounts,
  hasFilters,
  onReset,
}: {
  query: string;
  onQuery: (v: string) => void;
  state: PayStateFilter;
  onState: (v: PayStateFilter) => void;
  stateCounts: Record<string, number>;
  hasFilters: boolean;
  onReset: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Tìm kiếm */}
      <div className="relative min-w-0 flex-1 basis-48">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
        <input
          value={query}
          onChange={(e) => onQuery(e.target.value)}
          placeholder="Tìm theo tên khách hoặc mã đơn…"
          aria-label="Tìm khoản thanh toán"
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

      {/* Lọc trạng thái thanh toán */}
      <Select value={state} onValueChange={(v) => onState(v as PayStateFilter)}>
        <SelectTrigger
          size="sm"
          className={cn(FILTER_TRIGGER, state !== "all" && PAY_STATE_META[state].tint)}
          aria-label="Lọc theo trạng thái thanh toán"
          title={`Trạng thái: ${state === "all" ? "Mọi trạng thái" : PAY_STATE_META[state].label}`}
        >
          {state === "all" ? (
            <CircleDot className="size-4 text-muted-foreground" aria-hidden />
          ) : (
            <span className="flex size-4 items-center justify-center" aria-hidden>
              <span className={cn("size-2.5 rounded-full", PAY_STATE_META[state].dot)} />
            </span>
          )}
        </SelectTrigger>
        <SelectContent className="min-w-52">
          <div className="px-1.5 pb-1 pt-0.5 text-[11px] font-medium text-muted-foreground">Trạng thái thanh toán</div>
          <SelectItem value="all">
            <CircleDot className="size-4 text-muted-foreground" aria-hidden />
            Mọi trạng thái
            <span className="ml-auto tabular-nums text-xs text-muted-foreground">{stateCounts.all ?? 0}</span>
          </SelectItem>
          {PAY_STATE_ORDER.map((s) => (
            <SelectItem key={s} value={s}>
              <span className="flex size-4 items-center justify-center" aria-hidden>
                <span className={cn("size-2.5 rounded-full", PAY_STATE_META[s].dot)} />
              </span>
              {PAY_STATE_META[s].label}
              {(stateCounts[s] ?? 0) > 0 ? (
                <span className="ml-auto tabular-nums text-xs text-muted-foreground">{stateCounts[s]}</span>
              ) : null}
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
    </div>
  );
}
