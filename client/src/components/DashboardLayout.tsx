import { useAuth } from "@/_core/hooks/useAuth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarInset, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { BarChart3, Boxes, ChevronRight, CircleDollarSign, LayoutDashboard, LogOut, PackageSearch, Settings2, Truck, UsersRound } from "lucide-react";
import { useLocation } from "wouter";

const items = [
  { icon: LayoutDashboard, label: "Overview", path: "/", roles: ["admin", "manager", "staff"] },
  { icon: PackageSearch, label: "Products", path: "/products", roles: ["admin", "manager", "staff"] },
  { icon: Truck, label: "Suppliers", path: "/suppliers", roles: ["admin", "manager", "staff"] },
  { icon: Boxes, label: "Stock activity", path: "/stock", roles: ["admin", "manager"] },
  { icon: CircleDollarSign, label: "Sales", path: "/sales", roles: ["admin", "manager", "staff"] },
  { icon: BarChart3, label: "Reports", path: "/reports", roles: ["admin", "manager"] },
  { icon: Settings2, label: "Settings", path: "/settings", roles: ["admin"] },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const [location, setLocation] = useLocation();
  const role = user?.role ?? "staff";
  const visibleItems = items.filter(item => item.roles.includes(role));
  const active = visibleItems.find(item => item.path === location) ?? visibleItems[0];
  const displayRole = role === "admin" ? "Administrator" : role === "manager" ? "Manager" : "Staff";
  return (
    <SidebarProvider defaultOpen>
      <Sidebar collapsible="icon" className="border-r-0 [&_[data-sidebar=sidebar]]:bg-[#102b24] [&_[data-sidebar=sidebar]]:text-[#e8f0e9]">
        <SidebarHeader className="h-[88px] px-4 pt-5">
          <button onClick={() => setLocation("/")} className="flex w-full items-center gap-3 rounded-xl text-left outline-none focus-visible:ring-2 focus-visible:ring-[#94d2ac] group-data-[collapsible=icon]:justify-center">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#e6f4e9] font-display text-lg font-bold tracking-[-0.12em] text-[#195b42]">O</div>
            <div className="min-w-0 group-data-[collapsible=icon]:hidden"><p className="font-display text-lg font-semibold tracking-[-0.035em] text-white">Operra</p><p className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.17em] text-[#90a9a0]">Operations hub</p></div>
          </button>
        </SidebarHeader>
        <SidebarContent className="px-3 py-3">
          <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-[#789087] group-data-[collapsible=icon]:hidden">Workspace</p>
          <SidebarMenu>
            {visibleItems.map(item => <SidebarMenuItem key={item.path}><SidebarMenuButton isActive={location === item.path} tooltip={item.label} onClick={() => setLocation(item.path)} className="h-11 rounded-xl px-3 text-[#afc1b8] transition-colors hover:bg-white/8 hover:text-white data-[active=true]:bg-[#285e4a] data-[active=true]:font-semibold data-[active=true]:text-white"><item.icon className="h-[18px] w-[18px]"/><span>{item.label}</span>{location === item.path ? <ChevronRight className="ml-auto h-3.5 w-3.5 group-data-[collapsible=icon]:hidden"/> : null}</SidebarMenuButton></SidebarMenuItem>)}
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter className="p-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild><button className="flex w-full items-center gap-3 rounded-xl bg-white/6 p-2 text-left outline-none transition-colors hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-[#94d2ac] group-data-[collapsible=icon]:justify-center"><Avatar className="h-8 w-8 border border-white/10"><AvatarFallback className="bg-[#d9ede0] text-xs font-bold text-[#1b5b42]">{user?.name?.charAt(0).toUpperCase() ?? "U"}</AvatarFallback></Avatar><div className="min-w-0 flex-1 group-data-[collapsible=icon]:hidden"><p className="truncate text-sm font-semibold text-white">{user?.name ?? "Team member"}</p><p className="mt-0.5 text-[11px] text-[#96aa9f]">{displayRole}</p></div></button></DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52 rounded-xl border-[#dfe7df] p-1.5"><DropdownMenuLabel className="text-xs font-medium text-[#6a786f]">Signed in as {displayRole}</DropdownMenuLabel><DropdownMenuSeparator/><DropdownMenuItem onClick={logout} className="cursor-pointer rounded-lg text-[#b0473c] focus:bg-[#fdeae8] focus:text-[#a43f36]"><LogOut className="mr-2 h-4 w-4"/>Sign out</DropdownMenuItem></DropdownMenuContent>
          </DropdownMenu>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset className="min-h-svh bg-[#f7f8f5]">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-[#e5e9e3] bg-[#f7f8f5]/92 px-4 backdrop-blur-xl sm:px-7"><div className="flex items-center gap-3"><SidebarTrigger className="h-9 w-9 rounded-xl bg-white text-[#405047] shadow-sm ring-1 ring-[#e2e7e1] hover:bg-white"/><div className="hidden sm:block"><p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#809087]">Operations</p><p className="mt-0.5 text-sm font-semibold text-[#34443b]">{active?.label ?? "Workspace"}</p></div></div><div className="hidden items-center gap-2 text-xs font-medium text-[#65746b] sm:flex"><span className="h-2 w-2 rounded-full bg-[#54aa75] shadow-[0_0_0_4px_rgba(84,170,117,.12)]"/>System operational</div></header>
        <main className="mx-auto w-full max-w-[1560px] p-4 sm:p-7 lg:p-8">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
