"use client";

import { AppSidebar } from "@/components/app-sidebar";
import { SidebarProvider, useSidebar } from "@/components/ui/sidebar";
import { useIsMobile } from "@/hooks/use-mobile";
import { Toaster } from "sonner";

function DashboardContent({ children }: { children: React.ReactNode }) {
  const isMobile = useIsMobile();
  const { state } = useSidebar();

  if (isMobile) {
    return (
      <div className="flex flex-col h-screen">
        <main className="flex-1 overflow-auto">
          <div className="h-full w-full px-2 py-6">{children}</div>
        </main>
      </div>
    );
  }

  // Desktop/tablet: account for sidebar width
  const sidebarWidth = state === "collapsed" ? "3rem" : "16rem";

  return (
    <div
      className="flex flex-col h-screen"
      style={{ marginLeft: sidebarWidth }}
    >
      <main className="flex-1 overflow-auto">
        <div className="h-full w-full px-2 py-6">{children}</div>
      </main>
    </div>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <DashboardContent>{children}</DashboardContent>
      <Toaster />
    </SidebarProvider>
  );
}
