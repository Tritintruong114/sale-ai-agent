# Design System — Sale AI Agent

Tài liệu thiết kế **chung cho toàn app**: tokens, typography, component, hệ màu, pattern bố cục và quy ước dùng lại trên mọi màn (Dashboard, Inbox, Đơn, Sản phẩm, Thanh toán, Cấu hình Agent, Onboarding).

Nguồn (single source of truth là mã, không phải tài liệu):
- Tokens: [src/app/globals.css](../src/app/globals.css)
- Shell: [src/components/shell/](../src/components/shell/) (`AppShell`, `TopBar`, `SideNav`)
- UI primitives: [src/components/ui/](../src/components/ui/)
- Shared: [src/components/shared/](../src/components/shared/)
- Ví dụ màn: [DashboardScreen](../src/components/dashboard/DashboardScreen.tsx) · [InboxScreen](../src/components/inbox/InboxScreen.tsx)

> Quy ước này **mô tả** trạng thái hiện tại của code. Khi thêm màn mới, bám theo các pattern bên dưới; khi đổi pattern, cập nhật lại doc.

---

## 1. Nguyên tắc

1. **Semantic-first** — luôn dùng token ngữ nghĩa (`bg-card`, `text-muted-foreground`, `ring-foreground/10`) thay vì màu cứng. Màu Tailwind cụ thể (sky/amber/…) chỉ dùng cho **palette trạng thái** (§5).
2. **Màu không bao giờ đứng một mình** — mọi trạng thái luôn kèm **nhãn chữ + icon**, màu chỉ để quét nhanh (a11y).
3. **Trung tính làm nền, màu làm tín hiệu** — hệ semantic là thang xám (chroma = 0); điểm nhấn đến từ palette trạng thái.
4. **Tất định** — không phụ thuộc `now`/random ở render (tránh lệch hydrate); thời gian cắt thẳng từ chuỗi ISO.
5. **Mock-driven** — màn đọc `@/data/*.json`, thay đổi là state client.
6. **Tối giản-cao cấp (premium-minimal)** — một điểm nhấn là đủ: ưu tiên **một chấm/đường primary** cho thứ cần chú ý thay vì nhiều mảng nền tint; widget phụ (vd checklist) dồn về **khối nhỏ một-hàng**, hint đẩy sang tooltip, không thẻ nổi to. Density gọn nhưng nhiều khoảng thở — "ít mà tinh" hơn "đầy mà ồn".

---

## 2. Bố cục ứng dụng (App Shell)

`AppShell` = `SideNav` + `TopBar` + `<main>`.

```
┌────────┬──────────────────────────────────────┐
│        │  TopBar  (h-14, border-b, bg-card)    │
│ Side   ├──────────────────────────────────────┤
│ Nav    │                                       │
│        │  <main> p-4 md:p-6  overflow-auto     │
│        │     ← nội dung từng màn                │
└────────┴──────────────────────────────────────┘
```

- Root: `flex h-screen overflow-hidden bg-background text-foreground`
- `<main>`: `flex-1 overflow-auto p-4 md:p-6` — vùng cuộn chính
- **TopBar** (`h-14`): nút toggle sidebar (`Menu` mobile / `PanelLeftClose/Open` desktop) · tiêu đề màn (suy từ route qua `PRIMARY_NAV`/`SETTINGS_NAV`) · `ByokBadge`. Màn nhiều góc nhìn: tiêu đề nhường chỗ cho **SegmentView** (§6.11)
- **SideNav**: thu gọn được (`useUiStore.collapsed`), drawer + scrim trên mobile (`MobileScrim`)
- **Navigation** ([nav.ts](../src/components/shell/nav.ts)): `PRIMARY_NAV` 6 màn V0 (M1–M6) + `SETTINGS_NAV`; item có `badge` số việc chờ từ `PENDING_COUNTS`

**Chiều cao màn:** màn cuộn-toàn-trang thì để `<main>` cuộn. Màn full-height (vd Inbox) tự trừ chrome: `h-[calc(100dvh-5.5rem)]` (`md:6.5rem`).

---

## 3. Tokens (globals.css)

Định nghĩa bằng **oklch**, có `:root` (light) + `.dark`, expose qua `@theme inline`.

### 3.1 Màu semantic (light)
| Token | Light | Vai trò |
|---|---|---|
| `background` / `foreground` | `1 0 0` / `0.145 0 0` | nền trang / chữ chính |
| `card` / `card-foreground` | `1 0 0` / `0.145 0 0` | nền khối nội dung |
| `primary` / `primary-foreground` | `0.205 0 0` / `0.985 0 0` | nút chính, bubble mình |
| `secondary` / `-foreground` | `0.97 0 0` / `0.205 0 0` | chip, nút phụ |
| `muted` / `-foreground` | `0.97 0 0` / `0.556 0 0` | nền phụ / chữ phụ |
| `accent` / `-foreground` | `0.97` / `0.205` | hover surfaces |
| `destructive` | `0.577 0.245 27.325` | lỗi, badge chưa đọc |
| `border` / `input` / `ring` | `0.922` / `0.922` / `0.708` | viền / input / focus |

> `.dark` đảo thang sáng-tối tương ứng; luôn dùng token để tự chạy dark mode.

### 3.2 Bo góc (radius)
Gốc `--radius: 0.625rem`, scale: `sm ×0.6` · `md ×0.8` · `lg ×1` · `xl ×1.4` · `2xl ×1.8` … `4xl ×2.6`.
- Container/Card: `rounded-xl`
- Item, ô nhỏ, input: `rounded-lg` / `rounded-md`
- Chip/Badge: `rounded-full` (`rounded-4xl`)
- Bubble chat: `rounded-2xl`

### 3.3 Typography
- Font: `--font-sans` (sans-serif system stack); `font-heading` = sans.
- Thang dùng thực tế: `text-[10px]/[11px]` (chip, meta) · `text-xs` · `text-sm` (body mặc định) · `text-base/lg` (tiêu đề khối) · `text-xl sm:text-2xl` (lede/H1 màn).
- Số liệu: luôn `tabular-nums` để canh cột.
- Cân chữ: `text-pretty` cho lede dài.

---

## 4. Component primitives (`@/components/ui`)

Dựng trên **@base-ui/react** + `cva` cho variant. Danh sách: `Button`, `Badge`, `Card`, `Select`, `Switch`, `Input`, `Textarea`, `Dialog`, `Tabs`, `Separator`, `ScrollArea`.

### 4.1 Button — [button.tsx](../src/components/ui/button.tsx)
- **variant**: `default` (primary), `outline`, `secondary`, `ghost`, `destructive` (nền `destructive/10`), `link`
- **size**: `default` (h-8), `xs` (h-6), `sm` (h-7), `lg` (h-9), `icon`, `icon-xs`, `icon-sm`, `icon-lg`
- Có sẵn: focus ring 3px, `active:translate-y-px`, `disabled:opacity-50`, auto `[&_svg]:size-4`

### 4.2 Badge — [badge.tsx](../src/components/ui/badge.tsx)
- variant như Button (`default/secondary/destructive/outline/ghost/link`), `h-5 rounded-4xl text-xs`, icon auto `size-3`.

### 4.3 Card — [card.tsx](../src/components/ui/card.tsx)
- `rounded-xl bg-card ring-1 ring-foreground/10`, spacing qua `--card-spacing` (default `4`, `size="sm"` → `3`)
- Slot: `CardHeader` (grid, hỗ trợ `CardAction` cột phải), `CardTitle` (`font-heading text-base`), `CardDescription` (`text-muted-foreground`), `CardContent`, `CardFooter` (`border-t bg-muted/50`)

### 4.4 Surface chuẩn (không dùng Card)
Khi cần khối thủ công, dùng đúng "card style":
```
rounded-xl bg-card ring-1 ring-foreground/10
```
Ô phụ / inset: `rounded-lg bg-muted/50`. Item bấm được: `rounded-lg ring-1 ring-foreground/10 hover:bg-muted/60`.

### 4.5 DismissibleBanner — [dismissible-banner.tsx](../src/components/ui/dismissible-banner.tsx)
Banner thông báo amber/emerald tắt-được (icon + nội dung + CTA + nút X), tuỳ chọn `dense` (chữ nhỏ) và `body`. Bọc trong `TopbarBannerSlot` để dán full-width sát dưới topbar. Chi tiết & quy ước: **§6.7**.

### 4.6 Select — [select.tsx](../src/components/ui/select.tsx)
Dựng trên `@base-ui/react/select`.
- **Popup**: `rounded-lg bg-popover ring-1 ring-foreground/10 shadow-md`; `List` có **padding `p-1`** và **`gap-0.5`** giữa item.
- **Item**: `rounded-md px-2 py-1.5 gap-2`. **Không dùng dấu tích** — item đang chọn nhận diện bằng màu nền: `data-selected:bg-primary/10 data-selected:text-primary data-selected:font-medium`. Highlight (hover/bàn phím): `focus:bg-accent`.
- **Nhãn nhóm** trong menu: header `div` `px-1.5 text-[11px] text-muted-foreground` (không bọc `Select.Group` thì **không** dùng `SelectLabel` — Base UI yêu cầu `SelectGroupContext`).
- **Số đếm** trong item: `<span className="ml-auto tabular-nums text-xs text-muted-foreground">`.

---

## 5. Hệ màu trạng thái (palette dùng chung)

Toàn app dùng chung quy ước **chip = `bg-{hue}-100 text-{hue}-700`**, **dot = `bg-{hue}-500`**, **tint surface = `bg-{hue}-50 ring-{hue}-200`**, **tint control (active) = `bg-{hue}-500/10 border-{hue}-500/30`**.

### 5.1 Bảng hue theo ý nghĩa
| Hue | Ý nghĩa quy ước | Xuất hiện ở |
|---|---|---|
| `sky` | Mới / khởi đầu / lượt chat | status `new`, KPI chats, timeline `sky` |
| `indigo` | Đang xử lý / tìm hiểu | status `exploring`, order `processing` |
| `violet` | Agent / AI / khách mới | icon `Bot`, KPI new_customers, timeline `violet` |
| `amber` | Cần chú ý / chờ / hand-off | "cần người", chờ TT, banner cảnh báo, việc cần làm |
| `orange` | Chờ thanh toán (đậm hơn amber) | status `awaiting_payment` |
| `emerald` | Thành công / đã chốt / đã TT | status `closed`, order `done`, đã thanh toán |
| `rose` | Nhóm phân loại / cảnh báo nhẹ | intent breakdown |
| `slate` | Trung tính phân loại | nhóm "khác" |

### 5.2 Ví dụ mapping trạng thái (Inbox `STATUS_META`)
| Status | Nhãn | Chip | Dot | Tint (active) |
|---|---|---|---|---|
| new | Mới | `bg-sky-100 text-sky-700` | `bg-sky-500` | `bg-sky-500/10 border-sky-500/30` |
| exploring | Tìm hiểu | `bg-indigo-100 text-indigo-700` | `bg-indigo-500` | `bg-indigo-500/10 border-indigo-500/30` |
| quoted | Đã báo giá | `bg-amber-100 text-amber-700` | `bg-amber-500` | `bg-amber-500/10 border-amber-500/30` |
| awaiting_payment | Chờ thanh toán | `bg-orange-100 text-orange-700` | `bg-orange-500` | `bg-orange-500/10 border-orange-500/30` |
| closed | Đã chốt | `bg-emerald-100 text-emerald-700` | `bg-emerald-500` | `bg-emerald-500/10 border-emerald-500/30` |

> Màn mới định nghĩa bảng `_META` riêng theo đúng công thức hue ở trên (xem `ORDER_STATUS`, `KPI_META`, `TONE_RING` để tham chiếu).

---

## 6. Pattern bố cục (tái dùng giữa các màn)

### 6.1 Màn dạng "trang cuộn" (Dashboard, Orders, Products…)
```
<div className="mx-auto max-w-6xl space-y-8 pb-4">
  <header> lede </header>
  <section aria-labelledby> … </section>
  …
</div>
```
- Giới hạn bề rộng đọc: `max-w-6xl mx-auto`
- Khoảng cách khối: `space-y-8` (màn) · `space-y-3` (trong section)

### 6.2 Lede / Page header
Thay vì tiêu đề trơ, dùng **lede kể kết quả + việc cần làm**:
- `<p className="text-sm text-muted-foreground">` dòng ngữ cảnh
- `<h1 className="text-pretty text-xl font-semibold sm:text-2xl">` câu tóm tắt, nhấn số liệu (`text-amber-600` cho việc cần xử lý)

### 6.3 Section
```
<section className="space-y-3" aria-labelledby="x-h">
  <h2 id="x-h" className="text-lg font-semibold">Tiêu đề</h2>
  …
</section>
```
Section nhỏ trong panel: helper với `<h3 className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">`.

### 6.4 Master–detail (Inbox)
Grid responsive nhiều cột, mobile chuyển list↔detail bằng state:
```
md:grid-cols-[20rem_1fr]   lg:grid-cols-[17rem_1fr_19rem]   xl:grid-cols-[20rem_1fr_21rem]
```
Cột phải dưới breakpoint mở dạng **overlay** (`fixed inset-0 z-40`, scrim `bg-foreground/40`, panel `bg-card shadow-xl max-w-sm`).

### 6.5 KPI / card lưới
`grid gap-4 sm:grid-cols-3` (hoặc 2/4); mỗi KPI có icon + chip tint riêng (`KPI_META`).

### 6.6 Empty state
Căn giữa, icon muted + câu giải thích + (tuỳ) CTA:
```
flex flex-col items-center justify-center gap-2 text-center text-sm text-muted-foreground
```
Empty trong khối: viền nét đứt `rounded-lg border border-dashed py-6` + icon.

### 6.7 Banner thông báo / cần chú ý — [DismissibleBanner](../src/components/ui/dismissible-banner.tsx)
Primitive dùng chung cho mọi banner amber/emerald tắt-được. Vỏ + tone tự lo màu (icon/chữ/nút X); nội dung do màn truyền — **không** dựng tay lại từng chỗ.
- **Props**: `tone` (`amber` cảnh báo/chờ · `emerald` đã xong) · `icon` · `children` (nội dung hàng tiêu đề) · `action` (CTA cuối hàng, vd nút "Xem") · `body` (khối dưới hàng tiêu đề, vd danh sách cuộn) · `onDismiss` (truyền vào → hiện nút X) · `dense` (chữ `text-[11px]` + icon `size-3.5` + padding sát) · `sticky`.
- **Style cơ bản**: `rounded-lg bg-amber-50 ring-1 ring-amber-200` + icon amber-600 + text amber-800. Bản emerald đổi sang `emerald-50 / emerald-200 / emerald-800`.
- **Dán dưới topbar** (ribbon full-width, sát mép): bọc banner trong [TopbarBannerSlot](../src/components/shell/TopbarBannerSlot.tsx) → portal vào slot `#topbar-banner-slot` mà [TopBar](../src/components/shell/TopBar.tsx) render ngay dưới `<header>` (rỗng thì `empty:hidden`, không chiếm chỗ). State/handler vẫn thuộc màn. Banner đặt `rounded-t-none rounded-b-lg/xl` cho góc trên vuông liền topbar. **Không** dùng margin âm/sticky để giả lập — slot lo việc dán sát.
- **Tự ẩn & hiện lại**: lưu mốc số việc lúc tắt (`dismissedAt`); việc tăng quá mốc → hiện lại, hết việc → reset về 0. Tham chiếu: [ProductsScreen](../src/components/products/ProductsScreen.tsx) (cảnh báo tồn kho), [ApprovalQueue](../src/components/orders/ApprovalQueue.tsx) / [PaymentApprovalQueue](../src/components/payments/PaymentApprovalQueue.tsx) (nhắc duyệt HITL — ribbon dense + nút "Xem" lọc danh sách về mục chờ duyệt).

### 6.8 Timeline
`<ol>` dọc có đường kẻ `before:bg-border`, mỗi mốc chấm tròn `size-8 rounded-full ring-1` tô theo `TONE_RING`, icon + tiêu đề + chi tiết + thời gian.

### 6.9 Thanh lọc dạng icon (toolbar)
Khi nhiều bộ lọc cùng hàng ở cột hẹp (vd danh sách Inbox), dùng **trigger icon-only** thay vì nhãn chữ:
- Mỗi `Select` là một dimension; trigger chỉ hiện **icon đổi theo giá trị đang chọn** (kênh → logo FB/Zalo, trạng thái → dot màu, xử lý → `Flag`/`Bot`), giữ chevron mảnh + `aria-label`/`title`; nhãn đầy đủ nằm trong menu.
- Hằng dùng chung: `FILTER_TRIGGER = "gap-1 px-2 [&>svg:last-child]:size-3 [&>svg:last-child]:text-muted-foreground/60"` (chevron mảnh, nhạt).
- **Active state** (khác mặc định): nền **tint theo đúng màu icon** ở 10% — kênh `bg-[#1877F2]/10`/`bg-[#0068FF]/10`, trạng thái dùng `STATUS_META[*].tint`, xử lý `bg-amber-500/10`/`bg-violet-500/10`; dimension không có màu ngữ nghĩa (sắp xếp) dùng trung tính `bg-foreground/5 border-foreground/25`.
- Chia nhóm theo chức năng bằng `justify-between` (vd trái = kênh+sắp xếp, phải = trạng thái+xử lý).

### 6.10 Chat (shared)
`ChatWindow` = `header slot` + messages (`overflow-auto`, auto-scroll) + `Composer`. `MessageBubble` theo `role`:
| role | style |
|---|---|
| own | phải · `rounded-br-sm bg-primary text-primary-foreground` |
| khác | trái · `rounded-bl-sm bg-muted` |
| system | chip giữa `bg-amber-100 text-amber-800` |
| typing | 3 chấm `animate-bounce` |

**Composer** ([Composer.tsx](../src/components/shared/chat/Composer.tsx)) — khung card bo `rounded-2xl border`, `focus-within:ring`: ô `textarea` tự giãn cao (`min-h-[52px]`, max `160px` rồi cuộn), Enter gửi · Shift+Enter xuống dòng; thanh công cụ dưới: nút gửi tròn (`ArrowUp`) bên phải, các control opt-in bên trái. Tính năng "khung chat thật" bật rời qua prop `composer` của `ChatWindow` (`ComposerOptions`): `enableAttachments` (đính kèm tệp — chip UI, prototype không gửi API), `models`/`modelId`/`onModelChange` (chọn model), `enableVoice` (nhập giọng nói qua Web Speech API — tự ẩn nếu trình duyệt không hỗ trợ). Side panel "Talk to Agent" bật cả ba; Inbox/onboarding để mặc định gọn (chỉ textarea + gửi).

### 6.11 Phân đoạn màn trên TopBar (SegmentView)
Khi một màn có **2–3 góc nhìn ngang hàng** trên cùng tập dữ liệu, tách bằng **segmented tabs đặt trên TopBar** ([TopBar.tsx](../src/components/shell/TopBar.tsx)) thay vì nhồi control vào thân trang. Các màn đang dùng:

| Màn | Nhánh (tab) | Store key |
|---|---|---|
| Đơn | **Chỉ số** (đọc) · **Quản lý** (thao tác) | `ordersTab` |
| Sản phẩm | **Tổng quan** (đọc) · **Sản phẩm** (thao tác/bảng) | `productsTab` |
| Thanh toán | **Chỉ số** (đọc — phễu KPI) · **Thu tiền** (thao tác — duyệt HITL + thu) | `paymentsTab` |
| Cấu hình Agent | 5 nhóm (Học hằng ngày · Bàn giao · Danh tính · Khoá AI · Thông báo) | `agentConfigTab` |
| Thông tin shop | **Thông tin shop** (hồ sơ nghiệp vụ) · **Kênh kết nối** (FB/Zalo) | `shopTab` |

Quy ước chung:

- **Control**: `Tabs` + `TabsList variant="line"` ([tabs.tsx](../src/components/ui/tabs.tsx)) — gạch chân mảnh dưới tab đang chọn, nền trong suốt; mỗi tab có **icon + nhãn**, kèm badge số việc chờ khi cần (vd `PENDING_COUNTS.bigOrders`).
- **Nhiều nhánh** (vd 5 nhóm Cấu hình Agent): vẫn dùng segmented tabs trên TopBar nhưng bọc `TabsList` trong `overflow-x-auto` để **cuộn ngang** gọn trên màn hẹp thay vì tràn. Chỉ khi nhãn quá dài / quá nhiều nhánh không cuộn nổi mới cân nhắc đổi sang composite `Select` (§4.5). Giữ **một chỗ điều hướng nhất quán** trên mọi màn — không đẩy bộ chuyển nhánh xuống thân trang.
- **State**: giữ ở `useUiStore` (`ordersTab`, `productsTab`, `agentConfigTab`) để TopBar (control) và Screen (nội dung) **dùng chung một nguồn**; Screen chỉ render nhánh đang chọn.
- **Reflect lên URL** (hai chiều với query `?tab=`):
  - *Vào màn*: route đọc `?tab=` → truyền `initialTab` → Screen set vào store (deep-link mở đúng nhánh).
  - *Đổi nhánh*: effect trong Screen `router.replace` ghi `?tab=<nhánh>` (giữ các param khác như `?o=` / `?p=`, `scroll: false`). Nhờ vậy link chia sẻ và nút back trình duyệt phản ánh đúng góc nhìn.
  - *Mở 1 bản ghi*: chọn item (vd `?p=` cho sản phẩm, `?o=` cho đơn) tự ép về nhánh thao tác tương ứng.
- **Bề rộng theo loại nhánh**: nhánh **đọc số liệu** (Đơn: Chỉ số · Sản phẩm: Tổng quan) căn giữa `mx-auto max-w-6xl` (§6.1) — trang dữ liệu cần line-length dễ đọc, không dính mép trái. Nhánh **thao tác/bảng** (Đơn: Quản lý · Sản phẩm: Sản phẩm — bảng nhiều cột + panel chi tiết docked) để **full-width** tận dụng bề ngang. Đặt điều kiện ngay trên container chung của màn, ví dụ: `cn("flex w-full flex-col gap-3", tab === "products" ? "md:h-[calc(100dvh-6.5rem)]" : "mx-auto max-w-6xl")`.

### 6.12 Bảng dữ liệu (data table)
Danh sách nhiều bản ghi cần quét/so sánh nhanh dùng `<table>` thật (semantic, a11y) thay vì list `<div>`. Tham chiếu: [OrderList.tsx](../src/components/orders/OrderList.tsx).

- **Khung**: bọc `overflow-x-auto rounded-lg ring-1 ring-foreground/10` (surface inset §4.4); `<table class="w-full min-w-[…] border-collapse">` + `<caption class="sr-only">` mô tả cách dùng.
- **Header**: `<thead>` nền `bg-muted/40`, nhãn cột `text-[11px] font-semibold uppercase tracking-wide text-muted-foreground`.
- **Cột sắp xếp được**: `<th aria-sort="ascending|descending|none">` chứa `<button>` bấm để đổi cột/đảo chiều; icon `ArrowUp`/`ArrowDown` khi active, `ChevronsUpDown` mờ khi hover cột chưa chọn. **Sort là toàn cục**: sắp xếp cả tập đã lọc **trước** khi phân trang (state nâng lên màn cha — controlled), không sắp trong một trang.
- **Hàng**: `<tr>` bấm được mở chi tiết — `tabIndex={0}` + `onKeyDown` Enter/Space + `aria-selected` + `aria-label`; hover `bg-muted/50`, đang chọn `bg-primary/5` + dải nhấn `border-l-2 border-primary` ở ô đầu (mọi hàng `border-l-2 border-transparent` để không lệch layout); `focus-visible:ring-2 ring-inset`.
- **Số liệu**: cột tiền/đếm canh phải, `tabular-nums`. Cột phụ ít quan trọng có thể ẩn dần theo breakpoint (`hidden lg:table-cell` / `xl:`) — ưu tiên cột cốt lõi trên màn hẹp (§5 `content-priority`); bảng đặt `min-w-[…]` trong khung `overflow-x-auto` để cuộn ngang khi cần thay vì nhồi cột.
- **Sửa tại chỗ (inline editable)**: các trục có thể đổi giá trị (vd trạng thái đơn, tình trạng giao) tách thành **cột `Select` riêng** — mỗi cột một dimension, trigger nền **tint theo giá trị hiện tại** (`m.tint`) + dot màu + nhãn. Bọc `Select` trong `<span>` chặn `stopPropagation` cả `onClick` **và** `onKeyDown` để mở/thao tác dropdown không kích hoạt mở hàng. Handler đổi-thẳng (set bất kỳ giá trị, có thể lùi) nâng lên màn cha, tách khỏi handler "tiến tới" (advance) nếu có.
- **Tách trục trạng thái theo nghiệp vụ**: nếu một bản ghi có nhiều "trạng thái" khác nghĩa thì **mỗi trục một cột riêng**, đừng trộn. Vd Đơn: *Trạng thái đơn hàng* (vòng đời xử lý, sửa tại chỗ) vs *Trạng thái tư vấn* (phễu hội thoại Inbox §5.2, **chỉ đọc**, join từ `conversations.json` qua `conversationId`). Trục chỉ-đọc dùng chip dot + nhãn (`—` khi thiếu dữ liệu).
- **Facet phụ về panel chi tiết**: các trục thứ yếu (duyệt, thanh toán, giao) **không nhồi vào bảng** — chỉ hiện ở `OrderDetailPanel`. Bảng giữ ít cột, tập trung trục cốt lõi để quét nhanh. Chip màu **luôn kèm icon/dot + nhãn** (§5, không chỉ màu); nhiều chip thì `flex flex-wrap gap-1.5`.
- **Chế độ xem mặc định**: màn có cả Danh sách (bảng) và thẻ/Bảng cột (Kanban) **mặc định mở Danh sách** để quét/so sánh nhanh. Tạm ẩn một chế độ bằng cờ cục bộ (vd `BOARD_VIEW_ENABLED` trong [OrdersToolbar.tsx](../src/components/orders/OrdersToolbar.tsx)) — ẩn nút chuyển chế độ nhưng giữ code để bật lại.
- **Phân trang**: footer dính đáy container (`shrink-0 border-t`) dùng `Pagination` ([pagination.tsx](../src/components/ui/pagination.tsx)); về trang 1 khi đổi lọc/tìm/sắp xếp.
- **Rỗng**: empty state §6.6 thay cho bảng trống.

### 6.13 Tour hướng dẫn (onboarding tour)
Đi qua các màn cho người mới sau Onboarding. Component [tour.tsx](../src/components/ui/tour.tsx) (shadcn `@tour/tour` — **đã chuyển từ Radix popover sang định vị thủ công** vì project dùng base-ui popover), bọc qua [AppTour](../src/components/tour/AppTour.tsx) trong [(app)/layout](../src/app/(app)/layout.tsx).
- **Spotlight**: SVG mask khoét lỗ quanh target + viền `stroke-primary`; thẻ nội dung đặt cạnh (mặc định bên phải). Target chọn qua `data-tour-step-id` (match kiểu *contains*).
- **Tour qua nhiều màn**: neo vào **mục SideNav** (luôn mounted ở mọi route) qua `nav.tour` slug; `nextRoute`/`previousRoute` đổi nội dung `<main>` phía sau trong khi spotlight di chuyển xuống nav. Bền hơn nhiều so với neo vào element trong thân trang (đổi route là mất).
- **Khởi động**: cờ `pendingTourId` ở `useUiStore` (đặt từ Onboarding "Vào Dashboard" hoặc nút "Xem hướng dẫn" cuối SideNav) → `TourLauncher` trong AppTour gọi `start()`.
- **Nội dung**: nhãn tiếng Việt (Tiếp / Quay lại / Xong, "Bước X / Y"); mỗi màn một câu **giá trị người dùng** + bộ tên thực thể chuẩn (copy-writer convention), không gọi agent là "nó".

### 6.14 Setup guide (Dashboard empty state) — [SetupGuide](../src/components/dashboard/SetupGuide.tsx)
3 việc khởi đầu để shop sẵn sàng bán, **đặt trong Dashboard empty state** (chỉ hiện khi shop chưa có hoạt động — có dữ liệu rồi thì không cần, không nhồi vào SideNav). Áp **§1.6 premium-minimal**:
- **Welcome trước, guide sau**: xong Onboarding → modal [WelcomeModal](../src/components/shell/WelcomeModal.tsx) góc phải (2 lựa chọn: xem tour §6.13 / tự khám phá, **không force**); vào Dashboard mà chưa có hoạt động thì thấy SetupGuide để tự hoàn tất.
- **Empty state minimal**: khi `!hasActivity`, [DashboardScreen](../src/components/dashboard/DashboardScreen.tsx) chỉ render **lede + SetupGuide**, bỏ hết block số liệu rỗng (KPI, 3 biểu đồ, hội thoại đáng chú ý, card học) — tránh "dư thừa".
- **Card guide**: tiêu đề "Hoàn tất thiết lập" + `x/total` + câu "Còn N bước…" + **thanh tiến trình** (`scaleX`, không reflow); mỗi bước một hàng, **bước kế tiếp làm nổi** (nền `primary/5` + ring + số trong vòng primary + `ChevronRight`), bước xong = `CheckCircle2` emerald + chữ mờ.
- **Trạng thái "xong" suy từ state thật**, không cờ giả: có sản phẩm (`products.json.catalog`), đã nối cổng (`useSetupStore.gateways`), đã chat thử (`useSetupStore.agentTested` — set khi mở chat ở `useUiStore.setAgentChatOpen`). Welcome dùng `useSetupStore.welcomePending`; reset sau Onboarding / "Chạy lại Onboarding".

---

## 7. Spacing & kích thước chuẩn

| Hạng mục | Giá trị |
|---|---|
| Padding `<main>` | `p-4 md:p-6` |
| Bề rộng nội dung | `max-w-6xl mx-auto` |
| Gap khối lớn / section | `space-y-8` / `space-y-3` |
| Gap lưới card | `gap-4` |
| Gap nội khối nhỏ | `gap-2` / `gap-3` |
| Bo container | `rounded-xl` · ô nhỏ `rounded-lg` |
| Viền khối | `ring-1 ring-foreground/10` |
| Avatar | `size-8` (chat) · `size-9` (list) · `size-11` (profile) |
| Chip text | `text-[10px]` / `text-[11px]` |

---

## 8. Iconography

- Bộ icon: **lucide-react** (đồng nhất toàn app), `aria-hidden` khi chỉ trang trí.
- Icon kênh riêng: `FacebookIcon`, `ZaloIcon` ([@/components/icons/channel](../src/components/icons/channel)).
- Kích thước theo ngữ cảnh: `size-3`/`size-3.5` trong chip, `size-4` mặc định, `size-5` trong banner.
- Icon mang màu ngữ nghĩa: `Bot` → `violet-600`, `Flag` → `amber-600`, `Check` → `emerald-600`, `Clock` → `amber-600`.

---

## 9. Accessibility & motion

- Mọi control có `aria-label`/`title`; vùng overlay `role="dialog" aria-modal`.
- Trạng thái truyền tải **kép** (màu + nhãn/icon), không chỉ màu.
- Section gắn `aria-labelledby` tới heading.
- Focus rõ ràng: `focus-visible:ring` (3px) trên Button/Badge/Input.
- Animation 150–300ms, **tôn trọng** `motion-reduce:animate-none`.
- Số canh cột bằng `tabular-nums`.

---

## 10. State management

- **Zustand stores** ([@/store](../src/store)): `useUiStore` (sidebar collapse/mobile, `pendingTourId` khởi động tour §6.13), `useAgentConfig` (cấu hình shop/agent), `useSetupStore` (**persist** localStorage — trạng thái nối cổng + tiến độ checklist §6.14: `gateways`/`agentTested`/`dismissed`), …
- Dữ liệu màn: mock JSON trong [@/data](../src/data); tương tác là state cục bộ (`useState`) hoặc store.
- **Phản ánh URL**: điều hướng phụ trong màn (tab/segment, đơn đang mở) đồng bộ hai chiều với query (`?tab=`, `?o=` — xem §6.11) — deep-link mở đúng trạng thái, thao tác cập nhật thanh địa chỉ qua `router.replace`.
- `cn()` ([@/lib/utils](../src/lib/utils)) gộp class; helper format ở [@/lib/format](../src/lib/format) (`formatVND`, …).
