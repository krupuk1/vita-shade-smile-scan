import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { Shield, LayoutDashboard, Users, Camera, Sparkles, ArrowLeft, LogOut, FileText, Settings } from "lucide-react";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarHeader, SidebarFooter, useSidebar,
} from "@/components/ui/sidebar";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";

export function AdminSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const path = useRouterState({ select: (r) => r.location.pathname });
  const { signOut, user } = useAuth();
  const navigate = useNavigate();

  const manage = [
    { title: "Overview", url: "/admin", icon: LayoutDashboard },
    { title: "Pengguna", url: "/admin/users", icon: Users },
    { title: "Artikel", url: "/admin/articles", icon: FileText },
  ];
  const data = [
    { title: "Scan", url: "/admin/scans", icon: Camera },
    { title: "Rekomendasi AI", url: "/admin/recommendations", icon: Sparkles },
  ];
  const system = [
    { title: "Settings", url: "/admin/settings", icon: Settings },
  ];

  async function handleSignOut() {
    await signOut();
    toast.success("Anda telah keluar");
    navigate({ to: "/" });
  }

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b">
        <Link to="/admin" className="flex items-center gap-2 px-2 py-2">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 text-white">
            <Shield className="h-4 w-4" />
          </span>
          {!collapsed && <span className="font-semibold tracking-tight">Admin Panel</span>}
        </Link>
      </SidebarHeader>

      <SidebarContent>
        {[
          { label: "Manajemen", items: manage },
          { label: "Data", items: data },
          { label: "Sistem", items: system },
        ].map((grp) => (
          <SidebarGroup key={grp.label}>
            <SidebarGroupLabel>{grp.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {grp.items.map((item) => (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton asChild isActive={path === item.url}>
                      <Link to={item.url} className="flex items-center gap-2">
                        <item.icon className="h-4 w-4" />
                        {!collapsed && <span>{item.title}</span>}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}

        <SidebarGroup>
          <SidebarGroupLabel>Navigasi</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link to="/dashboard" className="flex items-center gap-2">
                    <ArrowLeft className="h-4 w-4" />
                    {!collapsed && <span>Kembali ke App</span>}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t">
        {!collapsed && user && (
          <div className="px-2 py-1.5 text-xs text-muted-foreground truncate">{user.email}</div>
        )}
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={handleSignOut}>
              <LogOut className="h-4 w-4" />
              {!collapsed && <span>Keluar</span>}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
