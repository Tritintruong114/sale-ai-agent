import ordersRaw from "@/data/orders.json";
import { type Order, type OrderStatus } from "@/components/orders/meta";
import { stockState, type CatalogItem } from "./meta";

// Join products ↔ orders (X-ref) để màn Sản phẩm liên kết được sang Đơn / Hội thoại.
// Đọc trực tiếp orders.json như các màn khác; tất định, không phụ thuộc now/random (§1.4).

const ORDERS = ordersRaw.orders as Order[];

export type RelatedOrder = {
  id: string;
  customerName: string;
  status: OrderStatus;
  conversationId: string;
  qty: number; // số lượng sản phẩm này trong đơn
  lineTotal: number; // doanh thu dòng (price × qty) của sản phẩm này
};

export type ProductStats = {
  orderCount: number;
  unitsSold: number;
  revenue: number;
  relatedOrders: RelatedOrder[];
  relatedConversationIds: string[];
};

// Số liệu của 1 sản phẩm: gom các đơn có chứa productId, cộng qty/doanh thu theo từng dòng.
export function productStats(productId: string): ProductStats {
  const relatedOrders: RelatedOrder[] = [];
  let unitsSold = 0;
  let revenue = 0;

  for (const o of ORDERS) {
    const lines = o.items.filter((it) => it.productId === productId);
    if (lines.length === 0) continue;
    const qty = lines.reduce((n, it) => n + it.qty, 0);
    const lineTotal = lines.reduce((s, it) => s + it.price * it.qty, 0);
    unitsSold += qty;
    revenue += lineTotal;
    relatedOrders.push({
      id: o.id,
      customerName: o.customerName,
      status: o.status,
      conversationId: o.conversationId,
      qty,
      lineTotal,
    });
  }

  // Đơn mới nhất lên đầu (mã đơn tăng dần theo thời gian tạo → đảo chiều).
  relatedOrders.sort((a, b) => b.id.localeCompare(a.id));
  const relatedConversationIds = [...new Set(relatedOrders.map((o) => o.conversationId))];

  return {
    orderCount: relatedOrders.length,
    unitsSold,
    revenue,
    relatedOrders,
    relatedConversationIds,
  };
}

// Tổng hợp cho lede/KPI: tổng SP, số SP sắp/hết hàng, doanh thu cộng dồn từ các SP trong danh mục.
export function catalogTotals(catalog: CatalogItem[]): {
  total: number;
  lowStock: number;
  revenueFromProducts: number;
} {
  const lowStock = catalog.filter((p) => stockState(p) !== "in_stock").length;
  const revenueFromProducts = catalog.reduce((s, p) => s + productStats(p.id).revenue, 0);
  return { total: catalog.length, lowStock, revenueFromProducts };
}
