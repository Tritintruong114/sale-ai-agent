"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useUiStore } from "@/store/uiStore";
import raw from "@/data/orders.json";
import { ApprovalQueue } from "./ApprovalQueue";
import { OrderBoard } from "./OrderBoard";
import { OrderDetailPanel } from "./OrderDetailPanel";
import { OrderKpis } from "./OrderKpis";
import {
  OrderList,
  ORDER_SORT_DEFAULT_DIR,
  sortOrders,
  type OrderSortDir,
  type OrderSortKey,
} from "./OrderList";
import { Pagination } from "@/components/ui/pagination";
import { ProductMetrics } from "./ProductMetrics";
import {
  OrdersToolbar,
  type ApprovalFilter,
  type ChannelFilter,
  type StatusFilter,
  type View,
} from "./OrdersToolbar";
import { NEXT_STATUS, ORDERS_METRICS_ENABLED, type Approval, type Order } from "./meta";

// M2 Quản lý đơn — lede + KPI + zone duyệt HITL + lọc/tìm + Board/List + panel chi tiết docked.
// Bấm đơn → mở panel; "Xem hội thoại" → X1.

const INITIAL = raw.orders as Order[];

export function OrdersScreen({ highlightId, initialTab }: { highlightId?: string; initialTab?: string }) {
  const router = useRouter();

  const [orders, setOrders] = useState<Order[]>(INITIAL);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [approval, setApproval] = useState<ApprovalFilter>("all");
  const [channel, setChannel] = useState<ChannelFilter>("all");
  const [view, setView] = useState<View>("list"); // Bảng cột (Kanban) tạm ẩn — mặc định Danh sách
  const [listPage, setListPage] = useState(1); // phân trang chế độ Danh sách (1-based)
  const [listPageSize, setListPageSize] = useState(5);
  const [listSortKey, setListSortKey] = useState<OrderSortKey>("createdAt"); // sắp xếp cột bảng Danh sách
  const [listSortDir, setListSortDir] = useState<OrderSortDir>("desc");
  const [selectedId, setSelectedId] = useState<string | null>(
    highlightId && INITIAL.some((o) => o.id === highlightId) ? highlightId : null,
  );

  // Tab nằm trên topbar (TopBar) — đồng bộ qua uiStore. Vào bằng deep-link tới 1 đơn → mở tab Quản lý.
  const tab = useUiStore((s) => s.ordersTab);
  const setOrdersTab = useUiStore((s) => s.setOrdersTab);
  useEffect(() => {
    if (selectedId) setOrdersTab("manage");
  }, [selectedId, setOrdersTab]);

  // Reflect lên URL (§6.11) — deep-link ?tab= khi vào màn set vào store.
  // Tab Chỉ số đang tạm ẩn → luôn ép về "manage" dù URL có ?tab=metrics.
  useEffect(() => {
    if (!ORDERS_METRICS_ENABLED) {
      setOrdersTab("manage");
      return;
    }
    if (initialTab === "metrics" || initialTab === "manage") setOrdersTab(initialTab);
  }, [initialTab, setOrdersTab]);

  // …và đổi tab/đơn đang mở thì ghi ngược lên thanh địa chỉ (replace, không nhảy cuộn).
  useEffect(() => {
    const qs = new URLSearchParams();
    qs.set("tab", tab);
    if (selectedId) qs.set("o", selectedId);
    router.replace(`/orders?${qs.toString()}`, { scroll: false });
  }, [tab, selectedId, router]);

  const decide = (id: string, value: Approval) =>
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, approval: value } : o)));
  const advance = (id: string) =>
    setOrders((prev) =>
      prev.map((o) => (o.id === id && NEXT_STATUS[o.status] ? { ...o, status: NEXT_STATUS[o.status]! } : o)),
    );
  // Đổi thẳng trạng thái đơn hàng (chọn từ dropdown trong bảng — có thể lùi lại, khác advance chỉ tiến tới).
  const changeStatus = (id: string, status: Order["status"]) =>
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o)));

  const statusCounts = useMemo(() => {
    const m: Record<string, number> = { all: orders.length };
    for (const o of orders) m[o.status] = (m[o.status] ?? 0) + 1;
    return m;
  }, [orders]);

  const pending = useMemo(() => orders.filter((o) => o.approval === "pending"), [orders]);

  const hasFilters = query.trim() !== "" || status !== "all" || approval !== "all" || channel !== "all";

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return orders
      .filter((o) => {
        if (status !== "all" && o.status !== status) return false;
        if (approval !== "all" && o.approval !== approval) return false;
        if (channel !== "all" && o.channel !== channel) return false;
        if (!q) return true;
        return o.customerName.toLowerCase().includes(q) || o.id.toLowerCase().includes(q);
      })
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [orders, query, status, approval, channel]);

  // Danh sách: sắp xếp toàn bộ tập đã lọc theo cột đang chọn TRƯỚC khi phân trang (sort toàn cục).
  const listSorted = useMemo(
    () => sortOrders(visible, listSortKey, listSortDir),
    [visible, listSortKey, listSortDir],
  );
  const onListSort = (key: OrderSortKey) => {
    if (key === listSortKey) {
      setListSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setListSortKey(key);
      setListSortDir(ORDER_SORT_DEFAULT_DIR[key]);
    }
  };

  // Phân trang Danh sách: về trang 1 khi tập kết quả đổi (lọc/tìm/đổi sắp xếp), kẹp khi page vượt biên.
  const listPageCount = Math.max(1, Math.ceil(listSorted.length / listPageSize));
  useEffect(() => {
    setListPage(1);
  }, [query, status, approval, channel, listPageSize, listSortKey, listSortDir]);
  const safeListPage = Math.min(listPage, listPageCount);
  const pagedVisible = useMemo(
    () => listSorted.slice((safeListPage - 1) * listPageSize, safeListPage * listPageSize),
    [listSorted, safeListPage, listPageSize],
  );

  const selected = orders.find((o) => o.id === selectedId) ?? null;

  const resetFilters = () => {
    setQuery("");
    setStatus("all");
    setApproval("all");
    setChannel("all");
  };

  const viewConversation = (conversationId: string) => router.push(`/inbox?c=${conversationId}`);
  // Mở khoản thu liên kết bên màn Thanh toán (tab Thu tiền tự bật do có ?p=).
  const viewPayment = (paymentId: string) => router.push(`/payments?p=${paymentId}`);

  return (
    // Tab Chỉ số: trang dữ liệu căn giữa max-w-6xl (§6.1), cuộn bình thường. Tab Quản lý: full-width
    // (cần bề ngang cho board), cao bằng vùng main (h-full) — toolbar cố định, board cuộn nội bộ.
    <div
      className={cn(
        "flex w-full flex-col gap-4",
        ORDERS_METRICS_ENABLED && tab === "metrics" ? "mx-auto max-w-6xl" : "h-full min-h-0",
      )}
    >
      {ORDERS_METRICS_ENABLED && tab === "metrics" ? (
        /* Tab Chỉ số — đọc số liệu, chỉ xem. */
        <div className="flex flex-col gap-6">
          <header className="min-w-0">
            <h1 className="text-pretty text-base font-semibold sm:text-lg">
              {orders.length} đơn đang theo dõi,{" "}
              {pending.length > 0 ? (
                <span className="text-amber-600">{pending.length} đơn cần bạn duyệt.</span>
              ) : (
                <span className="text-emerald-600">tất cả đơn đã được xử lý.</span>
              )}
            </h1>
            <p className="text-xs text-muted-foreground sm:text-sm">
              Theo dõi đơn agent chốt từ hội thoại, duyệt nhanh khi cần.
            </p>
          </header>

          <section className="space-y-3" aria-labelledby="order-overview-h">
            <h2 id="order-overview-h" className="text-lg font-semibold">
              Tổng quan đơn
            </h2>
            <OrderKpis orders={orders} />
          </section>

          <ProductMetrics orders={orders} />
        </div>
      ) : (
        /* Tab Quản lý — zone duyệt HITL + Board/List + panel chi tiết */
        <>
          <ApprovalQueue
            pending={pending}
            onView={() => setApproval("pending")}
            viewing={approval === "pending"}
          />

          {/* Vùng làm việc */}
          <section
            aria-labelledby="board-h"
            className={cn(
              "flex min-h-0 flex-1 flex-col",
              selected && "lg:grid lg:grid-cols-[1fr_22rem] lg:items-stretch lg:gap-4",
            )}
          >
            <h2 id="board-h" className="sr-only">
              Danh sách đơn
            </h2>

            {/* Một container chung cao bằng vùng làm việc: toolbar cố định (border-b) + board/list cuộn. Ẩn trên mobile khi mở chi tiết. */}
            <div
              className={cn(
                "flex min-h-0 min-w-0 flex-1 flex-col rounded-xl bg-card ring-1 ring-foreground/10",
                selected && "hidden lg:flex",
              )}
            >
              <div className="shrink-0 rounded-t-xl border-b bg-card p-2">
                <OrdersToolbar
                  query={query}
                  onQuery={setQuery}
                  status={status}
                  onStatus={setStatus}
                  approval={approval}
                  onApproval={setApproval}
                  channel={channel}
                  onChannel={setChannel}
                  view={view}
                  onView={setView}
                  statusCounts={statusCounts}
                  hasFilters={hasFilters}
                  onReset={resetFilters}
                />
              </div>
              {/* Board (md+): cuộn nằm trong từng cột → vùng này khoá overflow. List & mobile: cuộn cả vùng. */}
              <div
                className={cn(
                  "min-h-0 flex-1 p-2.5",
                  view === "board" ? "overflow-y-auto md:overflow-hidden" : "overflow-y-auto",
                )}
              >
                {view === "board" ? (
                  <OrderBoard orders={visible} selectedId={selectedId} onOpen={setSelectedId} onAdvance={advance} />
                ) : (
                  <OrderList
                    orders={pagedVisible}
                    selectedId={selectedId}
                    onOpen={setSelectedId}
                    onStatusChange={changeStatus}
                    sortKey={listSortKey}
                    sortDir={listSortDir}
                    onSort={onListSort}
                  />
                )}
              </div>

              {/* Footer phân trang — chỉ chế độ Danh sách, dính đáy container (không cuộn mất). */}
              {view === "list" && visible.length > 0 ? (
                <div className="shrink-0 border-t px-2.5 py-2">
                  <Pagination
                    page={safeListPage}
                    pageSize={listPageSize}
                    total={visible.length}
                    onPageChange={setListPage}
                    onPageSizeChange={setListPageSize}
                    unitLabel="đơn"
                  />
                </div>
              ) : null}
            </div>

            {/* Panel chi tiết — cột phải cao bằng vùng làm việc (lg+), full-width thay danh sách trên mobile. Không overlay. */}
            {selected ? (
              <div className="min-h-0 flex-1 overflow-hidden rounded-xl bg-card ring-1 ring-foreground/10 lg:h-full lg:flex-none">
                <OrderDetailPanel
                  order={selected}
                  onClose={() => setSelectedId(null)}
                  onDecide={decide}
                  onAdvance={advance}
                  onViewConversation={viewConversation}
                  onViewPayment={viewPayment}
                />
              </div>
            ) : null}
          </section>
        </>
      )}
    </div>
  );
}
