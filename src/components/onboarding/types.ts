import type { AgentConfig } from "@/data/config";
import type { DraftProduct } from "@/data/onboarding";

// Bản nháp onboarding — gom giá trị từng bước, commit vào agentConfigStore khi hoàn tất.
// Các config còn lại (ngưỡng tự chốt, hand-off, BYOK, kênh báo…) dùng mặc định, chỉnh ở M6 sau.
export type OnboardingDraft = {
  shopName: string;
  shopType: AgentConfig["shopType"];
  shopAddress: string;
  shopPhone: string;
  identity: AgentConfig["identity"];
  products: DraftProduct[];
  channels: AgentConfig["channels"];
};

export type StepProps = {
  draft: OnboardingDraft;
  update: (patch: Partial<OnboardingDraft>) => void;
};
