// M4 Dashboard — meta dùng chung cho màn Dashboard.

// Nút "More Insights" trên topbar (chỉ ở Dashboard) — thay cho "Talk to Agent" mặc định.
// Bấm = mở panel chat + điền sẵn prompt xin agent phân tích sâu số liệu trong ngày (chủ shop tự gửi).
// Tắt cờ này → Dashboard quay về nút "Talk to Agent" tiêu chuẩn.
export const DASHBOARD_MORE_INSIGHTS_ENABLED = true;

// Nội dung nút (dynamic) — đổi nhãn/prompt ở một chỗ, không hardcode rải trong TopBar.
export const MORE_INSIGHTS = {
  label: "Talk to agent",
  // Prompt đẩy vào ô nhập của Manager Agent khi mở panel (pushAgentChatDraft).
  prompt: "Phân tích sâu giúp mình số liệu bán hàng hôm nay: hội thoại, đơn, doanh thu và sản phẩm bán chạy — đâu là điểm đáng chú ý và mình nên làm gì tiếp?",
};
