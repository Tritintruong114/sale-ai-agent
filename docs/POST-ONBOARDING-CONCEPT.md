---
type: prototype-concept
date: 2026-06-09
status: concept
tags: [prototype, fanpage, post-onboarding, mvp, ai-agents]
---

# Post-Onboarding Concept — "Agent đã bật, giờ gì?"

> Nguồn: `docs/ARCHITECTURE.md` + `toc-context/00-Index/Prototype-V0-Fanpage-Tasks.md` (V0).
> Phạm vi: **bề mặt vận hành hằng ngày M1–M6** — màn chủ shop dùng sau khi onboarding bật agent. Mọi dữ liệu **mock**, không API/không backend.
> Deliverable lần này: **concept + mock data**, không build màn. Mock tách theo màn ở `src/data/*.json`.
> Ký hiệu: **★** = điểm nhấn G3 hand-off first-class (phải nổi nhất khi demo). Trạng thái Hiện trạng: Đã có · Sửa · Mới.

---

## 1. Điểm vào sau onboarding

Wizard `/onboarding` (4 bước: shop → agent → products → Facebook) commit `agentEnabled: true` vào `agentConfigStore` rồi CTA sang **`/dashboard`**. Từ đây chủ shop ở trong app, dùng 6 màn hằng ngày. Toàn bộ 6 màn hiện là `ScreenPlaceholder` — doc này đặc tả nội dung cần dựng.

Nav đã chốt (`src/components/shell/nav.ts`): Dashboard (M4, mặc định) · Inbox (M1) · Quản lý đơn (M2) · Sản phẩm (M3) · Thanh toán (M5) · Cấu hình Agent (M6). Nhóm "Cài đặt": Nhắc tự động + Kênh (ngoài luồng demo).

## 2. Onboarding → App dùng chung config

Onboarding đặt giá trị lần đầu, các màn đọc lại từ `agentConfigStore` (nguồn sự thật chung, `src/data/config.ts`). Không lặp data.

| Config (trong `AgentConfig`) | Onboarding đặt | Màn đọc/ghi sau |
|---|---|---|
| `shopName`, `identity`, `channels`, `agentEnabled` | O1–O3, O6 | TopBar, M1, M6.4 |
| `autoCloseThreshold` (ngưỡng tự chốt) | mặc định 300.000đ | M2.2 đọc · M6.2 ghi |
| `handoffRules` (5 tình huống) | mặc định | M1.1 đọc · M6.3 ghi |
| `dailyLearning` (G2) | mặc định bật | M4 card · M6.1 ghi |
| `byok` (G1) | O5 bỏ qua được | TopBar badge · M6.5 ghi |
| `notifyChannels` | mặc định | M1 báo chủ shop · M6.6 ghi |

Config onboarding bỏ qua (O4 quy tắc auto, O5 BYOK) → chỉnh sau ở **M6**.

## 3. Map khác biệt G1–G8 → màn

| G | Khác biệt | Thể hiện ở màn |
|---|---|---|
| **G3** ★ | HITL chốt đơn first-class | M1.1 hand-off + M2.2 duyệt đơn lớn + M5 duyệt thanh toán |
| **G4a** | Agent gom sản phẩm từ ảnh/caption | M3 |
| **G8** | Bằng chứng kết quả thật | M4 báo cáo ngày + X2 bảng so sánh |
| **G2** | AI làm lõi (Manager đào tạo Consultant) | M6.1 học hằng ngày có duyệt + card ở M4 |
| **G1** | BYOK đa nhà cung cấp | Badge TopBar (`ByokBadge` — đã có) + M6.5 |

## 4. Bảng tính năng chi tiết — trạng thái demo

Demo: `[ ]` chưa làm · `[~]` đang dựng · `[x]` bấm qua được.

| # | Màn | Tính năng | Logic demo (mock) | Hiện trạng | Data file | Task |
|---|---|---|---|---|---|---|
| 1 | M1 Inbox | Hand-off 5 tình huống ★ | `handoff` trên hội thoại → badge ở list + banner lý do `role:system` trên ChatWindow; tái dùng `NotifyOwnerButton` đánh dấu đã nhận | Mới | `conversations.json` | M1.1 |
| 2 | M1 Inbox | Agent tư vấn nhiều khách cùng lúc | Cờ `agentActive` → chỉ báo "agent đang trả lời" + dải "Agent đang tư vấn N khách" | Mới | `conversations.json` | M1.2 |
| 3 | M1 Inbox | Lọc theo trạng thái + khung chat | StatusFilterChips; `ChatWindow`/`Composer`/`MessageBubble` | Đã có | `conversations.json` | — |
| 4 | M2 Đơn | Trục trạng thái Mới→Đang xử lý→Hoàn tất | `status` 3 cột; giữ `deliveryStatus` làm thuộc tính phụ; dời đơn qua cột (mock) | Mới | `orders.json` | M2.1 |
| 5 | M2 Đơn | Agent tự chốt nhỏ vs duyệt đơn lớn ★ | `total` < `autoCloseThreshold` → `approval:auto` ("Agent đã chốt"); ≥ → `pending` + nút Xác nhận/Từ chối | Mới | `orders.json` + `config.ts` | M2.2 |
| 6 | M2 Đơn | Đơn liên kết hội thoại nguồn | Bấm đơn → mở `conversationId` (X1) | Mới | `orders.json` | M2.2 |
| 7 | M3 SP | Agent gom ảnh/caption/ghi chú → SP | `rawSamples`: thô → `extracted` để duyệt/sửa → lưu | Mới | `products.json` | M3 |
| 8 | M3 SP | Danh sách SP + cảnh báo sắp hết | `catalog` + `stock`/`lowStock` badge | Mới | `products.json` | M3 |
| 9 | M4 Dashboard | "Cần làm hôm nay" | `todo` (hand-off / đơn lớn / thanh toán chờ) — bấm nhảy tới màn | Mới | `dashboard.json` | M4 |
| 10 | M4 Dashboard | Báo cáo ngày + KPI/volume/intent | `dailyReport`, `kpis`, `hourlyVolume`, `intentBreakdown`, `notableConversations` | Mới | `dashboard.json` | M4 |
| 11 | M4 Dashboard | Card "Agent đã học N điều" (G2) | `learnedToday` → bấm mở M6.1 | Mới | `dashboard.json` + `learning.json` | M6.1 |
| 12 | M5 TT | Cổng thanh toán | `queue.status` Chờ thanh toán → Đã thanh toán (mock) | Mới | `payments.json` | M5 |
| 13 | M5 TT | Chủ shop duyệt khâu nhạy cảm ★ | `needsApproval` (đơn lớn/hoàn tiền) → bước Duyệt; tái dùng `GateBadge`, `CaseActionButtons` | Mới | `payments.json` | M5 |
| 14 | M6 Cấu hình | Học hằng ngày + nhật ký có duyệt (G2) | `sources` toggle+đếm; `journal` nút Duyệt/Bỏ (HITL); dòng Manager cập nhật N mẫu | Mới | `learning.json` | M6.1 |
| 15 | M6 Cấu hình | Ngưỡng tự chốt đơn | Ô chỉnh `autoCloseThreshold` — nguồn sự thật cho M2.2 | Mới | `config.ts` | M6.2 |
| 16 | M6 Cấu hình | Cấu hình 5 tình huống hand-off | Bảng bật/tắt `handoffRules` + chỉnh ngưỡng — nguồn sự thật cho M1.1 | Mới | `config.ts` | M6.3 |
| 17 | M6 Cấu hình | Danh tính & giọng | Cùng nội dung O3, chỉnh lại bất cứ lúc nào | Mới | `config.ts` | M6.4 |
| 18 | M6 Cấu hình | Khoá AI / BYOK (G1) | Cùng O5; dùng khoá nền tảng hoặc đổi/thêm nhà cung cấp | Mới | `config.ts` | M6.5 |
| 19 | M6 Cấu hình | Thông báo & kênh báo chủ shop | Kênh nhận hand-off (Telegram/Zalo), chọn loại thông báo | Mới | `config.ts` | M6.6 |
| 20 | Xuyên suốt | Khung hybrid + điều hướng liên màn | Nút là chính, chat chỉ ở M1; deep-link Inbox→Đơn→Thanh toán→Dashboard | Sửa | — | X1 |
| 21 | Xuyên suốt | Bảng so sánh "có agent vs thủ công" | `comparison`: thời gian phản hồi, khách song song, đơn bỏ lỡ, giờ tiết kiệm | Mới | `dashboard.json` | X2 |
| 22 | Xuyên suốt | Badge "Chạy bằng khoá AI của bạn" (G1) | TopBar `ByokBadge` (đã có), đọc `byok.mode` | Đã có | `config.ts` | X2 |

## 5. Mock data — tách theo màn (`src/data/`)

Shape bám đúng type đã có trong code; enum không lệch. Config dùng chung (ngưỡng/hand-off/identity/BYOK/notify) **không** lặp lại trong JSON — đọc từ `config.ts`.

| File | Màn | Shape chính | Bám type |
|---|---|---|---|
| `conversations.json` | M1 | `conversations[]`: `id, customerName, channel, status, agentActive, handoff{key,reason,acknowledged}\|null, unread, lastMessageAt, orderId?, messages[]` | `ChatMessage` (`MessageBubble.tsx`), `HandoffKey` (`config.ts`) |
| `orders.json` | M2 | `orders[]`: `id, conversationId, customerName, status, deliveryStatus, total, approval, items[], createdAt` | `autoCloseThreshold` (`config.ts`) |
| `products.json` | M3 | `rawSamples[]{rawText,extracted}` + `catalog[]{...,stock,lowStock}` | `DraftProduct` (`onboarding.ts`) |
| `dashboard.json` | M4 | `todo, dailyReport, notableConversations[], kpis[], hourlyVolume[], intentBreakdown[], learnedToday, comparison` | `PENDING_COUNTS` (`counts.ts`) |
| `payments.json` | M5 | `queue[]`: `id, orderId, customerName, amount, status, needsApproval, reason` | — |
| `learning.json` | M6.1 | `enabled, runAt, sources[], journal[]{insight,status}, managerUpdates` | `LearningSource` (`config.ts`) |

Nhất quán ID chéo file (deep-link X1): `c-002` (Inbox) ↔ `o-002` (Đơn) ↔ `pay-001` (Thanh toán). Counts khớp: hand-off 3 · đơn lớn 2 · thanh toán 1.

## 6. Thứ tự dựng

1. **M4 Dashboard** — tab mặc định, đích CTA onboarding; "cần làm hôm nay" là trục điều hướng.
2. **M1 Inbox** — điểm nhấn G3 hand-off (★), tái dùng ChatWindow.
3. **M2 Quản lý đơn** — trục trạng thái + logic ngưỡng (cần M2.1 trước M2.2).
4. **M5 Thanh toán** — gate HITL, nối tiếp đơn lớn từ M2.
5. **M3 Sản phẩm** — agent gom (G4a).
6. **M6 Cấu hình** — 6 tab, nguồn sự thật cho M1.1/M2.2.
7. **X1** deep-link/happy-path xuyên màn → **X2** bảng so sánh.

## 7. Ngoài scope (để version sau)

Hồ sơ khách hàng đầy đủ + lịch sử chăm sóc · đa ngôn ngữ · tùy chỉnh trạng thái chuyên sâu · giao diện tự sinh theo ngữ cảnh · first-run/activation bridge (đã bỏ theo chốt) · tab Nhắc tự động + Kênh (đã có, nhóm "Cài đặt", ngoài luồng demo).
