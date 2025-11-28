"use client";

import { AppSidebar } from "@/components/app-sidebar";
import { SidebarProvider, useSidebar } from "@/components/ui/sidebar";
import { useIsMobile } from "@/hooks/use-mobile";
import { Toaster } from "sonner";

function DashboardContent({ children }: { children: React.ReactNode }) {
  const isMobile = useIsMobile();
  const { state } = useSidebar();

  // Desktop/tablet: push content to avoid sidebar
  const sidebarWidth = state === "collapsed" ? "3rem" : "12rem";
  const margin = isMobile ? "0" : sidebarWidth;

  return (
    <main
      className="flex-1 overflow-auto transition-all duration-200 ease-linear"
      style={{ marginLeft: margin }}
    >
      <div className="w-full max-w-7xl mx-auto px-4 py-6">{children}</div>
    </main>
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
