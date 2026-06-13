import { HaravanIcon, KiotVietIcon, SapoIcon } from "@/components/icons/crm";

// Hệ thống CRM / quản lý bán hàng (§Kết nối) — meta dùng chung cho màn CrmSettings và modal kết nối.
// Cơ chế kết nối KHÁC nhau theo nền tảng (research Open API thực tế), nên auth tách 2 kiểu:
//   • apikey — người dùng tự lấy Client ID/Secret từ trang quản trị rồi dán vào (KiotViet: client_credentials).
//   • oauth  — bấm là chuyển sang trang nền tảng, đăng nhập + duyệt quyền rồi callback (Haravan, Sapo public app).

export type CrmKey = "kiotviet" | "sapo" | "haravan";

// Một bước hướng dẫn trong modal apikey (lấy key ở đâu) — link tùy chọn ở giữa câu.
export type SetupStep = { before: string; link?: { label: string; href: string }; after?: string };

// Một ô nhập trong modal apikey.
export type CrmField = { key: string; label: string; placeholder: string; secret?: boolean };

export type CrmAuth =
  | { type: "apikey"; fields: CrmField[]; steps: SetupStep[] }
  | { type: "oauth"; authority: string; scopes: string[] };

export type Crm = {
  key: CrmKey;
  name: string;
  hint: string; // mô tả app cho chủ shop dễ hiểu (không jargon kỹ thuật) — hiện trên tile
  icon: (props: { className?: string }) => React.ReactNode;
  auth: CrmAuth;
};

export const CRMS: Crm[] = [
  {
    key: "kiotviet",
    name: "KiotViet",
    hint: "Quản lý bán hàng",
    icon: KiotVietIcon,
    // KiotViet Public API: OAuth2 client_credentials — không có màn duyệt quyền, người dùng tự lấy
    // Client ID/Secret/Retailer trong Thiết lập kết nối API rồi dán vào.
    auth: {
      type: "apikey",
      steps: [
        { before: "Đăng nhập KiotViet → Thiết lập cửa hàng → ", link: { label: "Thiết lập kết nối API", href: "https://www.kiotviet.vn/huong-dan-su-dung-public-api-retail/" } },
        { before: "Copy Client ID, Client Secret và Retailer (tên gian hàng)" },
        { before: "Dán vào đây và kết nối" },
      ],
      fields: [
        { key: "clientId", label: "Client ID", placeholder: "vd: a1b2c3d4-…" },
        { key: "clientSecret", label: "Client Secret", placeholder: "••••••••••••", secret: true },
        { key: "retailer", label: "Retailer (tên gian hàng)", placeholder: "vd: shoptraicayanan" },
      ],
    },
  },
  {
    key: "sapo",
    name: "Sapo",
    hint: "Bán hàng đa kênh",
    icon: SapoIcon,
    // Sapo Open API (public app) theo chuẩn giống Shopify: OAuth2 authorization code + cửa sổ duyệt quyền.
    auth: {
      type: "oauth",
      authority: "accounts.sapo.vn",
      scopes: ["Đọc & ghi Sản phẩm", "Đọc & ghi Đơn hàng", "Đọc Khách hàng", "Quản lý tồn kho"],
    },
  },
  {
    key: "haravan",
    name: "Haravan",
    hint: "Website bán hàng online",
    icon: HaravanIcon,
    // Haravan Platform API: OAuth2 authorization code / hybrid flow chuẩn — redirect + màn duyệt quyền + webhook real-time.
    auth: {
      type: "oauth",
      authority: "accounts.haravan.com",
      scopes: ["Đọc & ghi Sản phẩm", "Đọc & ghi Đơn hàng", "Đọc Khách hàng", "Webhook tồn kho & đơn real-time"],
    },
  },
];

export const CRM_BY_KEY: Record<CrmKey, Crm> = Object.fromEntries(CRMS.map((c) => [c.key, c])) as Record<CrmKey, Crm>;

// Tiền tố mã đơn mỗi nền tảng cấp khi app đẩy đơn sang (mock, theo quy ước đặt mã thường gặp).
export const CRM_ORDER_PREFIX: Record<CrmKey, string> = { kiotviet: "KV", sapo: "SO", haravan: "HVN" };

// Mã đơn ngoài mà CRM trả về khi tạo đơn — tất định từ orderId (FNV-1a) để hydrate ổn định (§nguyên tắc 4),
// không random. Vd order "o-007" + KiotViet → "KV-48217".
export function crmOrderCode(crmKey: CrmKey, orderId: string): string {
  let h = 2166136261;
  for (let i = 0; i < orderId.length; i++) {
    h ^= orderId.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return `${CRM_ORDER_PREFIX[crmKey]}-${10000 + ((h >>> 0) % 90000)}`;
}
