import { AppShell } from "@/components/shell/AppShell";
import { AppTour } from "@/components/tour/AppTour";
import { TooltipProvider } from "@/components/ui/tooltip";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <TooltipProvider delay={150}>
      <AppTour>
        <AppShell>{children}</AppShell>
      </AppTour>
    </TooltipProvider>
  );
}
