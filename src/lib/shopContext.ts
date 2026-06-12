// Gom dữ liệu mock của shop (sản phẩm, đơn, dashboard) thành một đoạn text gọn
// để nhét vào system prompt — giúp agent trả lời từ DATA THẬT thay vì bịa.
// Chạy phía server (route handler) nên import JSON trực tiếp là an toàn.

import products from "@/data/products.json";
import orders from "@/data/orders.json";
import dashboard from "@/data/dashboard.json";
import { WEEKDAYS, type BusinessProfile } from "@/data/config";

type CatalogItem = { name: string; price: number; stock: number; lowStock?: boolean; imageUrl?: string };
type Order = { status: string; total: number; approval: string; customerName: string };

const vnd = (n: number) => `${n.toLocaleString("vi-VN")}đ`;

export function buildShopContext(): string {
  const catalog = (products.catalog ?? []) as CatalogItem[];
  const orderList = (orders.orders ?? []) as Order[];
  const report = dashboard.dailyReport;
  const todo = dashboard.todo;

  // Danh mục sản phẩm — tên, giá, tồn (đánh dấu sắp hết / hết hàng), kèm URL ảnh để agent gửi khi khách xin.
  const productLines = catalog
    .map((p) => {
      const stockNote = p.stock === 0 ? " (HẾT HÀNG)" : p.lowStock ? ` (sắp hết, còn ${p.stock})` : ` (còn ${p.stock})`;
      const img = p.imageUrl ? ` | ảnh: ${p.imageUrl}` : "";
      return `- ${p.name}: ${vnd(p.price)}${stockNote}${img}`;
    })
    .join("\n");

  // Tóm tắt đơn theo trạng thái + số đơn chờ duyệt.
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
    `- Việc cần làm: ${todo.handoff} hội thoại cần người, ${todo.bigOrders} đơn cần duyệt, ${todo.payments} thanh toán cần duyệt`,
    ``,
    `### Đơn hàng (${orderList.length} đơn)`,
    `- Theo trạng thái: ${Object.entries(byStatus).map(([s, n]) => `${s}=${n}`).join(", ")}`,
    `- Đơn đang chờ chủ shop duyệt: ${pendingApproval}`,
    ``,
    `### Danh mục sản phẩm (${catalog.length} mặt hàng)`,
    productLines,
  ].join("\n");
}

// Thông tin nhận diện shop (tên, loại hình, địa chỉ, SĐT) — đi kèm hồ sơ nghiệp vụ.
type ShopBasics = {
  shopName?: string;
  shopType?: ("online" | "store")[];
  shopAddress?: string;
  shopPhone?: string;
};

// Gom HỒ SƠ NGHIỆP VỤ (giờ, giao hàng, thanh toán, đổi trả, bảo hành, khuyến mãi, FAQ) + nhận diện shop
// thành một khối text có tiêu đề rõ ràng để agent tra cứu khi tư vấn khách. Bỏ qua mục rỗng cho gọn.
export function buildBusinessContext(profile?: BusinessProfile, shop?: ShopBasics): string {
  const lines: string[] = ["## THÔNG TIN NGHIỆP VỤ CỬA HÀNG (trả lời khách dựa trên đây)"];

  // Nhận diện shop — lần đầu đưa địa chỉ/SĐT/loại hình thật vào ngữ cảnh.
  if (shop) {
    const basics: string[] = [];
    if (shop.shopName) basics.push(`- Tên cửa hàng: ${shop.shopName}`);
    if (shop.shopType?.length) {
      const types = shop.shopType.map((t) => (t === "online" ? "bán online" : "có cửa hàng")).join(" + ");
      basics.push(`- Loại hình: ${types}`);
    }
    if (shop.shopAddress) basics.push(`- Địa chỉ: ${shop.shopAddress}`);
    if (shop.shopPhone) basics.push(`- Điện thoại: ${shop.shopPhone}`);
    if (basics.length) lines.push("", "### Cửa hàng", ...basics);
  }

  if (!profile) return lines.length > 1 ? lines.join("\n") : "";

  if (profile.intro?.trim()) lines.push("", "### Giới thiệu", profile.intro.trim());

  const commitments = (profile.commitments ?? []).map((c) => c.trim()).filter(Boolean);
  if (commitments.length) lines.push("", "### Cam kết", ...commitments.map((c) => `- ${c}`));

  // Giờ hoạt động — gộp các ngày cùng khung giờ cho gọn không bắt buộc; ở đây liệt kê theo ngày.
  if (profile.hours?.weekly) {
    const hourLines = WEEKDAYS.map(({ key, label }) => {
      const d = profile.hours.weekly[key];
      if (!d) return null;
      return d.closed ? `- ${label}: Nghỉ` : `- ${label}: ${d.open}–${d.close}`;
    }).filter(Boolean) as string[];
    if (hourLines.length) {
      lines.push("", "### Giờ hoạt động", ...hourLines);
      if (profile.hours.note?.trim()) lines.push(`Ghi chú: ${profile.hours.note.trim()}`);
    }
  }

  // Giao hàng
  const ship = profile.shipping;
  if (ship) {
    const shipLines: string[] = [];
    if (ship.areas?.trim()) shipLines.push(`- Khu vực giao: ${ship.areas.trim()}`);
    if (ship.fee?.trim()) shipLines.push(`- Phí ship: ${ship.fee.trim()}`);
    if (ship.freeshipThreshold && ship.freeshipThreshold > 0)
      shipLines.push(`- Miễn phí ship cho đơn từ ${vnd(ship.freeshipThreshold)}`);
    if (ship.leadTime?.trim()) shipLines.push(`- Thời gian giao: ${ship.leadTime.trim()}`);
    const carriers = (ship.carriers ?? []).map((c) => c.trim()).filter(Boolean);
    if (carriers.length) shipLines.push(`- Đơn vị vận chuyển: ${carriers.join(", ")}`);
    if (shipLines.length) lines.push("", "### Giao hàng", ...shipLines);
  }

  // Thanh toán + chính sách cọc với đơn lớn
  const methods = (profile.payment?.methods ?? []).map((m) => m.trim()).filter(Boolean);
  const deposit = profile.payment?.deposit;
  if (methods.length || deposit?.enabled) {
    lines.push("", "### Thanh toán");
    if (methods.length) lines.push(`- Phương thức: ${methods.join(", ")}`);
    if (deposit?.enabled) {
      const cond = deposit.threshold && deposit.threshold > 0 ? `đơn từ ${vnd(deposit.threshold)}` : "đơn lớn";
      const pct = deposit.percent && deposit.percent > 0 ? ` ${deposit.percent}%` : "";
      lines.push(`- Yêu cầu cọc: ${cond} cần cọc trước${pct} khi đặt.`);
    }
  }

  if (profile.returnPolicy?.trim()) lines.push("", "### Đổi trả", profile.returnPolicy.trim());
  if (profile.warrantyPolicy?.trim()) lines.push("", "### Cam kết chất lượng", profile.warrantyPolicy.trim());

  const promos = (profile.promotions ?? []).filter((p) => p.title?.trim() || p.detail?.trim());
  if (promos.length) {
    lines.push("", "### Khuyến mãi đang chạy");
    promos.forEach((p) => lines.push(`- ${[p.title?.trim(), p.detail?.trim()].filter(Boolean).join(": ")}`));
  }

  const faq = (profile.faq ?? []).filter((f) => f.question?.trim() && f.answer?.trim());
  if (faq.length) {
    lines.push("", "### Câu hỏi thường gặp");
    faq.forEach((f) => lines.push(`- Hỏi: ${f.question.trim()}`, `  Đáp: ${f.answer.trim()}`));
  }

  return lines.length > 1 ? lines.join("\n") : "";
}
