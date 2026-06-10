# Fanpage AI Agent — Kiến trúc Prototype V0

> Nguồn: `toc-context/00-Index/Roadmap-Agent-App-Concept.md` + `Prototype-V0-Fanpage-Tasks.md`.
> Phạm vi: prototype V0 — bấm qua được các màn, **dữ liệu mock toàn bộ**, không API/không backend.
> Mục tiêu demo: minh hoạ trọn luồng bán hàng có agent, làm nổi 3 khác biệt **G1/G2/G3**.
> Ký hiệu: **★** = điểm nhấn G3 hand-off first-class (phải nổi nhất khi demo).

---

## 1. Stack & quyết định kỹ thuật

| Hạng mục | Chọn | Lý do |
|---|---|---|
| Framework | Next.js 16 (App Router, TS, Tailwind) | đã scaffold |
| UI primitives | shadcn/ui | có sẵn Button/Dialog/Tabs/Stepper… hợp Tailwind |
| State | Zustand | nguồn sự thật chung cho config (Onboarding ⇄ M6 ⇄ M1/M2) |
| Data | mock `.ts` trong `src/data/` | không API |
| Điều hướng | route-based 6 màn + deep-link qua query param | happy-path bấm xuyên (X1) |

**Nguyên tắc xuyên suốt (bám roadmap):**
1. Hybrid: thao tác bằng **nút là chính**; chat **chỉ** ở M1 và O6.
2. Khâu nhạy rủi ro (thanh toán, đơn lớn, sửa dữ liệu) **luôn giữ nút + người duyệt**.
3. Mọi "agent tự động làm X" phải có **bề mặt GUI để thấy + chỉnh + duyệt** (gom ở M6).

---

## 2. Cấu trúc thư mục

```
src/
├─ app/
│  ├─ layout.tsx                 # AppShell (SideNav + TopBar)
│  ├─ page.tsx                   # redirect → /dashboard (tab mặc định)
│  ├─ onboarding/page.tsx        # O — wizard (ngoài shell)
│  ├─ inbox/page.tsx             # M1
│  ├─ orders/page.tsx            # M2
│  ├─ products/page.tsx          # M3
│  ├─ dashboard/page.tsx         # M4
│  ├─ payments/page.tsx          # M5
│  └─ agent-config/page.tsx      # M6 (tabs)
├─ components/
│  ├─ ui/        # Lớp 0 — primitives (shadcn)
│  ├─ shell/     # Lớp 1 — AppShell, SideNav, TopBar, ByokBadge
│  ├─ shared/    # Lớp 2 — ChatWindow, HandoffBadge, GateBadge…
│  ├─ inbox/  orders/  products/  dashboard/  payments/
│  ├─ agent-config/
│  └─ onboarding/
├─ store/
│  └─ agentConfigStore.ts        # nguồn sự thật chung
└─ data/
   ├─ conversations.ts  ops.ts  hitl.ts  products.ts
   ├─ dashboard.ts  payments.ts  learning.ts
   ├─ config.ts                  # default config (O4 set, M6 chỉnh)
   └─ onboarding.ts
```

---

## 3. Nguồn sự thật chung — `agentConfigStore`

Onboarding đặt giá trị lần đầu (kèm mặc định) → M6 chỉnh bất cứ lúc nào → M1/M2 đọc để chạy logic.
Một object duy nhất, không nhân đôi logic.

```ts
type AgentConfig = {
  channels:        { fbConnected: boolean; zaloConnected: boolean; pageName?: string }
  identity:        { name; pronoun; tone; bannedWords[]; greeting }
  autoCloseThreshold: number          // M2.2 đọc — đơn dưới ngưỡng agent tự chốt
  handoffRules:    { key; enabled; threshold? }[]   // 5 tình huống — M1.1 đọc
  dailyLearning:   { enabled; runAt; sources[] }     // G2
  byok:            { mode: 'platform' | 'own'; providers[] }  // G1, skip được
  notifyChannels:  { telegram?; zalo?; events[] }
}
```

| Config | Onboarding | M6 tab | Feature dùng |
|---|---|---|---|
| Kênh | O1 | Kênh | M1 nguồn hội thoại + báo chủ shop |
| Danh tính & giọng | O3 | M6.4 | M1 |
| Ngưỡng tự chốt | O4 (mặc định) | M6.2 | **M2.2** |
| Hand-off (5 tình huống) ★ | O4 (mặc định) | M6.3 | **M1.1** |
| Học hằng ngày | mặc định bật | M6.1 | G2 |
| Khoá AI (BYOK) | O5 (skip) | M6.5 | G1 (badge) |
| Thông báo | sau | M6.6 | hand-off báo về đâu |

---

## 4. Danh mục components (đều **Mới** trong repo này)

### Lớp 0 — UI primitives (shadcn)
Button · Badge · Card · Dialog · Tabs · Stepper · Switch · Input · Textarea · Select · Toast

### Lớp 1 — Shell (task M0)
| Component | Vai trò |
|---|---|
| `AppShell` | layout chung |
| `SideNav` | M1–M5 + M6, nhóm "Cài đặt" (Nudge/Channels); Dashboard mặc định |
| `TopBar` | tiêu đề màn + `ByokBadge` "Chạy bằng khoá AI của bạn" (G1) |
| `NavBadgeCount` | số việc chờ trên mục nav |

### Lớp 2 — Dùng chung nhiều màn
| Component | Dùng ở |
|---|---|
| `ChatWindow` `Composer` `MessageBubble` `ProductImageBubble` | M1, O6 |
| `HandoffBadge` ★ `HandoffBanner` ★ `NotifyOwnerButton` ★ | M1, M2, M4 |
| `StatusFilterChips` | M1, M2 |
| `GateBadge` `CaseActionButtons` | M5 |
| `ThresholdInput` | O4, M6.2/6.3 |
| `EmptyState` `ConfirmDialog` | mọi màn |

### Lớp 3 — Theo màn
- **M1 Inbox** — `ConversationList` · `ConversationListItem`(+HandoffBadge) · `AgentLiveStrip` ("Agent đang tư vấn N khách") · `OrderSidePanel`
- **M2 Đơn** — `OrderBoard`(Mới→Đang xử lý→Hoàn tất) · `OrderCard` · `AutoCloseTag` · `BigOrderApproval` ★ · link→hội thoại nguồn
- **M3 SP** — `RawInputPanel`(textarea+ảnh) · `AgentExtractCard` ★(duyệt/sửa) · `ProductList` · `LowStockBadge`
- **M4 Dashboard** — `TodayTasksCard`(bấm→nhảy màn) · `DailyReportCard` · `KPICard` · `HourlyVolumeCard` · `IntentBreakdownCard` · `LearningSummaryCard`(G2) · `AgentVsManualTable` ★(X2)
- **M5 TT** — `PaymentGateCard` · `ReviewQueueList` · `CaseContextPanel`(+gate `payment`)
- **M6** — `AgentConfigTabs`: `DailyLearningTab` ★(G2,HITL) · `AutoCloseThresholdTab` · `HandoffRulesTab` · `IdentityVoiceTab` · `ByokTab`(G1) · `NotifyChannelTab`
- **O** — `OnboardingWizard` (2 luồng, stepper tuyến tính, data-driven theo mã bước) + steps: `StepConnectChannel` · `StepReviewProducts`(agent tự quét → duyệt) · `StepIdentityVoice`(=M6.4) · `StepAutoRules`(=M6.2+6.3) · `StepByok`(=M6.5) · `StepTestAndEnable` ★(modal chat center). Xem 5.2.

---

## 5. Các luồng UI/UX

### 5.1 Happy-path xuyên màn (X1) — luồng demo chính
```
Khách nhắn FB/Zalo
  → M1 Inbox (agent tư vấn N khách song song)
      ├─ đơn nhỏ, đủ info ─────────────→ M2 (Agent đã chốt)
      └─ ★ 5 tình huống / dấu chốt đơn → HAND-OFF báo chủ shop
            → M2 đơn lớn [Xác nhận]/[Từ chối]
              → M5 Thanh toán (cổng + chủ shop duyệt khâu nhạy cảm)
                → M4 Dashboard (cần làm hôm nay + báo cáo ngày)
```
Deep-link giữa các bước qua query param (`?focus=<id>`).

### 5.2 Onboarding (O) — 4 bước tuyến tính + provisioning + ready
Luồng V0 (đã chốt lại): **Tạo shop → Tạo agent → Thêm sản phẩm → Kết nối Facebook**, rồi
**Hoàn tất** → màn provisioning (các dòng "Creating your shop/agent…" lần lượt) → màn **Sẵn sàng**
có nút **Chat thử** (mở chat dialog, đã cài 1 nhịp hand-off ★) + CTA Dashboard.
- **Tạo shop:** tên shop (`shopName` — thêm vào config).
- **Tạo agent:** tên · tông giọng · xưng hô (bỏ lời chào/từ cấm — dùng mặc định, chỉnh ở M6) + xem trước động.
- **Thêm sản phẩm:** chọn nguồn — tải **tài liệu/ảnh/bảng tính (xlsx,csv)** hoặc **URL** → agent gom → duyệt (auto-import G4a).
- **Kết nối Facebook:** mock OAuth; có thể nối thêm Zalo OA.
- Ngưỡng tự chốt · hand-off · BYOK · kênh báo: **không nằm trong onboarding nữa**, dùng mặc định và chỉnh ở M6.
Components: `OnboardingWizard` (3 phase wizard/provisioning/ready) · `StepCreateShop` · `StepCreateAgent` ·
`StepProducts` · `StepConnectChannel` · `ProvisioningScreen` · `TestChatDialog`.

#### (Cũ) 2 luồng value-first — đã thay bằng 4 bước ở trên
Triết lý: **đưa shop đến "agent đang trả lời" nhanh nhất**, hoãn mọi cấu hình không bắt buộc.
Refactor từ bản 6-bước-tuyến-tính (bị đánh giá chưa thân thiện: bắt làm việc nặng & quyết định khó
trước khi thấy giá trị).

- **Luồng nhanh (mặc định) — 3 bước:**
  1. **Kết nối kênh** — nối FB/Zalo (mock OAuth). Nối xong, agent quét trang ở nền.
  2. **Duyệt sản phẩm** — mặc định **chưa có sản phẩm nào**. Ô **nguồn quét (URL)** điền sẵn trang
     vừa nối; user dán link trang/bài đăng/album rồi bấm **Quét** để agent gợi ý. Sau khi quét, danh
     sách SP chọn sẵn tất cả, chủ shop chỉ **bỏ tick** mục không bán. Không bắt nhập tay (auto-import,
     G4a). Thêm thủ công là phụ.
  3. **Chạy thử & bật** — modal chat giữa màn, chat thật (giọng + SP vừa cài), cài sẵn 1 nhịp
     hand-off ★ G3 → Bật agent → checklist → CTA Dashboard.
  - Giọng · ngưỡng tự chốt · hand-off · BYOK = **mặc định thông minh**, chỉnh sau ở M6.
- **Luồng đầy đủ (tùy chọn)** — link "Thiết lập chi tiết" chèn thêm 3 bước cấu hình
  (Giọng O3 · Quy tắc tự động O4 · Khoá AI O5) giữa Duyệt SP và Chạy thử. Chuyển qua lại giữ
  nguyên bước & bản nháp.

Cả hai luồng ghi cùng `agentConfigStore`. Wizard data-driven: `QUICK_FLOW`/`FULL_FLOW` là mảng mã
bước, `ALL_STEPS` map mã → component + điều kiện `canNext`.

### 5.3 Hand-off G3 (★ điểm nhấn)
Badge "cần người" trên list → banner lý do đầu chat → `NotifyOwnerButton` → xuất hiện ở `TodayTasksCard`.
Khác biệt rõ nhất vs đối thủ (họ bàn giao thủ công) — người xem phải thấy ngay, không cần giải thích.

### 5.4 Học hằng ngày G2 (HITL)
Card "Agent đã học N điều hôm nay" (Dashboard) → M6 tab Học → nhật ký từng điều → [Duyệt]/[Bỏ]
→ Manager Agent cập nhật mẫu trả lời.

### 5.5 Hybrid xuyên suốt
Nút là chính ở mọi màn; chat chỉ ở M1 + O6. Khâu nhạy rủi ro giữ nút + người duyệt.

---

## 6. Thứ tự dựng

| # | Mốc | Nội dung | Chặn |
|---|---|---|---|
| 1 | **M0** | shadcn + Zustand + AppShell/SideNav/TopBar + 6 routes + store + mock data | chặn tất cả |
| 2 | **M1 ★** | Inbox + hand-off 5 tình huống + agent live strip | — |
| 3 | **M2** | Order board 3 cột + ngưỡng tự chốt + link hội thoại | cần M1 |
| 4 | **M5** | Cổng thanh toán + duyệt HITL | cần M2 |
| 5 | **M3** | Agent gom SP từ ảnh/caption | — |
| 6 | **M4** | Cần làm hôm nay + báo cáo ngày + X2 bảng so sánh | cần M1/M2/M5 |
| 7 | **M6** | 6 tab cấu hình (Học/Ngưỡng/Hand-off/Giọng/BYOK/Báo) | cần store |
| 8 | **O** | Onboarding wizard (tái dùng M3/M6) | cần M3/M6 |
| 9 | **X1** | Nối deep-link xuyên màn | cần M1–M5 |

---

## 7. Ngoài scope V0 (không dựng)
Hồ sơ khách hàng đầy đủ · đa ngôn ngữ · tùy chỉnh trạng thái chuyên sâu · giao diện tự sinh theo ngữ cảnh.
Nudge & Channels: đưa vào nhóm "Cài đặt", không nằm trong luồng demo.
G4b (quét web) · G5 (thu theo kết quả) · G6 (Zalo cá nhân) · G7 (tư vấn ngành sâu): V1/V2/postpone.
