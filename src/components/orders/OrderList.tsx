import { ArrowDown, ArrowUp, ChevronRight, ChevronsUpDown, Inbox } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatVND } from "@/lib/format";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import { ChannelMark, channelTitle } from "./bits";
import {
  CONSULT_STATUS,
  ORDER_STATUS,
  ORDER_STATUS_ORDER,
  consultStatusOf,
  dateTime,
  itemCount,
  type ConsultStatus,
  type Order,
  type OrderStatus,
} from "./meta";

// Chế độ Bảng — data table quét nhanh nhiều đơn: header cột sắp xếp được (aria-sort), số canh phải
// tabular, hàng chọn nổi bật + truy cập bàn phím. Bấm hàng → mở panel. Sort do cha quản (controlled)
// để sắp xếp toàn bộ tập rồi mới phân trang (xem OrdersScreen) — không chỉ sắp trong 1 trang.
//
// Hai trục trạng thái tách bạch: "Xử lý" = vòng đời xử lý đơn (đổi tại chỗ), "Tư vấn" = phễu hội thoại
// (đọc, join từ conversations.json). Duyệt/thanh toán/giao là chi tiết — xem ở panel, không nhồi vào bảng.

export type OrderSortKey = "customer" | "createdAt" | "total" | "status";
export type OrderSortDir = "asc" | "desc";

// Hướng mặc định khi mới bấm sang cột: chữ tăng dần, số/ngày/tiến độ giảm dần (mới/cao trước).
export const ORDER_SORT_DEFAULT_DIR: Record<OrderSortKey, OrderSortDir> = {
  customer: "asc",
  createdAt: "desc",
  total: "desc",
  status: "asc",
};

export function sortOrders(orders: Order[], key: OrderSortKey, dir: OrderSortDir): Order[] {
  const sign = dir === "asc" ? 1 : -1;
  const statusRank = (o: Order) => ORDER_STATUS_ORDER.indexOf(o.status);
  return [...orders].sort((a, b) => {
    switch (key) {
      case "customer":
        return sign * a.customerName.localeCompare(b.customerName, "vi");
      case "total":
        return sign * (a.total - b.total);
      case "status":
        return sign * (statusRank(a) - statusRank(b) || a.createdAt.localeCompare(b.createdAt));
      default:
        return sign * a.createdAt.localeCompare(b.createdAt);
    }
  });
}

const COLUMNS: { key: OrderSortKey; label: string; align: "left" | "right"; className?: string }[] = [
  { key: "customer", label: "Khách hàng", align: "left" },
  { key: "createdAt", label: "Ngày tạo", align: "left" },
  { key: "total", label: "Giá trị", align: "right" },
  { key: "status", label: "Xử lý", align: "left" },
];

// Đổi trạng thái đơn hàng (stage) ngay trong bảng — dropdown 3 mốc Mới/Đang xử lý/Hoàn tất.
// stopPropagation để mở dropdown không kích hoạt onOpen của hàng.
function StatusSelect({
  order,
  onStatusChange,
}: {
  order: Order;
  onStatusChange: (id: string, status: OrderStatus) => void;
}) {
  const m = ORDER_STATUS[order.status];
  return (
    <span className="inline-flex" onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
      <Select value={order.status} onValueChange={(v) => onStatusChange(order.id, v as OrderStatus)}>
        <SelectTrigger
          size="sm"
          className={cn("h-7 gap-1.5 rounded-full data-[size=sm]:rounded-full", m.tint)}
          aria-label={`Đổi trạng thái đơn ${order.id} — hiện tại ${m.label}`}
        >
          <span className="flex items-center gap-1.5">
            <span className={cn("size-2.5 rounded-full", m.dot)} aria-hidden />
            <span className="text-xs font-medium">{m.label}</span>
          </span>
        </SelectTrigger>
        <SelectContent className="min-w-40">
          {ORDER_STATUS_ORDER.map((s) => (
            <SelectItem key={s} value={s}>
              <span className={cn("size-2.5 rounded-full", ORDER_STATUS[s].dot)} aria-hidden />
              {ORDER_STATUS[s].label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </span>
  );
}

// Trạng thái tư vấn (phễu hội thoại) — chip chỉ đọc; dot màu + nhãn (không chỉ màu). "—" khi chưa có hội thoại.
function ConsultChip({ status }: { status: ConsultStatus | null }) {
  if (!status) {
    return (
      <span className="text-xs text-muted-foreground" title="Chưa gắn hội thoại">
        —
      </span>
    );
  }
  const m = CONSULT_STATUS[status];
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium", m.cls)}>
      <span className={cn("size-1.5 rounded-full", m.dot)} aria-hidden />
      {m.label}
    </span>
  );
}

export function OrderList({
  orders,
  selectedId,
  onOpen,
  onStatusChange,
  sortKey,
  sortDir,
  onSort,
}: {
  orders: Order[];
  selectedId: string | null;
  onOpen: (id: string) => void;
  onStatusChange: (id: string, status: OrderStatus) => void;
  sortKey: OrderSortKey;
  sortDir: OrderSortDir;
  onSort: (key: OrderSortKey) => void;
}) {
  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center gap-1.5 rounded-xl border border-dashed py-12 text-center">
        <Inbox className="size-6 text-muted-foreground" aria-hidden />
        <p className="text-sm text-muted-foreground">Không có đơn nào khớp bộ lọc</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg ring-1 ring-foreground/10">
      <table className="w-full min-w-[46rem] border-collapse text-left">
        <caption className="sr-only">
          Danh sách đơn — bấm tiêu đề cột để sắp xếp, bấm một hàng để xem chi tiết.
        </caption>
        <thead>
          <tr className="border-b bg-muted/40 [&_th]:h-9 [&_th]:px-3 [&_th]:align-middle">
            {/* Cột kênh — icon, không sắp xếp */}
            <th scope="col" className="w-10">
              <span className="sr-only">Kênh</span>
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
            {/* Trạng thái tư vấn — phễu hội thoại, đọc (không sắp xếp) */}
            <th scope="col">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Tư vấn
              </span>
            </th>
            <th scope="col" className="w-9">
              <span className="sr-only">Mở chi tiết</span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {orders.map((o) => {
            const selected = o.id === selectedId;
            return (
              <tr
                key={o.id}
                onClick={() => onOpen(o.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onOpen(o.id);
                  }
                }}
                tabIndex={0}
                aria-selected={selected}
                aria-label={`Đơn ${o.id} của ${o.customerName}, ${formatVND(o.total)}`}
                className={cn(
                  "cursor-pointer outline-none transition-colors [&>td]:px-3 [&>td]:py-2.5 [&>td]:align-middle",
                  "focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring/50",
                  selected ? "bg-primary/5" : "hover:bg-muted/50",
                )}
              >
                {/* Kênh + dải nhấn hàng đang chọn */}
                <td className={cn("border-l-2", selected ? "border-primary" : "border-transparent")}>
                  <ChannelMark channel={o.channel} className="shrink-0" />
                  <span className="sr-only">{channelTitle(o.channel)}</span>
                </td>

                {/* Khách hàng + mã đơn */}
                <td>
                  <p className="truncate text-sm font-medium">{o.customerName}</p>
                  <p className="font-mono text-[11px] text-muted-foreground">
                    {o.id} · {itemCount(o)} sp
                  </p>
                </td>

                {/* Ngày tạo */}
                <td className="whitespace-nowrap text-xs tabular-nums text-muted-foreground">
                  {dateTime(o.createdAt)}
                </td>

                {/* Giá trị — canh phải */}
                <td className="text-right text-sm font-semibold tabular-nums">{formatVND(o.total)}</td>

                {/* Trạng thái đơn hàng — dropdown đổi stage tại chỗ */}
                <td>
                  <StatusSelect order={o} onStatusChange={onStatusChange} />
                </td>

                {/* Trạng thái tư vấn — phễu hội thoại (đọc) */}
                <td>
                  <ConsultChip status={consultStatusOf(o.conversationId)} />
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
