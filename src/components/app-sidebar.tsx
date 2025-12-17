"use client";

import { useState, useEffect } from "react";

import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  Home,
  BarChart3,
  Users,
  Settings,
  FileText,
  Calendar,
  DollarSign,
  TrendingUp,
  Percent,
  LogOut,
  User,
  Mail,
  Store,
  Sheet,
  BatteryChargingIcon,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { useAuthStore } from "@/store/useAuthStore";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Menu items.
const items = [
  {
    title: "Tabla",
    url: "/dashboard",
    icon: Home,
  },
  {
    title: "Liflet",
    url: "/dashboard/liflet",
    icon: Percent,
    items: [
      {
        title: "Zaduženja",
        url: "/dashboard/liflet/zaduzenja",
      },
      {
        title: "Uplate",
        url: "/dashboard/liflet/uplate",
      },
      {
        title: "Stanje",
        url: "/dashboard/liflet/stanje",
      },
    ],
  },
  {
    title: "Cene Raf",
    url: "/dashboard/cene_raf",
    icon: DollarSign,
  },
  {
    title: "Spisak za Raf",
    url: "/dashboard/spisak_raf",
    icon: Sheet,
  },
   {
    title: "Popisi Parcijalno",
    url: "/dashboard/popisi_parcijalno",
    icon: BatteryChargingIcon,
  },
  {
    title: "Email",
    url: "/dashboard/email",
    icon: Mail,
  },
  /*{
    title: "Analytics",
    url: "/dashboard/analytics",
    icon: BarChart3,
    items: [
      {
        title: "Overview",
        url: "/dashboard/analytics",
      },
      {
        title: "Reports",
        url: "/dashboard/analytics/reports",
      },
      {
        title: "Trends",
        url: "/dashboard/analytics/trends",
      },
    ],
  },
  {
    title: "Users",
    url: "/dashboard/users",
    icon: Users,
  },
  {
    title: "Finance",
    url: "/dashboard/finance",
    icon: DollarSign,
    items: [
      {
        title: "Transactions",
        url: "/dashboard/finance/transactions",
      },
      {
        title: "Budgets",
        url: "/dashboard/finance/budgets",
      },
      {
        title: "Reports",
        url: "/dashboard/finance/reports",
      },
    ],
  },
  {
    title: "Calendar",
    url: "/dashboard/calendar",
    icon: Calendar,
  },
  {
    title: "Documents",
    url: "/dashboard/documents",
    icon: FileText,
  },
  {
    title: "Settings",
    url: "/dashboard/settings",
    icon: Settings,
  },*/
];

export function AppSidebar() {
  const pathname = usePathname();
  const { user, isLoading, checkSession, setLoading } = useAuthStore();

  useEffect(() => {
    if (!user) {
      checkSession();
    } else if (isLoading) {
      setLoading(false);
    }
  }, [user, checkSession, isLoading, setLoading]);
  
  const userLevel = user?.level;
  const loading = isLoading;

  // Filter items based on user level
  const filteredItems = items.filter((item) => {
    if (item.url.startsWith("/dashboard/liflet") || item.url === "/dashboard/email") {
      return userLevel === "ADMIN";
    }
    return true;
  });

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <div className="flex items-center gap-2 px-4 py-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-primary-foreground overflow-hidden">
            <img
              src="/logo.png"
              alt="Borjak"
              className="h-16 w-16 object-contain rounded-lg"
            />
          </div>
          <div className="grid flex-1 text-left text-sm leading-tight">
            <span className="truncate font-semibold">Borjak</span>
            <span className="truncate text-xs text-muted-foreground">
              Kontrolna Tabla
            </span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {filteredItems.map((item) => {
                // Check if this item is active
                const isActive =
                  pathname === item.url ||
                  (item.url !== "/dashboard" && pathname.startsWith(item.url));

                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      tooltip={item.title}
                      isActive={isActive}
                    >
                      <Link href={item.url}>
                        <item.icon />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                    {item.items?.length ? (
                      <SidebarMenuSub>
                        {item.items.map((subItem) => {
                          const isSubItemActive = pathname === subItem.url;
                          return (
                            <SidebarMenuSubItem key={subItem.title}>
                              <SidebarMenuSubButton
                                asChild
                                isActive={isSubItemActive}
                              >
                                <Link href={subItem.url}>
                                  <span>{subItem.title}</span>
                                </Link>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          );
                        })}
                      </SidebarMenuSub>
                    ) : null}
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <div className="flex flex-col items-center gap-4 p-4">
          <ThemeToggle />
          <DropdownMenu>
            <DropdownMenuTrigger className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium cursor-pointer hover:opacity-90 transition-opacity">
              {loading ? "..." : (userLevel === "ADMIN" ? "AD" : "US")}
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>{loading ? "Loading..." : (userLevel === "ADMIN" ? "Admin User" : "User")}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={async () => {
                  try {
                    await fetch("/api/auth/logout", { method: "POST" });
                    window.location.href = "/";
                  } catch (error) {
                    console.error("Logout failed:", error);
                    window.location.href = "/";
                  }
                }}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Odjavi se
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="px-4 pb-2 text-xs text-muted-foreground text-center">
          © { new Date().getFullYear() } Borjak
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
