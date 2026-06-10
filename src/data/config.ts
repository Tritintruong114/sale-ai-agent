// Nguồn sự thật chung cho cấu hình agent.
// Onboarding (O) đặt giá trị lần đầu; M6 chỉnh; M1/M2 đọc để chạy logic.

export type HandoffKey =
  | "want_buy" // khách muốn mua → dấu hiệu chốt đơn (G3)
  | "complaint" // khách phàn nàn
  | "out_of_script" // câu hỏi ngoài kịch bản
  | "discount" // khách xin giảm giá
  | "over_threshold"; // đơn vượt ngưỡng giá trị

export type HandoffRule = {
  key: HandoffKey;
  label: string;
  enabled: boolean;
  threshold?: number; // % giảm giá hoặc mốc giá trị, tuỳ tình huống
};

export type LearningSource = {
  key: string;
  label: string;
  enabled: boolean;
  count: number;
};

export type AgentConfig = {
  shopName: string;
  shopType: ("online" | "store")[]; // bán online và/hoặc có cửa hàng (chọn nhiều, có thể rỗng)
  shopAddress?: string; // khi có cửa hàng
  shopPhone?: string; // số điện thoại liên hệ (khi có cửa hàng)
  channels: { fbConnected: boolean; zaloConnected: boolean; pageName?: string };
  identity: {
    name: string;
    pronoun: string;
    tone: string;
    bannedWords: string[];
    greeting: string;
    avatar?: string; // ảnh đại diện agent (object URL ở prototype)
  };
  autoCloseThreshold: number; // đơn dưới ngưỡng → agent tự chốt (M2.2)
  handoffRules: HandoffRule[]; // 5 tình huống (M1.1)
  dailyLearning: { enabled: boolean; runAt: string; sources: LearningSource[] }; // G2
  byok: { mode: "platform" | "own"; providers: string[] }; // G1
  notifyChannels: { telegram: boolean; zalo: boolean; events: string[] };
  agentEnabled: boolean; // bật sau onboarding (O6)
};

export const DEFAULT_CONFIG: AgentConfig = {
  shopName: "Shop Mỹ Phẩm An An",
  shopType: ["online"],
  shopAddress: "",
  shopPhone: "",
  channels: { fbConnected: true, zaloConnected: false, pageName: "Shop Mỹ Phẩm An An" },
  identity: {
    name: "Trợ lý An An",
    pronoun: "em",
    tone: "thân thiện, chuyên nghiệp",
    bannedWords: ["rẻ vô địch", "cam kết 100%"],
    greeting: "Dạ em chào anh/chị, em có thể tư vấn gì cho mình ạ?",
  },
  autoCloseThreshold: 300_000,
  handoffRules: [
    { key: "want_buy", label: "Khách muốn mua (dấu hiệu chốt đơn)", enabled: true },
    { key: "complaint", label: "Khách phàn nàn", enabled: true },
    { key: "out_of_script", label: "Câu hỏi ngoài kịch bản", enabled: true },
    { key: "discount", label: "Khách xin giảm giá", enabled: true, threshold: 15 },
    { key: "over_threshold", label: "Đơn vượt ngưỡng giá trị", enabled: true, threshold: 300_000 },
  ],
  dailyLearning: {
    enabled: true,
    runAt: "22:00",
    sources: [
      { key: "closed_today", label: "Hội thoại đã chốt hôm nay", enabled: true, count: 12 },
      { key: "owner_edits", label: "Lần chủ shop sửa câu trả lời", enabled: true, count: 3 },
      { key: "handoff_done", label: "Case hand-off đã xử lý", enabled: true, count: 5 },
      { key: "new_products", label: "Sản phẩm mới thêm", enabled: false, count: 2 },
    ],
  },
  byok: { mode: "platform", providers: [] },
  notifyChannels: { telegram: true, zalo: false, events: ["handoff", "big_order"] },
  agentEnabled: true,
};
