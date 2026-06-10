"use client";

import { useEffect, useState } from "react";
import type { ChatMessage } from "@/components/shared/chat/MessageBubble";
import type { Conversation } from "@/components/inbox/InboxScreen";

// Engine mô phỏng "thời gian thực" cho Inbox nguyên mẫu: bắt đầu từ rỗng, mỗi nhịp khách
// nhắn vào — hội thoại mới xuất hiện, tin append vào hội thoại sẵn có, thỉnh thoảng bật cờ
// "Cần người". Thuần dữ liệu — không chạm backend. (Khuôn theo lib/realtimeDashboard.ts.)

export type InboxFeed = { conversations: Conversation[]; clock: number };

// Hội thoại mới sẽ lần lượt "đổ" vào — khách + nội dung bám catalog trái cây / mâm cúng / giỏ quà.
const NEW_CONV_POOL: { customerName: string; channel: string; status: Conversation["status"]; text: string }[] = [
  { customerName: "Ngô Bảo Châu", channel: "facebook", status: "new", text: "Shop còn sầu riêng Musanking không ạ?" },
  { customerName: "Đặng Thuý Vy", channel: "zalo", status: "exploring", text: "Cho mình hỏi giỏ quà trái cây tầm 500k có mẫu nào ạ?" },
  { customerName: "Bùi Tuấn Khang", channel: "facebook", status: "new", text: "Mâm ngũ quả cúng rằm đặt trước mấy ngày shop?" },
  { customerName: "Lý Mỹ Linh", channel: "facebook", status: "exploring", text: "Nho Queen với chôm chôm hôm nay giá sao shop?" },
  { customerName: "Hoàng Anh Tú", channel: "zalo", status: "new", text: "Đặt 2kg xoài cát giao Quận 3 được không ạ?" },
  { customerName: "Phan Diễm Quỳnh", channel: "facebook", status: "new", text: "Combo trái cây tặng sinh nhật có không shop?" },
  { customerName: "Trịnh Văn Hậu", channel: "zalo", status: "exploring", text: "Vải thiều còn hàng không, lấy 3kg ạ" },
  { customerName: "Mai Khánh Hoà", channel: "facebook", status: "new", text: "Shop tư vấn mâm cúng đầy tháng cho bé giúp mình" },
];

// Tin nhắn khách gửi tiếp vào hội thoại đang có.
const FOLLOWUP_POOL = [
  "Shop ơi còn đó không ạ?",
  "Cho mình xin thêm hình sản phẩm với",
  "Giao về Quận 7 phí ship bao nhiêu shop?",
  "Ok vậy chốt giúp mình nha",
  "Mình chuyển khoản hay ship COD được không ạ?",
  "Có giảm gì cho khách quen không shop?",
  "Khi nào giao được vậy shop?",
];

// Lý do cần người — đồng bộ HandoffKey ở conversations.json.
const HANDOFF_POOL = [
  { key: "want_buy", reason: "Khách muốn mua (dấu hiệu chốt đơn)" },
  { key: "discount", reason: "Khách xin giảm giá quá 15%" },
  { key: "complaint", reason: "Khách phàn nàn" },
];

// Câu trả lời agent tự gửi khi đang bật (giọng lịch sự, nhẹ, bám catalog).
const AGENT_REPLY_POOL = [
  "Dạ em chào mình ạ. Bên em còn hàng nha, mình cần loại nào để em tư vấn thêm ạ?",
  "Dạ em gửi mình bảng giá và ít hình sản phẩm ngay đây ạ.",
  "Dạ phí ship nội thành 20.000đ, đơn từ 300.000đ là freeship cho mình nha.",
  "Dạ em chốt đơn giúp mình nhé, mình cho em xin tên và địa chỉ giao ạ.",
  "Dạ mình thanh toán COD hoặc chuyển khoản đều được ạ.",
  "Dạ hàng mới về sáng nay, em sắp xếp giao trong hôm nay cho mình kịp nha ạ.",
];

// Ảnh sản phẩm (catalog products.json) — agent gửi kèm cho sinh động khi tư vấn.
const PRODUCT_PHOTO_POOL = [
  { name: "Sầu riêng Musanking", price: "120.000đ/kg", url: "https://drive.google.com/thumbnail?id=1Vu3vteuD8CiHhGSFAolt2BftibUlep1w&sz=w1000" },
  { name: "Nho Queen", price: "85.000đ/kg", url: "https://drive.google.com/thumbnail?id=1kJviRnG87fATcWA2Di4pythYYARBNNKc&sz=w1000" },
  { name: "Xoài Cát", price: "90.000đ/kg", url: "https://drive.google.com/thumbnail?id=1s5wvh-H0cOMmUOJ4sVLy5Bj_ENabuXRp&sz=w1000" },
  { name: "Vải thiều Lục Ngan", price: "85.000đ/kg", url: "https://drive.google.com/thumbnail?id=11I6_8Rw-FHEAy4qcT8Ik3lhWgxyoVmXc&sz=w1000" },
  { name: "Măng Cụt", price: "75.000đ/kg", url: "https://drive.google.com/thumbnail?id=1UMeh4eLoc44zMH4SHkTXmW2o9nzt7qIa&sz=w1000" },
  { name: "Chôm Chôm", price: "45.000đ/kg", url: "https://drive.google.com/thumbnail?id=1va-qYWGZ4peOFCl1F374HdBsGZwUu0oQ&sz=w1000" },
  { name: "Mâm thanh tân", price: "450.000đ", url: "https://drive.google.com/thumbnail?id=1DcLUNPxvecyOwnH6T7N_KJA-PEsAuvxw&sz=w1000" },
];

// Câu trả lời của agent — ~50% kèm ảnh sản phẩm (gửi thành tin ảnh RIÊNG sau bubble chữ).
function agentReply(): { text: string; image?: { url: string; alt: string } } {
  if (Math.random() < 0.5) {
    const p = PRODUCT_PHOTO_POOL[Math.floor(Math.random() * PRODUCT_PHOTO_POOL.length)];
    return { text: `Dạ em gửi mình hình **${p.name}** (${p.price}) nha ạ:`, image: { url: p.url, alt: p.name } };
  }
  return { text: AGENT_REPLY_POOL[Math.floor(Math.random() * AGENT_REPLY_POOL.length)] };
}

// Hội thoại đang để agent tự trả lời (và không chờ người) thì agent mới rep.
const agentShouldReply = (c: Conversation) => c.agentActive && !(c.handoff && !c.handoff.acknowledged);

const clone = (d: InboxFeed): InboxFeed => JSON.parse(JSON.stringify(d)) as InboxFeed;

// ISO tất định từ "phút trôi" so với 08:00 — không dùng Date.now() để tránh lệch hydrate
// (hhmm ở InboxScreen chỉ cắt ký tự 11..16 nên chỉ cần HH:mm hợp lệ).
function isoAt(minutes: number): string {
  const h = 8 + Math.floor(minutes / 60);
  const hh = String(Math.min(h, 23)).padStart(2, "0");
  const mm = String(minutes % 60).padStart(2, "0");
  return `2026-06-10T${hh}:${mm}:00+07:00`;
}

// Baseline rỗng — điểm khởi đầu của realtime (shop chưa có hội thoại nào).
export function makeBaseline(): InboxFeed {
  return { conversations: [], clock: 0 };
}

// Một nhịp cập nhật — nhận trạng thái trước, trả trạng thái mới (không sửa tại chỗ).
export function tick(prev: InboxFeed): InboxFeed {
  const next = clone(prev);
  next.clock += 1 + Math.floor(Math.random() * 4); // vài phút trôi mỗi nhịp

  // ~50%: thêm 1 hội thoại mới vào đầu danh sách (từ pool chưa dùng)
  if (Math.random() < 0.5) {
    const used = new Set(next.conversations.map((c) => c.customerName));
    const tpl = NEW_CONV_POOL.find((t) => !used.has(t.customerName));
    if (tpl) {
      const id = `rt-${String(next.conversations.length + 1).padStart(3, "0")}`;
      next.conversations.unshift({
        id,
        customerName: tpl.customerName,
        channel: tpl.channel,
        status: tpl.status,
        agentActive: true,
        handoff: null,
        unread: 1 + Math.floor(Math.random() * 3),
        lastMessageAt: isoAt(next.clock),
        orderId: null,
        messages: [{ id: `${id}-m1`, role: "customer", text: tpl.text } as ChatMessage],
      });
    }
  }

  // ~40%: 1 hội thoại sẵn có nhận thêm tin khách → tăng unread, đẩy lên đầu
  if (next.conversations.length > 0 && Math.random() < 0.4) {
    const idx = Math.floor(Math.random() * next.conversations.length);
    const [c] = next.conversations.splice(idx, 1);
    const text = FOLLOWUP_POOL[Math.floor(Math.random() * FOLLOWUP_POOL.length)];
    c.messages.push({ id: `${c.id}-m${c.messages.length + 1}`, role: "customer", text } as ChatMessage);
    c.unread += 1;
    c.lastMessageAt = isoAt(next.clock);
    next.conversations.unshift(c);
  }

  // ~20%: bật cờ "Cần người" cho 1 hội thoại chưa có handoff
  if (Math.random() < 0.2) {
    const candidate = next.conversations.find((c) => !c.handoff);
    if (candidate) {
      const h = HANDOFF_POOL[Math.floor(Math.random() * HANDOFF_POOL.length)];
      candidate.handoff = { key: h.key, reason: h.reason, acknowledged: false };
      candidate.messages.push({
        id: `${candidate.id}-sys${candidate.messages.length + 1}`,
        role: "system",
        text: `Cần người: ${h.reason}`,
      } as ChatMessage);
      candidate.lastMessageAt = isoAt(next.clock);
    }
  }

  // Agent tự trả lời — máy trạng thái 2 nhịp để thấy rõ "đang gõ" rồi mới ra câu trả lời:
  // tin khách → (nhịp sau) bong bóng "đang gõ" → (nhịp sau) câu trả lời của agent.
  for (const c of next.conversations) {
    const last = c.messages[c.messages.length - 1];
    if (!last) continue;
    if (last.role === "typing") {
      // Đang gõ → thay bằng câu trả lời thật; nếu có ảnh thì gửi tin ảnh riêng ngay sau.
      c.messages.pop();
      const r = agentReply();
      c.messages.push({ id: `${c.id}-a${c.messages.length + 1}`, role: "agent", text: r.text } as ChatMessage);
      if (r.image) {
        c.messages.push({ id: `${c.id}-img${c.messages.length + 1}`, role: "agent", text: "", image: r.image } as ChatMessage);
      }
      c.lastMessageAt = isoAt(next.clock);
    } else if (last.role === "customer" && agentShouldReply(c)) {
      // Khách vừa nhắn, agent đang bật → hiện "đang gõ".
      c.messages.push({ id: `${c.id}-typing`, role: "typing", text: "" } as ChatMessage);
    }
  }

  return next;
}

// Hook: khi active chạy nhịp mỗi 2s (bắt đầu từ rỗng). restartKey đổi → chạy lại từ đầu.
// Reset baseline làm trong lúc render (đổi session key) — đúng pattern useRealtimeDashboard.
export function useRealtimeInbox(active: boolean, restartKey = 0): InboxFeed {
  const sessionKey = `${active}:${restartKey}`;
  const [snap, setSnap] = useState(() => ({ key: sessionKey, data: makeBaseline() }));

  if (snap.key !== sessionKey) {
    setSnap({ key: sessionKey, data: makeBaseline() });
  }

  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => {
      setSnap((prev) => ({ key: prev.key, data: tick(prev.data) }));
    }, 2000);
    return () => clearInterval(id);
  }, [active, restartKey]);

  return snap.data;
}
