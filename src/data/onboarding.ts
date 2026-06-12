// Nội dung mẫu cho các bước Onboarding O1–O6. Mock toàn bộ.

export type DraftProduct = {
  id: string;
  name: string;
  price: number;
  description: string;
  imageHint: string; // mô tả ảnh (prototype không có ảnh thật)
};

// O2 — ví dụ "đầu vào thô" mà chủ shop dán vào, agent gom thành sản phẩm có cấu trúc.
export const SAMPLE_RAW_INPUT = `Sầu riêng Musanking 120k/kg, giống cao cấp Malaysia, cơm vàng dẻo béo, hạt lép.
Có ảnh chụp sản phẩm nền trắng. Hàng mới về, còn nhiều.`;

// Agent "trích" ra từ đoạn thô trên (mock kết quả NLP).
export const SAMPLE_EXTRACTED: DraftProduct = {
  id: "p-sau-rieng-musanking",
  name: "Sầu riêng Musanking",
  price: 120_000,
  description: "Cơm vàng đậm, dẻo, béo ngậy, hạt lép.",
  imageHint: "Ảnh sầu riêng nền trắng",
};

// O2 — sản phẩm agent TỰ QUÉT được từ trang đã nối (bài đăng/ảnh/album).
// Chủ shop chỉ duyệt (tick chọn), không phải nhập tay — đúng tinh thần G4a, auto-import.
export const SAMPLE_SUGGESTED_PRODUCTS: DraftProduct[] = [
  {
    id: "draft-sau-rieng-musanking",
    name: "Sầu riêng Musanking",
    price: 120_000,
    description: "Cơm vàng dẻo, béo ngậy, hạt lép.",
    imageHint: "Ảnh từ bài đăng 12/05",
  },
  {
    id: "draft-nho-queen",
    name: "Nho Queen",
    price: 85_000,
    description: "Nho đỏ không hạt, quả to, giòn, ngọt đậm.",
    imageHint: "Ảnh từ album Sản phẩm hot",
  },
  {
    id: "draft-cam-vang",
    name: "Cam Vàng",
    price: 30_000,
    description: "Mọng nước, ngọt thanh, nhiều vitamin C.",
    imageHint: "Ảnh từ bài đăng 28/05",
  },
  {
    // Agent gom được tên nhưng chưa đọc ra giá → item thiếu thông tin (cần chủ shop bổ sung).
    id: "draft-mang-cut",
    name: "Măng Cụt",
    price: 0,
    description: "Vị chua ngọt thanh mát, rất đặc trưng.",
    imageHint: "Ảnh từ link web — agent chưa đọc được giá",
  },
];

// Sản phẩm thiếu thông tin: chưa có giá hoặc chưa có mô tả → cần bổ sung trước khi bán.
export function isProductIncomplete(p: DraftProduct): boolean {
  return !p.price || !p.description.trim();
}

// O3 — preset giọng để chọn nhanh.
export const TONE_PRESETS = [
  "Thân thiện, chuyên nghiệp",
  "Nhiệt tình, gần gũi",
  "Lịch sự, ngắn gọn",
];

// O5 — nhà cung cấp khoá AI khi chọn dùng khoá riêng (BYOK, G1).
export const BYOK_PROVIDERS = ["Anthropic (Claude)", "OpenAI", "Google (Gemini)"];

// O6 — chat thử gọi /api/chat thật (persona "assistant"), không còn kịch bản trả lời mock.
// Xem src/components/onboarding/TestChatPanel.tsx.
