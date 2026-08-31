import { useState } from "react";
import { DesktopSidebar } from "./DesktopSidebar";
import { DesktopHeader } from "./DesktopHeader";

interface DesktopLayoutProps {
  children: React.ReactNode;
}

export function DesktopLayout({ children }: DesktopLayoutProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="flex h-screen w-full bg-background text-foreground overflow-hidden font-sans selection:bg-amber-500/20">
      <DesktopSidebar collapsed={collapsed} onToggleCollapse={() => setCollapsed(!collapsed)} />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <DesktopHeader />
        <main className="flex-1 overflow-y-auto overflow-x-hidden relative bg-black/40">
          {children}
        </main>
      </div>
    </div>
  );
}
