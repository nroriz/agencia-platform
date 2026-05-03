"use client";

import {
  LayoutDashboard,
  Calendar,
  CheckSquare,
  BarChart3,
  Users,
  Palette,
  Lightbulb,
  UserCircle,
  LogOut,
  Images,
  Zap,
  Camera,
  Download,
  Sparkles,
  Bot,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
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
} from "@/components/ui/sidebar";
import type { UserRole } from "@/types/database";

const adminNavItems = [
  { title: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { title: "Carrosseis", href: "/admin/carrosseis", icon: Images },
  { title: "Calendario", href: "/admin/calendario", icon: Calendar },
  { title: "Aprovacao", href: "/admin/aprovacao", icon: CheckSquare },
  { title: "Metricas", href: "/admin/metricas", icon: BarChart3 },
  { title: "Tenants", href: "/admin/tenants", icon: Users },
  { title: "Automacao", href: "/admin/automacao", icon: Bot },
];

const clientNavItems = [
  { title: "Dashboard", href: "/client", icon: LayoutDashboard },
  { title: "Carrosseis", href: "/client/carrosseis", icon: Images },
  { title: "Aprovacao", href: "/client/aprovacao", icon: CheckSquare },
  { title: "Downloads", href: "/client/downloads", icon: Download },
  { title: "Metricas", href: "/client/metricas", icon: BarChart3 },
  { title: "Fotos", href: "/client/fotos", icon: Camera },
  { title: "Estudio", href: "/client/estudio", icon: Sparkles },
  { title: "Minha Marca", href: "/client/marca", icon: Palette },
  { title: "Ideias", href: "/client/ideias", icon: Lightbulb },
];

interface AppSidebarProps {
  role: UserRole;
  userName: string;
}

export function AppSidebar({ role, userName }: AppSidebarProps) {
  const pathname = usePathname();
  const navItems = role === "admin" ? adminNavItems : clientNavItems;

  return (
    <Sidebar className="border-border/30">
      <SidebarHeader className="border-b border-border/30 px-5 py-5">
        <Link
          href={role === "admin" ? "/admin" : "/client"}
          className="flex items-center gap-2.5 group"
        >
          <div className="flex size-8 items-center justify-center rounded-lg bg-gradient-to-br from-orange-500 to-red-600 shadow-lg shadow-orange-500/20">
            <Zap className="size-4 text-white" />
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight group-hover:text-orange-400 transition-colors">
              Agencia
            </h1>
            <p className="text-[11px] text-muted-foreground leading-none">
              {role === "admin" ? "Painel Admin" : "Painel Cliente"}
            </p>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] uppercase tracking-widest text-muted-foreground/60 font-semibold px-1">
            Menu
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    render={<Link href={item.href} />}
                    isActive={
                      pathname === item.href ||
                      (item.href !== "/admin" &&
                        item.href !== "/client" &&
                        pathname.startsWith(item.href))
                    }
                  >
                    <item.icon className="size-4" />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-border/30">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton>
              <div className="flex size-6 items-center justify-center rounded-full bg-gradient-to-br from-neutral-600 to-neutral-800 text-[10px] font-bold text-white">
                {userName.charAt(0).toUpperCase()}
              </div>
              <span className="truncate text-sm font-medium">{userName}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={async () => {
                await fetch("/auth/signout", { method: "POST" });
                window.location.href = "/login";
              }}
            >
              <LogOut className="size-4 text-muted-foreground" />
              <span className="text-muted-foreground">Sair</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
