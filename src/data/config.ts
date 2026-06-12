// Nguồn sự thật chung cho cấu hình agent.
// Onboarding (O) đặt giá trị lần đầu; M6 chỉnh; M1/M2 đọc để chạy logic.

// Key dựng sẵn; rule do chủ shop tự thêm dùng key tự sinh nên kiểu là string.
export type HandoffKey =
  | "want_buy" // khách muốn mua → dấu hiệu chốt đơn (G3)
  | "complaint" // khách phàn nàn
  | "out_of_script" // câu hỏi ngoài kịch bản
  | "discount"; // khách xin giảm giá

export type HandoffRule = {
  key: string; // built-in: HandoffKey; custom: tự sinh từ nhãn
  label: string;
  description: string; // một câu: agent dừng khi nào
  triggerPhrases: string[]; // ví dụ câu khách nói — chủ shop sửa được
  enabled: boolean;
  threshold?: number; // % giảm giá hoặc mốc giá trị, tuỳ tình huống
  thresholdUnit?: "%" | "đ"; // đơn vị hiển thị cạnh ô threshold
  custom?: boolean; // true = chủ shop tự thêm (cho phép xoá)
};

export type LearningSource = {
  key: string;
  label: string;
  enabled: boolean;
  count: number;
};

// Hồ sơ nghiệp vụ shop — kiến thức agent đọc để tư vấn khách (giờ, giao hàng, chính sách, FAQ…).
// Nạp vào system prompt qua buildBusinessContext (src/lib/shopContext.ts).
export type WeekdayKey = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";
export type DayHours = { closed: boolean; open: string; close: string }; // "08:00"
export type FaqItem = { id: string; question: string; answer: string };
export type PromoItem = { id: string; title: string; detail: string };

export type BusinessProfile = {
  intro: string; // giới thiệu shop / điều khách nên biết
  commitments: string[]; // cam kết / điểm mạnh (mỗi dòng một ý)
  hours: { note?: string; weekly: Record<WeekdayKey, DayHours> };
  shipping: {
    areas: string; // khu vực giao
    fee: string; // mô tả phí ship (free text — đa dạng theo khu vực)
    freeshipThreshold?: number; // freeship khi đơn từ X (đ)
    leadTime: string; // thời gian giao dự kiến
    carriers: string[]; // đơn vị vận chuyển
  };
  // COD / chuyển khoản / ví… + chính sách cọc với đơn lớn (bật/tắt, ngưỡng đơn, % cọc).
  payment: { methods: string[]; deposit: { enabled: boolean; threshold?: number; percent?: number } };
  returnPolicy: string; // đổi trả
  warrantyPolicy: string; // bảo hành
  promotions: PromoItem[];
  faq: FaqItem[];
};

// Thứ tự + nhãn tiếng Việt cho 7 ngày — dùng chung cho UI và lúc dựng ngữ cảnh cho agent.
export const WEEKDAYS: { key: WeekdayKey; label: string }[] = [
  { key: "mon", label: "Thứ 2" },
  { key: "tue", label: "Thứ 3" },
  { key: "wed", label: "Thứ 4" },
  { key: "thu", label: "Thứ 5" },
  { key: "fri", label: "Thứ 6" },
  { key: "sat", label: "Thứ 7" },
  { key: "sun", label: "Chủ nhật" },
];

export type AgentConfig = {
  shopName: string;
  shopType: ("online" | "store")[]; // bán online và/hoặc có cửa hàng (chọn nhiều, có thể rỗng)
  shopAddress?: string; // khi có cửa hàng
  shopPhone?: string; // số điện thoại liên hệ (khi có cửa hàng)
  businessProfile?: BusinessProfile; // hồ sơ nghiệp vụ — optional để config cũ trong localStorage không vỡ
  channels: { fbConnected: boolean; zaloConnected: boolean; pageName?: string };
  identity: {
    name: string;
    pronoun: string;
    tone: string;
    bannedWords: string[];
    greeting: string;
    avatar?: string; // ảnh đại diện agent (object URL ở prototype)
    // Giờ agent tự trả lời khách. Bật = chỉ trực trong khung giờ đã đặt, ngoài giờ tự Tạm ngưng.
    // Tắt = trực cả ngày (chỉ theo agentEnabled). Optional để config cũ trong localStorage không vỡ.
    activeHours?: { enabled: boolean; weekly: Record<WeekdayKey, DayHours> };
  };
  handoffRules: HandoffRule[]; // tình huống bàn giao (M1.1)
  dailyLearning: { enabled: boolean; runAt: string; sources: LearningSource[] }; // G2
  byok: { mode: "platform" | "own"; providers: string[] }; // G1
  // telegram/zalo = đã nối hay chưa; *Token = bot token dùng gửi tin (Telegram BotFather / Zalo access token) — optional để config cũ không vỡ.
  notifyChannels: { telegram: boolean; zalo: boolean; telegramToken?: string; zaloToken?: string; events: string[] };
  agentEnabled: boolean; // bật sau onboarding (O6)
};

export const DEFAULT_CONFIG: AgentConfig = {
  shopName: "Shop Trái Cây An An",
  shopType: ["online"],
  shopAddress: "",
  shopPhone: "",
  businessProfile: {
    intro:
      "Shop Trái Cây An An chuyên trái cây tươi nhập khẩu & nội địa, mâm ngũ quả cúng lễ và giỏ quà trái cây biếu tặng. Tư vấn chọn trái cây theo nhu cầu ăn, biếu hoặc cúng; mâm và giỏ quà nhận đặt trước.",
    commitments: [
      "Trái cây tươi chọn lọc mỗi ngày, đổi ngay nếu hư dập khi nhận",
      "Mâm cúng & giỏ quà đặt trước 1–2 ngày, trang trí theo dịp",
      "Đóng gói giữ tươi cẩn thận, giao nhanh nội thành",
    ],
    hours: {
      note: "Mâm cúng và giỏ quà vui lòng đặt trước 1–2 ngày để shop chuẩn bị, trang trí.",
      weekly: {
        mon: { closed: false, open: "07:00", close: "21:00" },
        tue: { closed: false, open: "07:00", close: "21:00" },
        wed: { closed: false, open: "07:00", close: "21:00" },
        thu: { closed: false, open: "07:00", close: "21:00" },
        fri: { closed: false, open: "07:00", close: "21:00" },
        sat: { closed: false, open: "07:00", close: "21:30" },
        sun: { closed: false, open: "07:00", close: "21:30" },
      },
    },
    shipping: {
      areas: "Giao toàn quốc. Nội thành Hà Nội & các thành phố lớn giao nhanh trong ngày.",
      fee: "Nội thành 25.000đ, tỉnh tính theo đơn vị vận chuyển.",
      freeshipThreshold: 500_000,
      leadTime: "Nội thành 2–4 giờ, tỉnh 1–3 ngày tuỳ khu vực.",
      carriers: ["Giao Hàng Nhanh", "Viettel Post", "Shipper nội thành"],
    },
    payment: {
      methods: ["COD (nhận hàng trả tiền)", "Chuyển khoản ngân hàng", "Ví MoMo / ZaloPay"],
      deposit: { enabled: true, threshold: 500_000, percent: 50 },
    },
    returnPolicy:
      "Khách kiểm tra hàng khi nhận. Trái cây hư, dập hoặc giao sai được đổi/hoàn trong ngày — gửi ảnh để shop xử lý nhanh.",
    warrantyPolicy:
      "Cam kết trái cây tươi, đúng mô tả và đủ cân. Nếu chất lượng không như cam kết, shop đổi đơn mới hoặc hoàn tiền.",
    promotions: [
      { id: "promo-1", title: "Freeship đơn từ 500K", detail: "Áp dụng toàn quốc, không cần mã." },
      { id: "promo-2", title: "Giảm 10% mâm cúng đặt sớm", detail: "Đặt mâm trước 2 ngày được giảm 10%." },
    ],
    faq: [
      { id: "faq-1", question: "Trái cây có tươi không, nhập ngày nào?", answer: "Dạ shop nhập trái cây mới mỗi ngày, anh/chị nhận được hàng tươi trong ngày ạ." },
      { id: "faq-2", question: "Đặt mâm cúng / giỏ quà cần báo trước bao lâu?", answer: "Dạ mâm và giỏ quà mình đặt trước 1–2 ngày để shop chuẩn bị, trang trí đẹp ạ." },
      { id: "faq-3", question: "Có giao tỉnh không, bao lâu nhận được?", answer: "Dạ shop giao toàn quốc, nội thành 2–4 giờ, tỉnh 1–3 ngày tuỳ khu vực ạ." },
      { id: "faq-4", question: "Được kiểm tra hàng khi nhận không?", answer: "Dạ có, anh/chị đồng kiểm khi nhận; trái cây hư dập shop đổi hoặc hoàn ngay ạ." },
    ],
  },
  channels: { fbConnected: true, zaloConnected: false, pageName: "Shop Trái Cây An An" },
  identity: {
    name: "Trợ lý An An",
    pronoun: "em",
    tone: "thân thiện, chuyên nghiệp",
    bannedWords: ["rẻ vô địch", "cam kết 100%"],
    greeting: "Dạ em chào anh/chị, em có thể tư vấn gì cho mình ạ?",
    activeHours: {
      enabled: false,
      weekly: {
        mon: { closed: false, open: "08:00", close: "22:00" },
        tue: { closed: false, open: "08:00", close: "22:00" },
        wed: { closed: false, open: "08:00", close: "22:00" },
        thu: { closed: false, open: "08:00", close: "22:00" },
        fri: { closed: false, open: "08:00", close: "22:00" },
        sat: { closed: false, open: "08:00", close: "22:00" },
        sun: { closed: false, open: "08:00", close: "22:00" },
      },
    },
  },
  handoffRules: [
    {
      key: "want_buy",
      label: "Khách muốn mua (dấu hiệu chốt đơn)",
      description: "Khách thể hiện ý định mua rõ ràng",
      triggerPhrases: [
        "chốt đơn cho mình nhé",
        "ship về cho mình với",
        "mình lấy cái này",
        "cho mình đặt một cái",
        "còn hàng mình lấy luôn",
        "mình mua, gửi địa chỉ nhé",
      ],
      enabled: true,
    },
    {
      key: "complaint",
      label: "Khách phàn nàn",
      description: "Khách tỏ ý không hài lòng về sản phẩm, giao hàng hoặc dịch vụ",
      triggerPhrases: [
        "hàng bị lỗi rồi shop ơi",
        "giao sai mẫu mình đặt",
        "sản phẩm không giống hình",
        "mình muốn đổi trả hàng",
        "đặt mấy hôm chưa thấy giao",
        "shop làm ăn kiểu gì vậy",
      ],
      enabled: true,
    },
    {
      key: "discount",
      label: "Khách xin giảm giá",
      description: "Khách xin giảm vượt mức bạn cho phép.",
      triggerPhrases: [
        "giảm thêm cho mình đi",
        "bớt chút nữa được không shop",
        "có mã giảm giá không",
        "mua hai cái có giảm không",
        "sale mạnh hơn được không",
        "freeship cho mình nhé",
      ],
      enabled: true,
      threshold: 15,
      thresholdUnit: "%",
    },
    {
      key: "out_of_script",
      label: "Khách hỏi ngoài kịch bản",
      description: "Câu hỏi nằm ngoài những gì agent đã được học.",
      triggerPhrases: [
        "sản phẩm này dùng cho da nhạy cảm được không?",
        "shop xuất hoá đơn đỏ được không?",
        "có ship đi nước ngoài không?",
        "mua sỉ thì giá thế nào?",
        "bảo hành được bao lâu vậy shop?",
        "sản phẩm này dùng cho bé được không?",
      ],
      enabled: true,
    },
  ],
  dailyLearning: {
    enabled: true,
    runAt: "22:00",
    sources: [
      { key: "closed_today", label: "Hội thoại đã chốt hôm nay", enabled: true, count: 12 },
      { key: "owner_edits", label: "Câu trả lời bạn đã sửa", enabled: true, count: 3 },
      { key: "handoff_done", label: "Hội thoại đã bàn giao", enabled: true, count: 5 },
      { key: "new_products", label: "Sản phẩm mới thêm", enabled: false, count: 2 },
    ],
  },
  byok: { mode: "platform", providers: [] },
  notifyChannels: { telegram: true, zalo: false, telegramToken: "7821456390:AAH9k2L_mockBotTokenForPrototype", events: ["handoff", "big_order"] },
  agentEnabled: true,
};
