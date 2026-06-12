"use client";

import { ArrowRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAgentConfig } from "@/store/agentConfigStore";
import { useUiStore } from "@/store/uiStore";
import { useSetupStore } from "@/store/setupStore";

// Welcome float góc phải sau Onboarding — không force: 2 lựa chọn cho 2 tệp người dùng.
// "Xem hướng dẫn nhanh" (người mới) chạy tour §6.13; "Tôi đã quen rồi" (người cũ) bỏ qua.
// Hiện một lần (welcomePending ở setupStore), tự ẩn khi chọn/đóng; chạy lại Onboarding sẽ hiện lại.
export function WelcomeModal() {
  const welcomePending = useSetupStore((s) => s.welcomePending);
  const dismissWelcome = useSetupStore((s) => s.dismissWelcome);
  const requestTour = useUiStore((s) => s.requestTour);
  const agentName = useAgentConfig((s) => s.config.identity.name);

  if (!welcomePending) return null;

  const startTour = () => {
    dismissWelcome();
    requestTour("guide");
  };

  return (
    // Overlay căn giữa + backdrop blur nhẹ; bấm nền để đóng (§9 escape-route).
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/10 p-4 backdrop-blur-sm motion-safe:animate-in motion-safe:fade-in motion-safe:duration-200"
      onClick={dismissWelcome}
    >
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="welcome-title"
      onClick={(e) => e.stopPropagation()}
      className="w-[300px] overflow-hidden rounded-xl bg-card shadow-xl ring-1 ring-foreground/10 motion-safe:animate-in motion-safe:fade-in motion-safe:zoom-in-95 motion-safe:duration-300"
    >
      {/* Ảnh 16:9 — minh hoạ hướng dẫn (public/tutorials.webp) */}
      <div className="relative aspect-video w-full bg-muted">
        <img
          src="/tutorials.webp"
          alt="Hướng dẫn nhanh Sale AI Agent"
          width={320}
          height={180}
          className="size-full object-cover"
        />
        <button
          type="button"
          onClick={dismissWelcome}
          aria-label="Đóng"
          title="Đóng"
          className="absolute right-1.5 top-1.5 flex size-6 items-center justify-center rounded-full bg-background/80 text-muted-foreground backdrop-blur transition-colors hover:bg-background hover:text-foreground"
        >
          <X className="size-3.5" aria-hidden />
        </button>
      </div>

      <div className="space-y-2.5 p-3">
        <div className="space-y-0.5">
          <h2 id="welcome-title" className="text-sm font-semibold">
            Chào mừng đến Sale AI Agent
          </h2>
          <p className="text-xs leading-snug text-muted-foreground">
            {agentName} đã sẵn sàng trả lời khách và bán hàng. Cùng đi nhanh một vòng các màn chính nhé?
          </p>
        </div>
        <div className="flex flex-col gap-1.5">
          <Button size="xs" className="w-full" onClick={startTour}>
            Xem hướng dẫn nhanh
            <ArrowRight className="size-3.5" aria-hidden />
          </Button>
          <Button size="xs" variant="ghost" className="w-full text-muted-foreground" onClick={dismissWelcome}>
            Để sau
          </Button>
        </div>
      </div>
    </div>
    </div>
  );
}
