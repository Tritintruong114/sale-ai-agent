import { OnboardingWizard } from "@/components/onboarding/OnboardingWizard";

export default function OnboardingPage() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-gradient-to-b from-primary/5 via-background to-background p-4 sm:p-6">
      <OnboardingWizard />
    </main>
  );
}
