import { useAuth } from "@/_core/hooks/useAuth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { useTheme } from "@/contexts/ThemeContext";
import {
  BarChart3,
  Boxes,
  ChevronRight,
  CircleDollarSign,
  LayoutDashboard,
  LogOut,
  Moon,
  PackageSearch,
  Plus,
  Settings2,
  Sun,
  Truck,
  Zap,
} from "lucide-react";
import { useLocation } from "wouter";

const items = [
  { icon: LayoutDashboard, label: "Overview", path: "/", roles: ["admin", "manager", "staff"] },
  { icon: PackageSearch, label: "Products", path: "/products", roles: ["admin", "manager", "staff"] },
  { icon: Truck, label: "Suppliers", path: "/suppliers", roles: ["admin", "manager", "staff"] },
  { icon: Boxes, label: "Stock activity", path: "/stock", roles: ["admin", "manager"] },
  { icon: CircleDollarSign, label: "Sales & POS", path: "/sales", roles: ["admin", "manager", "staff"] },
  { icon: BarChart3, label: "Reports", path: "/reports", roles: ["admin", "manager"] },
  { icon: Settings2, label: "Settings", path: "/settings", roles: ["admin"] },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const [location, setLocation] = useLocation();
  const { theme, toggleTheme } = useTheme();

  const role = user?.role ?? "staff";
  const visibleItems = items.filter(item => item.roles.includes(role));
  const active = visibleItems.find(item => item.path === location) ?? visibleItems[0];
  const displayRole = role === "admin" ? "Administrator" : role === "manager" ? "Manager" : "Staff";

  return (
    <SidebarProvider defaultOpen>
      <Sidebar
        collapsible="icon"
        className="border-r border-border/80 bg-sidebar text-sidebar-foreground dark:border-white/[0.08]"
      >
        <SidebarHeader className="h-20 px-4 pt-4">
          <button
            onClick={() => setLocation("/")}
            className="flex w-full items-center gap-3 rounded-2xl p-1.5 text-left outline-none transition-all hover:bg-muted focus-visible:ring-2 focus-visible:ring-primary group-data-[collapsible=icon]:justify-center"
          >
            <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md shadow-primary/25">
              <Zap className="h-5 w-5" />
            </div>
            <div className="min-w-0 group-data-[collapsible=icon]:hidden">
              <div className="flex items-center gap-1.5">
                <span className="font-display text-lg font-black tracking-tight text-foreground">OPERRA</span>
                <span className="rounded-md bg-primary/10 px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wider text-primary">
                  NEXUS
                </span>
              </div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Command Hub
              </p>
            </div>
          </button>
        </SidebarHeader>

        <SidebarContent className="px-3 py-4">
          <div className="mb-2 px-3 flex items-center justify-between group-data-[collapsible=icon]:hidden">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">
              Navigation
            </span>
          </div>
          <SidebarMenu className="gap-1.5">
            {visibleItems.map(item => {
              const isActive = location === item.path;
              return (
                <SidebarMenuItem key={item.path}>
                  <SidebarMenuButton
                    isActive={isActive}
                    tooltip={item.label}
                    onClick={() => setLocation(item.path)}
                    className={`relative h-11 rounded-xl px-3 text-[13px] font-bold transition-all duration-150 ${
                      isActive
                        ? "bg-primary/10 text-primary font-bold before:absolute before:left-0 before:top-2.5 before:bottom-2.5 before:w-1 before:rounded-r-full before:bg-primary"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                  >
                    <item.icon
                      className={`h-[18px] w-[18px] transition-colors ${
                        isActive ? "text-primary" : "text-muted-foreground"
                      }`}
                    />
                    <span>{item.label}</span>
                    {isActive ? (
                      <ChevronRight className="ml-auto h-3.5 w-3.5 text-muted-foreground group-data-[collapsible=icon]:hidden" />
                    ) : null}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarContent>

        <SidebarFooter className="p-3">
          <div className="flex flex-col gap-2">
            {toggleTheme ? (
              <button
                onClick={toggleTheme}
                className="flex w-full items-center gap-3 rounded-xl bg-muted/40 px-3 py-2 text-xs font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground group-data-[collapsible=icon]:justify-center"
                title={`Switch to ${theme === "light" ? "Dark" : "Light"} mode`}
              >
                {theme === "light" ? (
                  <Moon className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Sun className="h-4 w-4 text-amber-400" />
                )}
                <span className="group-data-[collapsible=icon]:hidden">
                  {theme === "light" ? "Dark mode" : "Light mode"}
                </span>
              </button>
            ) : null}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex w-full items-center gap-3 rounded-xl bg-muted/40 p-2 text-left outline-none transition-all hover:bg-muted focus-visible:ring-2 focus-visible:ring-primary group-data-[collapsible=icon]:justify-center">
                  <Avatar className="h-9 w-9 border border-border">
                    <AvatarFallback className="bg-primary font-display text-xs font-black text-primary-foreground">
                      {user?.name?.charAt(0).toUpperCase() ?? "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1 group-data-[collapsible=icon]:hidden">
                    <p className="truncate text-sm font-bold text-foreground">
                      {user?.name ?? "Team member"}
                    </p>
                    <div className="mt-0.5 flex items-center gap-1">
                      <span className="inline-flex rounded-full bg-muted px-2 py-0.2 text-[10px] font-extrabold text-muted-foreground">
                        {displayRole}
                      </span>
                    </div>
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 rounded-2xl border-border p-2 shadow-xl backdrop-blur-xl">
                <DropdownMenuLabel className="px-2 py-1.5">
                  <p className="text-xs font-bold text-foreground">{user?.name}</p>
                  <p className="text-[11px] text-muted-foreground">{user?.email || "Signed in"}</p>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => setLocation("/settings")}
                  className="cursor-pointer rounded-xl px-2.5 py-2 text-xs font-semibold text-foreground hover:bg-muted"
                >
                  <Settings2 className="mr-2 h-4 w-4 text-muted-foreground" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={logout}
                  className="cursor-pointer rounded-xl px-2.5 py-2 text-xs font-semibold text-rose-600 focus:bg-rose-500/10 focus:text-rose-600 dark:text-rose-400"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </SidebarFooter>
      </Sidebar>

      <SidebarInset className="min-h-svh bg-background">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-border/80 bg-background/80 px-4 backdrop-blur-xl sm:px-7 dark:border-white/[0.08]">
          <div className="flex items-center gap-3">
            <SidebarTrigger className="h-9 w-9 rounded-xl border border-border bg-card shadow-xs hover:bg-muted" />
            <div className="hidden sm:block">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Operations
              </p>
              <p className="font-display text-sm font-bold text-foreground">
                {active?.label ?? "Workspace"}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-semibold text-muted-foreground shadow-xs sm:flex">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-indigo-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-indigo-500" />
              </span>
              <span>Live Telemetry</span>
            </div>

            <Button
              size="sm"
              onClick={() => setLocation("/sales")}
              className="h-9 rounded-xl bg-primary px-3.5 text-xs font-bold text-primary-foreground shadow-sm shadow-primary/25 hover:bg-primary/90"
            >
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              New Transaction
            </Button>
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1560px] p-4 sm:p-7 lg:p-8">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
