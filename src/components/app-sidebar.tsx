import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { LayoutDashboard, Camera, Activity, ListChecks, Sparkles, LogOut, Shield, Palette, User } from "lucide-react";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarHeader, SidebarFooter, useSidebar,
} from "@/components/ui/sidebar";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const path = useRouterState({ select: (r) => r.location.pathname });
  const { isAdmin, signOut, user } = useAuth();
  const navigate = useNavigate();

  const items = [
    { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
    { title: "Tooth Scan", url: "/scan", icon: Camera },
    { title: "Risk Analysis", url: "/risk-analysis", icon: Activity },
    { title: "Recommendations", url: "/recommendations", icon: Sparkles },
    { title: "Habit Tracker", url: "/habit-tracker", icon: ListChecks },
    { title: "VITA Shades", url: "/shades", icon: Palette },
    { title: "Profile", url: "/profile", icon: User },
  ];

  async function handleSignOut() {
    await signOut();
    toast.success("Anda telah keluar");
    navigate({ to: "/" });
  }

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b">
        <Link to="/" className="flex items-center gap-2 px-2 py-2">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-primary-foreground" style={{ background: "var(--gradient-primary)" }}>
            <Sparkles className="h-4 w-4" />
          </span>
          {!collapsed && <span className="font-semibold tracking-tight">Tintify</span>}
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
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

        {isAdmin && (
          <SidebarGroup>
            <SidebarGroupLabel>Admin</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={path === "/admin"}>
                    <Link to="/admin" className="flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      {!collapsed && <span>Admin Panel</span>}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
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
