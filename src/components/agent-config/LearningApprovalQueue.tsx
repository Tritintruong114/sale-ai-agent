"use client";

import { useEffect, useState } from "react";
import { Check, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DismissibleBanner } from "@/components/ui/dismissible-banner";
import { TopbarBannerSlot } from "@/components/shell/TopbarBannerSlot";

// Zone HITL §6.7 — ribbon dưới topbar cho màn Học hằng ngày: tóm tắt số điều agent học được chờ chủ shop
// duyệt trước khi áp dụng. "Xem" cuộn xuống danh sách duyệt. Hết việc → banner emerald (ẩn được).
// Bám đúng pattern Đơn/Thanh toán (ApprovalQueue/PaymentApprovalQueue).

export function LearningApprovalQueue({
  pending,
  hasJournal,
  onView,
}: {
  pending: number;
  /** Có điều nào hôm nay không — chưa có thì màn dùng empty state ở nội dung, không hiện ribbon. */
  hasJournal: boolean;
  onView: () => void;
}) {
  // Ẩn được tại chỗ: banner "xong" (emerald) và nhắc duyệt (amber). Lưu mốc số điều lúc tắt amber —
  // có điều mới nhiều hơn thì hiện lại; hết điều thì reset để lần sau hiện lại từ đầu.
  const [doneDismissed, setDoneDismissed] = useState(false);
  const [dismissedAt, setDismissedAt] = useState(0);
  useEffect(() => {
    if (pending > 0) setDoneDismissed(false);
    else setDismissedAt(0);
  }, [pending]);

  if (!hasJournal) return null;

  if (pending === 0) {
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
          Đã duyệt xong nhật ký hôm nay — agent đang học đều mỗi ngày.
        </DismissibleBanner>
      </TopbarBannerSlot>
    );
  }

  if (pending <= dismissedAt) return null;

  return (
    <TopbarBannerSlot>
      <DismissibleBanner
        tone="amber"
        icon={GraduationCap}
        dense
        className="rounded-t-none rounded-b-xl"
        onDismiss={() => setDismissedAt(pending)}
        dismissLabel="Ẩn nhắc duyệt"
        action={
          <Button
            variant="outline"
            size="sm"
            onClick={onView}
            className="h-6 border-amber-300 bg-amber-100/50 px-2 text-[11px] text-amber-800 hover:bg-amber-100"
          >
            Xem
          </Button>
        }
      >
        <span className="font-semibold text-amber-900">{pending} điều chờ bạn duyệt</span>
        <span className="text-amber-800"> — agent học được hôm nay, duyệt trước khi áp dụng.</span>
      </DismissibleBanner>
    </TopbarBannerSlot>
  );
}
