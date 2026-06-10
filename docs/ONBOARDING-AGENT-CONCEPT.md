---
type: prototype-concept
date: 2026-06-10
status: concept
tags: [prototype, fanpage, onboarding, training, re-train, ai-agents]
---

# Onboarding Agent + Training-First Concept

> Nguồn: brainstorm 2026-06-10 (anh Tín). Đi kèm `docs/POST-ONBOARDING-CONCEPT.md` và `docs/ARCHITECTURE.md`.
> Phạm vi: **định hướng sản phẩm cho luồng training/re-train** — chưa build, mock toàn bộ. Các mục đánh dấu **(define sau)** là chủ ý để lại, chốt sau.
> Mục tiêu giai đoạn này: **đặt training làm trục chính** của trải nghiệm, không để nó lẫn vào cấu hình.

---

## 1. Luận điểm gốc

Một agent bán hàng chỉ tốt khi nó **được dạy liên tục**. Onboarding chỉ tạo ra agent "phiên bản 0"; giá trị thật nằm ở **vòng lặp train → quan sát → re-train**. Vì vậy:

- **Re-train là cực kỳ quan trọng** — không phải tính năng phụ, mà là trục sản phẩm.
- Vòng lặp đó phải **chạy liên tục** (continuous re-train), không phải một lần rồi thôi.
- Phải có một **"Manager" embed thông minh** điều phối vòng lặp này (gom tín hiệu, đề xuất khi nào cần train lại, đo chất lượng). **(define sau)**

## 2. Onboarding Agent

Khung lại bước onboarding như việc **khởi tạo + lần train đầu tiên** của agent, thay vì chỉ "điền form cấu hình":

- Mỗi bước nạp dữ liệu (sản phẩm, giọng, kênh) = một mẩu "dạy" agent → nói rõ cho chủ shop biết họ đang **train** agent, không chỉ khai báo.
- Kết thúc onboarding = agent có "mẻ train #1". Từ đó mở thẳng vào vòng lặp re-train.
- Chat thử (cuối onboarding) là **điểm chạm training đầu tiên**: chủ shop thấy ngay agent đã học được gì, và đâu là chỗ cần dạy thêm.

## 3. Khách hàng phải "aware" được training ở đâu

Nếu purpose giai đoạn này là **focus vào training**, thì trải nghiệm phải làm cho việc training **hiện diện và có chủ đích** — không giấu trong settings:

- **Chỗ training phải nhìn thấy được** — có nơi rõ ràng "đây là nơi bạn dạy agent", tách khỏi cấu hình kỹ thuật.
- **Cần các điểm friction có chủ đích** — không tối giản hoá mọi thứ; ở đúng chỗ nên buộc chủ shop dừng lại, xem agent trả lời, xác nhận/sửa → chính hành động đó là dữ liệu train. Friction = cơ hội dạy.
- **Thống kê số lần train / được training** — đếm và phơi bày: bao nhiêu lần agent được train, bao nhiêu câu đã được sửa/duyệt, lần re-train gần nhất khi nào. Con số này làm chủ shop *cảm* được sự tiến bộ.

## 4. Tách feature để tập trung vào training

Không gộp training chung với vận hành. Tách thành các bề mặt riêng để "training" nổi lên như công dụng chính:

| Feature | Vai trò | Trạng thái |
|---|---|---|
| **Training** | Dạy lần đầu / dạy chủ động (nạp sản phẩm, giọng, kịch bản, câu mẫu) | định hình |
| **Re-train** | Vòng lặp liên tục: gom hội thoại đã chốt + lần chủ shop sửa → dạy lại | **(define sau)** — trọng tâm |
| **Training Manager** | Lớp embed thông minh điều phối vòng lặp, đề xuất khi nào re-train, đo chất lượng | **(define sau)** |
| **Thống kê training** | Số lần train, số câu được sửa/duyệt, lần re-train gần nhất, xu hướng chất lượng | mới |
| ... (etc) | các bề mặt phụ trợ tách sau | (define sau) |

## 5. Vòng lặp re-train (phác thảo — define sau)

```
Train #1 (onboarding)
      │
      ▼
Agent trả lời khách  ──►  Chủ shop sửa / duyệt  ──►  Tín hiệu training
      ▲                                                     │
      │                                                     ▼
      └──────────  Re-train (Manager kích hoạt)  ◄── Gom tín hiệu + đo chất lượng
```

- Tín hiệu đầu vào: hội thoại đã chốt, lần chủ shop sửa câu trả lời, case hand-off đã xử lý, sản phẩm mới (xem `dailyLearning.sources` trong `src/data/config.ts` — đã có seed).
- Manager quyết định **khi nào** đủ tín hiệu để re-train, và phản hồi lại cho chủ shop "agent vừa học thêm X".

## 6. Việc đã chạm trong prototype (liên quan)

- Onboarding wizard 4 bước (`OnboardingWizard.tsx`) — bước tạo agent (giọng/ảnh) là điểm "train đầu".
- Chat thử cuối onboarding chuyển từ pop-up → **inline trong card** để training feel liền mạch (đã đổi 2026-06-10).
- `dailyLearning` trong `config.ts` đã có khung nguồn học hằng ngày — là hạt giống cho re-train Manager.

## 7. Câu hỏi mở (chốt sau)

- Re-train là tự động (Manager tự chạy) hay cần chủ shop bấm xác nhận? Mức friction bao nhiêu là đủ?
- Đặt bề mặt Training ở đâu trong nav — một mục riêng ngang hàng Inbox/Đơn, hay lồng trong Cấu hình Agent?
- Thống kê training hiển thị ở Dashboard hay trong chính màn Training?
- "Training Manager" embed ở tầng nào — per-agent hay toàn shop?
