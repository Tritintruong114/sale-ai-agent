"use client";

import { useEffect, useState } from "react";
import { Check, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DismissibleBanner } from "@/components/ui/dismissible-banner";
import { TopbarBannerSlot } from "@/components/shell/TopbarBannerSlot";
import { type Order } from "./meta";

// Zone HITL §6.7 — ribbon dưới topbar (dán sát, full-width, dense) tóm tắt số đơn cần chủ shop duyệt.
// "Xem" lọc danh sách chính về các đơn chờ duyệt. Hết việc → banner emerald (ẩn được).

export function ApprovalQueue({
  pending,
  onView,
  viewing = false,
}: {
  pending: Order[];
  onView: () => void;
  viewing?: boolean;
}) {
  // Ẩn được tại chỗ: banner "xong" (emerald) và nhắc duyệt (amber). Lưu mốc số đơn lúc tắt amber —
  // có đơn mới nhiều hơn thì hiện lại; hết đơn thì reset để lần sau hiện lại từ đầu.
  const [doneDismissed, setDoneDismissed] = useState(false);
  const [dismissedAt, setDismissedAt] = useState(0);
  useEffect(() => {
    if (pending.length > 0) setDoneDismissed(false);
    else setDismissedAt(0);
  }, [pending.length]);

  if (pending.length === 0) {
    if (doneDismissed) return null;
    return (
      <TopbarBannerSlot>
        <DismissibleBanner
          tone="emerald"
          icon={Check}
          dense
          className="rounded-t-none rounded-b-lg"
          onDismiss={() => setDoneDismissed(true)}
        >
          Không còn đơn nào chờ bạn duyệt.
        </DismissibleBanner>
      </TopbarBannerSlot>
    );
  }

  if (pending.length <= dismissedAt) return null;

  return (
    <TopbarBannerSlot>
      <DismissibleBanner
        tone="amber"
        icon={ShieldCheck}
        dense
        className="rounded-t-none rounded-b-xl"
        onDismiss={() => setDismissedAt(pending.length)}
        dismissLabel="Ẩn nhắc duyệt"
        action={
          viewing ? null : (
            <Button
              variant="outline"
              size="sm"
              onClick={onView}
              className="h-6 border-amber-300 bg-amber-100/50 px-2 text-[11px] text-amber-800 hover:bg-amber-100"
            >
              Xem
            </Button>
          )
        }
      >
        <span className="font-semibold text-amber-900">{pending.length} đơn chờ bạn duyệt</span>
        <span className="text-amber-800"> — agent đã chuyển để bạn xác nhận trước khi xử lý.</span>
      </DismissibleBanner>
    </TopbarBannerSlot>
  );
}
