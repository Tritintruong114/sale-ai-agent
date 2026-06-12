// Model tin nhắn chung cho khung chat (ChatWindow/MessageBubble/Composer).
// Giữ tương thích ngược: tin cũ chỉ cần {id, role, text}; các kind mới (reasoning, tool)
// thêm field tuỳ chọn nên không vỡ usage cũ (Inbox, Test chat, Talk to Agent).

// Thẻ thanh toán agent gửi trong hội thoại (chốt đơn) — mã QR + thông tin chuyển khoản.
// status: pending = chờ khách chuyển; paid = đã nhận.
export type PaymentCard = {
  seed: string; // nguồn vẽ lưới QR mock (tất định)
  items: string; // tóm tắt đơn (vd "Cam sành 2kg · 1 phần")
  amount: number;
  bank: string;
  accountNo: string;
  holder: string;
  memo: string; // nội dung chuyển khoản
  status: "pending" | "paid";
};

// Hành động "Apply" gắn dưới một tin agent — vd áp các câu mẫu agent gợi ý vào một tình huống bàn giao.
// Bấm Apply ghi thẳng vào agentConfigStore; applied = true sau khi áp (đổi nút sang "Đã áp dụng").
export type ApplyAction = {
  kind: "handoffPhrases";
  ruleKey: string; // tình huống đích; chưa có thì tạo mới khi Apply
  label: string;
  description?: string;
  phrases: string[]; // câu mẫu gợi ý để thêm vào "Ví dụ khách nói"
  applied?: boolean;
};

export type ChatMessage = {
  id: string;
  // customer/agent = bong bóng chat; system = banner; typing = đang soạn;
  // reasoning = khối "đang suy nghĩ"; tool = thẻ gọi công cụ.
  role: "customer" | "agent" | "system" | "typing" | "reasoning" | "tool";
  text: string;
  // apply: nút hành động gắn dưới tin agent (vd "Apply" câu mẫu gợi ý vào tình huống bàn giao).
  apply?: ApplyAction;
  // reasoning: các dòng suy nghĩ chi tiết (liệt kê dưới câu tóm tắt `text`).
  steps?: string[];
  // tool: thẻ tool-call — nhãn việc đang làm, trạng thái, và file đích (vd "VIBE-TONE.md").
  tool?: { label: string; status: "running" | "done"; target?: string };
  // image: tin ảnh gửi riêng (vd agent gửi hình sản phẩm) — render thành ảnh độc lập, không bọc bubble chữ.
  image?: { url: string; alt?: string };
  // payment: thẻ mã QR chốt đơn agent gửi cho khách — render thành thẻ thanh toán, không bọc bubble chữ.
  payment?: PaymentCard;
};
