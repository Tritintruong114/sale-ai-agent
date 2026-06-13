// Kịch bản "Kiểm tra với Agent" cho kết nối CRM — tất định, mock (§nguyên tắc 4, không random).
// Manager Agent suy nghĩ → gọi tools (dạng streaming) đại diện cho các call Open API của CRM →
// trả nội dung mẫu tổng kết dữ liệu đọc được. KHÔNG gọi backend / CRM thật.
// Số lượng trùng với SYNC_ENTITIES ở CrmSettings để nhất quán (128 sp · 1.240 kh · 356 đơn).

import type { RetrainTurn } from "./retrainFlow";

export function buildCrmTestFlow(crmName: string, pronoun: string): RetrainTurn[] {
  const p = pronoun || "em";
  return [
    {
      emissions: [
        {
          kind: "reasoning",
          text: `Đang kiểm tra kết nối ${crmName}…`,
          steps: [
            "Xác thực Access Token qua Open API",
            "Kiểm tra phạm vi quyền (sản phẩm · khách hàng · đơn)",
            "Đọc thử dữ liệu mẫu",
            "Đăng ký webhook real-time",
          ],
        },
        { kind: "tool", label: `Gọi ${crmName} API · đồng bộ sản phẩm`, target: "GET /products" },
        { kind: "tool", label: "Đọc danh sách khách hàng", target: "GET /customers" },
        { kind: "tool", label: "Đọc đơn hàng gần đây", target: "GET /orders" },
        { kind: "tool", label: "Đăng ký webhook đơn mới", target: "POST /webhooks" },
        {
          kind: "agent",
          text:
            `Dạ kết nối **${crmName}** hoạt động tốt ạ. ${p} đọc thử được:\n\n` +
            `• **128** sản phẩm\n` +
            `• **1.240** khách hàng\n` +
            `• **356** đơn hàng (90 ngày gần nhất)\n\n` +
            `Webhook real-time đã bật — khi có đơn mới hoặc đổi tồn kho bên ${crmName}, hệ thống tự cập nhật. ` +
            `Mình có thể yên tâm bật đồng bộ tự động nhé ạ.`,
        },
      ],
    },
  ];
}
