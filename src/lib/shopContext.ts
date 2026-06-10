// Gom dữ liệu mock của shop (sản phẩm, đơn, dashboard) thành một đoạn text gọn
// để nhét vào system prompt — giúp agent trả lời từ DATA THẬT thay vì bịa.
// Chạy phía server (route handler) nên import JSON trực tiếp là an toàn.

import products from "@/data/products.json";
import orders from "@/data/orders.json";
import dashboard from "@/data/dashboard.json";

type CatalogItem = { name: string; price: number; stock: number; lowStock?: boolean };
type Order = { status: string; total: number; approval: string; customerName: string };

const vnd = (n: number) => `${n.toLocaleString("vi-VN")}đ`;

export function buildShopContext(): string {
  const catalog = (products.catalog ?? []) as CatalogItem[];
  const orderList = (orders.orders ?? []) as Order[];
  const report = dashboard.dailyReport;
  const todo = dashboard.todo;

  // Danh mục sản phẩm — tên, giá, tồn (đánh dấu sắp hết / hết hàng).
  const productLines = catalog
    .map((p) => {
      const stockNote = p.stock === 0 ? " (HẾT HÀNG)" : p.lowStock ? ` (sắp hết, còn ${p.stock})` : ` (còn ${p.stock})`;
      return `- ${p.name}: ${vnd(p.price)}${stockNote}`;
    })
    .join("\n");

  // Tóm tắt đơn theo trạng thái + số đơn lớn chờ duyệt.
  const byStatus = orderList.reduce<Record<string, number>>((acc, o) => {
    acc[o.status] = (acc[o.status] ?? 0) + 1;
    return acc;
  }, {});
  const pendingApproval = orderList.filter((o) => o.approval === "pending").length;

  return [
    `## DỮ LIỆU THẬT CỦA CỬA HÀNG (dùng để trả lời, không được bịa thêm)`,
    ``,
    `### Báo cáo hôm nay (${report.date})`,
    `- Tin nhắn mới: ${report.newChats} · Khách mới: ${report.newCustomers}`,
    `- Doanh thu: ${vnd(report.revenue)} · Đơn chờ xử lý: ${report.pendingOrders}`,
    `- Việc cần làm: ${todo.handoff} hội thoại cần người, ${todo.bigOrders} đơn lớn chờ duyệt, ${todo.payments} thanh toán chờ duyệt`,
    ``,
    `### Đơn hàng (${orderList.length} đơn)`,
    `- Theo trạng thái: ${Object.entries(byStatus).map(([s, n]) => `${s}=${n}`).join(", ")}`,
    `- Đơn đang chờ chủ shop duyệt: ${pendingApproval}`,
    ``,
    `### Danh mục sản phẩm (${catalog.length} mặt hàng)`,
    productLines,
  ].join("\n");
}
