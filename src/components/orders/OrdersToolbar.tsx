import { CircleDot, LayoutGrid, List, Search, Share2, ShieldQuestion, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { ChannelMark } from "./bits";
import {
  APPROVAL_FILTERS,
  APPROVAL_META,
  ORDER_STATUS,
  ORDER_STATUS_ORDER,
  type Approval,
  type Channel,
  type OrderStatus,
} from "./meta";

export type View = "board" | "list";

// Tạm ẩn chế độ "Bảng cột" (Kanban) — chỉ còn Danh sách. Bật lại: đổi cờ này thành true.
const BOARD_VIEW_ENABLED = false;
export type StatusFilter = OrderStatus | "all";
export type ApprovalFilter = Approval | "all";
export type ChannelFilter = Channel | "all";

// Trigger lọc dạng icon (mirror Inbox): chevron mảnh & nhạt, nền tô nhẹ khi khác mặc định.
const FILTER_TRIGGER = "gap-1 px-2 [&>svg:last-child]:size-3 [&>svg:last-child]:text-muted-foreground/60";

export function OrdersToolbar({
  query,
  onQuery,
  status,
  onStatus,
  approval,
  onApproval,
  channel,
  onChannel,
  view,
  onView,
  statusCounts,
  hasFilters,
  onReset,
}: {
  query: string;
  onQuery: (v: string) => void;
  status: StatusFilter;
  onStatus: (v: StatusFilter) => void;
  approval: ApprovalFilter;
  onApproval: (v: ApprovalFilter) => void;
  channel: ChannelFilter;
  onChannel: (v: ChannelFilter) => void;
  view: View;
  onView: (v: View) => void;
  statusCounts: Record<string, number>;
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
          aria-label="Tìm đơn hàng"
          className="h-8 w-full rounded-lg border bg-background pl-8 pr-8 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40"
        />
        {query ? (
          <button
            type="button"
            onClick={() => onQuery("")}
            aria-label="Xoá tìm kiếm"
            className="absolute right-1.5 top-1/2 flex size-6 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground cursor-pointer"
          >
            <X className="size-3.5" aria-hidden />
          </button>
        ) : null}
      </div>

      {/* Lọc trạng thái đơn */}
      <Select value={status} onValueChange={(v) => onStatus(v as StatusFilter)}>
        <SelectTrigger
          size="sm"
          className={cn(FILTER_TRIGGER, status !== "all" && ORDER_STATUS[status as OrderStatus].tint)}
          aria-label="Lọc theo trạng thái đơn"
          title={`Trạng thái: ${status === "all" ? "Mọi trạng thái" : ORDER_STATUS[status as OrderStatus].label}`}
        >
          {status === "all" ? (
            <CircleDot className="size-4 text-muted-foreground" aria-hidden />
          ) : (
            <span className="flex size-4 items-center justify-center" aria-hidden>
              <span className={cn("size-2.5 rounded-full", ORDER_STATUS[status as OrderStatus].dot)} />
            </span>
          )}
        </SelectTrigger>
        <SelectContent className="min-w-48">
          <div className="px-1.5 pb-1 pt-0.5 text-[11px] font-medium text-muted-foreground">Trạng thái đơn</div>
          <SelectItem value="all">
            <CircleDot className="size-4 text-muted-foreground" aria-hidden />
            Mọi trạng thái
            <span className="ml-auto tabular-nums text-xs text-muted-foreground">{statusCounts.all ?? 0}</span>
          </SelectItem>
          {ORDER_STATUS_ORDER.map((s) => (
            <SelectItem key={s} value={s}>
              <span className="flex size-4 items-center justify-center" aria-hidden>
                <span className={cn("size-2.5 rounded-full", ORDER_STATUS[s].dot)} />
              </span>
              {ORDER_STATUS[s].label}
              {(statusCounts[s] ?? 0) > 0 ? (
                <span className="ml-auto tabular-nums text-xs text-muted-foreground">{statusCounts[s]}</span>
              ) : null}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Lọc trạng thái duyệt */}
      <Select value={approval} onValueChange={(v) => onApproval(v as ApprovalFilter)}>
        <SelectTrigger
          size="sm"
          className={cn(FILTER_TRIGGER, approval === "pending" && "border-amber-500/30 bg-amber-500/10", approval !== "all" && approval !== "pending" && "border-foreground/25 bg-foreground/5")}
          aria-label="Lọc theo trạng thái duyệt"
          title={`Duyệt: ${APPROVAL_FILTERS.find((a) => a.key === approval)?.label}`}
        >
          <ShieldQuestion className={cn("size-4", approval === "pending" ? "text-amber-600" : "text-muted-foreground")} aria-hidden />
        </SelectTrigger>
        <SelectContent className="min-w-52">
          <div className="px-1.5 pb-1 pt-0.5 text-[11px] font-medium text-muted-foreground">Trạng thái duyệt</div>
          {APPROVAL_FILTERS.map((a) => (
            <SelectItem key={a.key} value={a.key}>
              {a.key === "all" ? (
                <ShieldQuestion className="size-4 text-muted-foreground" aria-hidden />
              ) : (
                <span className="flex size-4 items-center justify-center" aria-hidden>
                  {(() => {
                    const Icon = APPROVAL_META[a.key].icon;
                    return <Icon className="size-3.5" />;
                  })()}
                </span>
              )}
              {a.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Lọc kênh */}
      <Select value={channel} onValueChange={(v) => onChannel(v as ChannelFilter)}>
        <SelectTrigger
          size="sm"
          className={cn(
            FILTER_TRIGGER,
            channel === "facebook" && "border-[#1877F2]/30 bg-[#1877F2]/10",
            channel === "zalo" && "border-[#0068FF]/30 bg-[#0068FF]/10",
          )}
          aria-label="Lọc theo kênh"
          title={`Kênh: ${channel === "all" ? "Mọi kênh" : channel === "facebook" ? "Facebook" : "Zalo"}`}
        >
          {channel === "all" ? (
            <Share2 className="size-4 text-muted-foreground" aria-hidden />
          ) : (
            <ChannelMark channel={channel} />
          )}
        </SelectTrigger>
        <SelectContent className="min-w-44">
          <div className="px-1.5 pb-1 pt-0.5 text-[11px] font-medium text-muted-foreground">Kênh</div>
          <SelectItem value="all">
            <Share2 className="size-4 text-muted-foreground" aria-hidden />
            Mọi kênh
          </SelectItem>
          <SelectItem value="facebook">
            <ChannelMark channel="facebook" />
            Facebook
          </SelectItem>
          <SelectItem value="zalo">
            <ChannelMark channel="zalo" />
            Zalo
          </SelectItem>
        </SelectContent>
      </Select>

      {hasFilters ? (
        <Button variant="ghost" size="sm" onClick={onReset} className="px-2 text-muted-foreground">
          <X className="size-3.5" aria-hidden />
          Xoá lọc
        </Button>
      ) : null}

      {/* Chuyển chế độ xem Board ↔ List — tạm ẩn switcher khi chỉ còn Danh sách */}
      {BOARD_VIEW_ENABLED ? (
      <div className="ml-auto flex items-center rounded-lg bg-muted p-0.5" role="group" aria-label="Chế độ xem">
        {([
          { key: "board", label: "Bảng cột", icon: LayoutGrid },
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
      ) : null}
    </div>
  );
}
