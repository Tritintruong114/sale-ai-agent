// Kịch bản re-train định nghĩa agent — tất định, mock (§nguyên tắc 4, không random).
// Manager Agent đóng vai "huấn luyện viên": suy nghĩ → hỏi 1-2 câu → mô phỏng gọi tools
// cập nhật các file định nghĩa → báo thành công. KHÔNG sửa dữ liệu thật (chỉ hiển thị).
// Driver ở AgentChatPanel phát từng emission theo thứ tự, gặp câu hỏi thì chờ user trả lời rồi sang lượt sau.

export type RetrainEmission =
  | { kind: "reasoning"; text: string; steps?: string[] }
  | { kind: "agent"; text: string }
  | { kind: "tool"; label: string; target?: string };

export type RetrainTurn = {
  // Các tin bot phát ra tuần tự trong lượt này.
  emissions: RetrainEmission[];
  // Nếu có & chưa phải lượt cuối: là câu hỏi — driver chờ user trả lời rồi sang lượt sau.
  // Ở lượt cuối: là CTA kết thúc (vd "Chat thử…") — bấm sẽ chuyển sang agent để test, không advance.
  quickReplies?: string[];
};

// Nhận diện lệnh /re-train trong tin user (kể cả khi kèm tên agent / mô tả).
export const RETRAIN_TRIGGER = /re-?train/i;

// Nhãn CTA kết thúc — driver so khớp để biết user bấm "test" thay vì advance flow.
export const retrainCtaLabel = (name: string) => `Chat thử với Agent ${name}`;

export function buildRetrainFlow(name: string): RetrainTurn[] {
  return [
    // Lượt 0 — đọc định nghĩa hiện tại rồi hỏi về giọng điệu.
    {
      emissions: [
        {
          kind: "reasoning",
          text: `Đang đọc lại định nghĩa hiện tại của ${name}…`,
          steps: [
            "SOUL.md — tính cách cốt lõi",
            "VIBE-TONE.md — giọng & cảm xúc",
            "CORPUS.md — kiến thức nền",
            "RULES.md — nguyên tắc & bàn giao",
          ],
        },
        {
          kind: "agent",
          text: `Mình đã nắm được định nghĩa hiện tại. Để cập nhật đúng ý, cho mình hỏi nhanh 2 điều nhé.\n\nTrước tiên, giọng điệu của ${name} muốn giữ như hiện tại hay điều chỉnh?`,
        },
      ],
      quickReplies: ["Giữ thân thiện chuyên nghiệp", "Trẻ trung hơn", "Trang trọng hơn"],
    },
    // Lượt 1 — xác nhận kiến thức nền.
    {
      emissions: [
        { kind: "reasoning", text: "Đã ghi nhận hướng giọng điệu. Tiếp theo cần xác nhận phần kiến thức nền." },
        {
          kind: "agent",
          text: `Shop có sản phẩm hoặc thông tin mới cần ${name} cập nhật vào kiến thức không?`,
        },
      ],
      quickReplies: ["Có sản phẩm mới", "Không, giữ nguyên"],
    },
    // Lượt 2 — tổng hợp, gọi tools cập nhật, báo thành công + CTA test.
    {
      emissions: [
        { kind: "reasoning", text: "Đang tổng hợp phản hồi và cập nhật định nghĩa…" },
        { kind: "tool", label: "Cập nhật giọng & cảm xúc", target: "VIBE-TONE.md" },
        { kind: "tool", label: "Bổ sung kiến thức nền", target: "CORPUS.md" },
        { kind: "tool", label: "Đồng bộ danh tính", target: "IDENTITY.md" },
        {
          kind: "agent",
          text: `Đã cập nhật xong định nghĩa của ${name}. Bạn có thể xem lại ở Cấu hình Agent → Danh tính.\n\nMuốn test ngay thì đổi agent trên header thành **Agent ${name}** rồi nhắn thử vài câu nhé.`,
        },
      ],
      quickReplies: [retrainCtaLabel(name)],
    },
  ];
}
