import { PlaygroundScreen } from "@/components/agent-config/PlaygroundScreen";

// Màn "Đào tạo Agent" — tách riêng khỏi Cấu hình Agent. Hai tab trên topbar:
// "Đào tạo" (sân thử chat) và "Lịch sử" (bảng nhật ký các lần đào tạo).
export default function PlaygroundPage() {
  return <PlaygroundScreen />;
}
