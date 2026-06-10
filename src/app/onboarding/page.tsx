import Link from "next/link";
import { Sparkles } from "lucide-react";
import { OnboardingWizard } from "@/components/onboarding/OnboardingWizard";

export default function OnboardingPage() {
  return (
    <div className="flex min-h-dvh flex-col bg-gradient-to-b from-primary/5 via-background to-background">
      <header className="flex items-center justify-between px-6 py-4">
        <span className="flex items-center gap-2 text-sm font-semibold">
          <span className="flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Sparkles className="size-4" aria-hidden />
          </span>
          Fanpage AI Agent
        </span>
        <Link
          href="/dashboard"
          className="rounded-md px-3 py-2 text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        >
          Để sau
        </Link>
      </header>

      <main className="flex flex-1 items-center justify-center p-4 pb-10 sm:p-6">
        <OnboardingWizard />
      </main>
    </div>
  );
}
