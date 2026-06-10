// Model tin nhắn chung cho khung chat (ChatWindow/MessageBubble/Composer).
// Giữ tương thích ngược: tin cũ chỉ cần {id, role, text}; các kind mới (reasoning, tool)
// thêm field tuỳ chọn nên không vỡ usage cũ (Inbox, Test chat, Talk to Agent).

export type ChatMessage = {
  id: string;
  // customer/agent = bong bóng chat; system = banner; typing = đang soạn;
  // reasoning = khối "đang suy nghĩ"; tool = thẻ gọi công cụ.
  role: "customer" | "agent" | "system" | "typing" | "reasoning" | "tool";
  text: string;
  // reasoning: các dòng suy nghĩ chi tiết (liệt kê dưới câu tóm tắt `text`).
  steps?: string[];
  // tool: thẻ tool-call — nhãn việc đang làm, trạng thái, và file đích (vd "VIBE-TONE.md").
  tool?: { label: string; status: "running" | "done"; target?: string };
};
