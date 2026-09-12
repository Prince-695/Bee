import { DesktopSidebar } from "./DesktopSidebar";
import { DesktopHeader } from "./DesktopHeader";

interface DesktopLayoutProps {
  children: React.ReactNode;
}

export function DesktopLayout({ children }: DesktopLayoutProps) {
  return (
    <div className="flex h-screen w-full bg-background text-foreground overflow-hidden font-sans selection:bg-primary/20 transition-colors duration-200">
      <DesktopSidebar />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <DesktopHeader />
        <main className="flex-1 overflow-y-auto overflow-x-hidden relative bg-background transition-colors duration-200">
          {children}
        </main>
      </div>
    </div>
  );
}
