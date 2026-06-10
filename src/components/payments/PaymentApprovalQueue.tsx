"use client";

import { useEffect, useState } from "react";
import { Check, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DismissibleBanner } from "@/components/ui/dismissible-banner";
import { TopbarBannerSlot } from "@/components/shell/TopbarBannerSlot";
import type { Payment } from "./meta";

// Zone HITL §6.7 — ribbon dưới topbar (dán sát, full-width, dense) tóm tắt khoản cần chủ shop duyệt
// trước khi agent gửi QR. "Xem" lọc bảng về các khoản chờ duyệt. Hết việc → banner emerald (ẩn được).

export function PaymentApprovalQueue({
  pending,
  onView,
  viewing = false,
}: {
  pending: Payment[];
  onView: () => void;
  viewing?: boolean;
}) {
  // Ẩn được tại chỗ: banner "xong" (emerald) và nhắc duyệt (amber). Lưu mốc số khoản lúc tắt amber —
  // có khoản mới nhiều hơn thì hiện lại; hết khoản thì reset để lần sau hiện lại từ đầu.
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
          Không còn khoản nào chờ bạn duyệt — agent đang tự gửi QR thu tiền.
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
        <span className="font-semibold text-amber-900">{pending.length} khoản chờ bạn duyệt</span>
        <span className="text-amber-800"> — đơn lớn / hoàn tiền, agent không tự gửi QR.</span>
      </DismissibleBanner>
    </TopbarBannerSlot>
  );
}
