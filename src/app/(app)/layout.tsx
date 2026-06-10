import { AppShell } from "@/components/shell/AppShell";
import { AppTour } from "@/components/tour/AppTour";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppTour>
      <AppShell>{children}</AppShell>
    </AppTour>
  );
}
