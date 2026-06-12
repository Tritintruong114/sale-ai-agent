"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Bot,
  Check,
  CheckCircle2,
  Clock,
  Link2,
  MessageSquare,
  PackageSearch,
  Store,
  type LucideIcon,
} from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { DEFAULT_CONFIG } from "@/data/config";
import { useAgentConfig } from "@/store/agentConfigStore";
import { useSetupStore } from "@/store/setupStore";
import { usePrototypeStore } from "@/store/prototypeStore";
import { Stepper } from "./Stepper";
import { StepHeader } from "./StepHeader";
import { ProvisioningScreen } from "./ProvisioningScreen";
import { TestChatPanel } from "./TestChatPanel";
import { SAMPLE_SUGGESTED_PRODUCTS } from "@/data/onboarding";
import type { OnboardingDraft, StepProps } from "./types";
import { StepCreateShop } from "./steps/StepCreateShop";
import { StepCreateAgent } from "./steps/StepCreateAgent";
import { StepProducts } from "./steps/StepProducts";
import { StepConnectChannel } from "./steps/StepConnectChannel";

type Phase = "wizard" | "provisioning" | "ready";
type StepCode = "shop" | "agent" | "products" | "facebook";

type StepDef = {
  code: StepCode;
  title: string;
  short?: string; // nhãn ngắn cho thanh stepper
  benefit: string;
  icon: LucideIcon;
  render: (p: StepProps) => React.ReactNode;
  canNext: (d: OnboardingDraft) => boolean;
  skippable?: boolean; // cho bỏ qua, thêm sau ở Cấu hình
};

const STEPS: StepDef[] = [
  {
    code: "shop",
    title: "Cửa hàng",
    benefit: "Đặt Tên cửa hàng để agent giới thiệu với khách.",
    icon: Store,
    render: (p) => <StepCreateShop {...p} />,
    canNext: (d) => d.shopName.trim().length > 0,
  },
  {
    code: "agent",
    title: "Thông tin Agent",
    benefit: "Đặt tên cho trợ lý bán hàng của shop.",
    icon: Bot,
    render: (p) => <StepCreateAgent {...p} />,
    canNext: (d) => Boolean(d.identity.name && d.identity.tone),
  },
  {
    code: "products",
    title: "Thêm sản phẩm",
    benefit: "Tải tệp hoặc dán link — agent tự lập danh sách sản phẩm.",
    icon: PackageSearch,
    render: (p) => <StepProducts {...p} />,
    canNext: (d) => d.products.length >= 1,
    skippable: true,
  },
  {
    code: "facebook",
    title: "Kết nối kênh",
    benefit: "Nối Facebook hoặc Zalo để agent nhận tin nhắn của khách.",
    icon: Link2,
    render: (p) => <StepConnectChannel {...p} />,
    canNext: (d) => d.channels.fbConnected || d.channels.zaloConnected,
  },
];

// Data mẫu điền sẵn cho cả 4 bước (demo nhanh — nhất quán shop trái cây).
const INITIAL_DRAFT: OnboardingDraft = {
  shopName: "Shop Trái Cây An An",
  shopType: [],
  shopAddress: "182 Lê Đại Hành, Quận 11, TP.HCM",
  shopPhone: "0385 611 407",
  identity: DEFAULT_CONFIG.identity,
  products: SAMPLE_SUGGESTED_PRODUCTS,
  channels: { fbConnected: true, zaloConnected: false, pageName: "Shop Trái Cây An An" },
};

export function OnboardingWizard() {
  const setConfig = useAgentConfig((s) => s.setConfig);
  const resetSetup = useSetupStore((s) => s.reset);
  const showWelcome = useSetupStore((s) => s.showWelcome);
  const setPrototypeMode = usePrototypeStore((s) => s.setMode);

  // Vào Dashboard sau onboarding: shop vừa tạo nên Dashboard mặc định ở trạng thái chưa có dữ liệu (empty).
  const finishOnboarding = () => {
    resetSetup();
    showWelcome();
    setPrototypeMode("empty");
  };
  const [draft, setDraft] = useState<OnboardingDraft>(INITIAL_DRAFT);
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>("wizard");
  const [showChat, setShowChat] = useState(false); // chat thử nội tuyến ở màn "Sẵn sàng"

  const step = STEPS[index];
  const stepperItems = useMemo(
    () => STEPS.map((s) => ({ code: s.code, title: s.short ?? s.title })),
    [],
  );
  const update = (patch: Partial<OnboardingDraft>) => setDraft((d) => ({ ...d, ...patch }));

  const goNext = () => setIndex((i) => Math.min(STEPS.length - 1, i + 1));
  const goTo = (code: StepCode) => {
    const target = STEPS.findIndex((s) => s.code === code);
    if (target <= index) setIndex(target);
  };

  // Commit bản nháp vào nguồn sự thật chung. Các config khác giữ mặc định (chỉnh ở M6).
  const enable = useCallback(() => {
    setConfig({
      shopName: draft.shopName,
      shopType: draft.shopType,
      shopAddress: draft.shopAddress,
      shopPhone: draft.shopPhone,
      channels: { ...draft.channels, pageName: draft.shopName || draft.channels.pageName },
      identity: draft.identity,
      agentEnabled: true,
    });
    setPhase("ready");
  }, [draft, setConfig]);

  const provisioningLines = useMemo(() => {
    const channels =
      [draft.channels.fbConnected && "Facebook", draft.channels.zaloConnected && "Zalo"]
        .filter(Boolean)
        .join(" và ") || "kênh tin nhắn";
    return [
      `Đang tạo shop “${draft.shopName}”`,
      `Đang tạo agent “${draft.identity.name}”`,
      draft.products.length > 0 && `Đang thêm ${draft.products.length} sản phẩm`,
      `Đang kết nối ${channels}`,
    ].filter(Boolean) as string[];
  }, [
    draft.shopName,
    draft.identity.name,
    draft.products.length,
    draft.channels.fbConnected,
    draft.channels.zaloConnected,
  ]);

  if (phase === "provisioning") {
    return <ProvisioningScreen lines={provisioningLines} onComplete={enable} />;
  }

  if (phase === "ready") {
    return (
      <Card
        className={`w-full motion-safe:animate-in motion-safe:fade-in-0 motion-safe:zoom-in-95 ${
          showChat ? "max-w-2xl" : "max-w-md"
        }`}
      >
        <CardHeader>
          <div className="flex flex-col items-center gap-2 py-2 text-center">
            <CheckCircle2 className="size-12 text-emerald-500" aria-hidden />
            <h2 className="text-lg font-semibold">Agent đã sẵn sàng</h2>
            <p className="text-sm text-muted-foreground">
              {draft.shopName} đã có agent {draft.identity.name} trực tin nhắn.
            </p>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {showChat ? (
            <div
              key="chat"
              className="space-y-3 motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-right-4 motion-safe:duration-300"
            >
              <TestChatPanel
                agentName={draft.identity.name}
                pronoun={draft.identity.pronoun}
                product={draft.products[0]}
              />
              <Link
                href="/dashboard"
                onClick={finishOnboarding}
                className={buttonVariants({ size: "lg", className: "w-full" })}
              >
                Vào Dashboard
              </Link>
            </div>
          ) : (
            <div
              key="summary"
              className="space-y-4 motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-left-4 motion-safe:duration-300"
            >
              <ul className="space-y-2 rounded-lg border p-4 text-sm">
                <li className="flex justify-between">
                  <span className="text-muted-foreground">Shop</span>
                  <span>{draft.shopName}</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-muted-foreground">Agent</span>
                  <span>{draft.identity.name}</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-muted-foreground">Sản phẩm</span>
                  <span>{draft.products.length} sản phẩm</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-muted-foreground">Kênh</span>
                  <span>
                    {[
                      draft.channels.fbConnected && "Facebook",
                      draft.channels.zaloConnected && "Zalo",
                    ]
                      .filter(Boolean)
                      .join(", ") || "Chưa nối"}
                  </span>
                </li>
              </ul>
              <Button
                variant="outline"
                size="lg"
                className="w-full"
                onClick={() => setShowChat(true)}
              >
                <MessageSquare className="size-4" aria-hidden />
                Chat thử với {draft.identity.name}
              </Button>
              <Link
                href="/dashboard"
                onClick={finishOnboarding}
                className={buttonVariants({ size: "lg", className: "w-full" })}
              >
                Vào Dashboard
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  const isLast = index === STEPS.length - 1;
  const StepIcon = step.icon;

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader className="space-y-4">
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Clock className="size-4" aria-hidden />4 bước · khoảng 2 phút
        </div>

        <Stepper steps={stepperItems} current={index} onStepClick={(c) => goTo(c as StepCode)} />

        <StepHeader icon={StepIcon} title={step.title} benefit={step.benefit} />
      </CardHeader>

      <CardContent className="space-y-6">
        <div
          key={step.code}
          className="motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-right-3 motion-safe:duration-300"
        >
          {step.render({ draft, update })}
        </div>

        <div className="flex items-center justify-between border-t pt-4">
          <Button
            variant="ghost"
            size="lg"
            onClick={() => setIndex((i) => Math.max(0, i - 1))}
            disabled={index === 0}
          >
            <ArrowLeft className="size-4" aria-hidden />
            Quay lại
          </Button>

          {isLast ? (
            <Button size="lg" onClick={() => setPhase("provisioning")} disabled={!step.canNext(draft)}>
              <Check className="size-4" aria-hidden />
              Hoàn tất
            </Button>
          ) : (
            <div className="flex items-center gap-3">
              {step.skippable && (
                <button
                  type="button"
                  onClick={goNext}
                  className="rounded-md px-2 py-1 text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                >
                  Bỏ qua, thêm sau
                </button>
              )}
              <Button size="lg" onClick={goNext} disabled={!step.canNext(draft)}>
                Tiếp tục
                <ArrowRight className="size-4" aria-hidden />
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
