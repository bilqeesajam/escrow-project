import {
  LayoutDashboard, Briefcase, Wallet, PlusCircle, ShoppingBag, DollarSign,
  Users, Shield, AlertTriangle, LogOut, User, PanelLeft
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useAuth } from "@/lib/auth-context";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarFooter, useSidebar,
} from "@/components/ui/sidebar";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const clientLinks = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "My Wallet", url: "/wallet", icon: Wallet },
  { title: "Post a Gig", url: "/post-gig", icon: PlusCircle },
  { title: "My Gigs", url: "/my-gigs", icon: Briefcase },
  { title: "Profile", url: "/profile", icon: User },
];

const hustlerLinks = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Marketplace", url: "/marketplace", icon: ShoppingBag },
  { title: "My Jobs", url: "/my-jobs", icon: Briefcase },
  { title: "Earnings", url: "/earnings", icon: DollarSign },
  { title: "Profile", url: "/profile", icon: User },
];

const adminLinks = [
  { title: "Dashboard", url: "/admin", icon: LayoutDashboard },
  { title: "KYC Queue", url: "/admin/kyc", icon: Shield },
  { title: "All Gigs", url: "/admin/gigs", icon: Briefcase },
  { title: "Disputes", url: "/admin/disputes", icon: AlertTriangle },
  { title: "Users", url: "/admin/users", icon: Users },
  { title: "Pricing", url: "/admin/pricing", icon: DollarSign },
  { title: "Pricing Overrides", url: "/admin/pricing-overrides", icon: DollarSign },
];

export function SidebarCollapseButton() {
  const { toggleSidebar, state } = useSidebar();
  const collapsed = state === "collapsed";

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleSidebar}
      title={collapsed ? "Expand Sidebar" : "Collapse Sidebar"}
      className="rounded-lg text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
    >
      <PanelLeft className="h-4 w-4" />
    </Button>
  );
}

export function AppSidebar() {
  const { profile, signOut } = useAuth();
  const { state, toggleSidebar } = useSidebar();
  const collapsed = state === "collapsed";

  const role = profile?.role;
  const links = role === "admin" ? adminLinks : role === "hustler" ? hustlerLinks : clientLinks;
  const label = role === "admin" ? "Admin" : role === "hustler" ? "Hustler" : "Client";

  return (
    <Sidebar collapsible="icon" className="border-r-0">
      {/* 1. Header Area - Fixed height to match main header */}
      <div className="h-14 border-b border-sidebar-border flex items-center justify-between px-4 shrink-0 bg-sidebar">
        {!collapsed ? (
          <>
            <Link to="/">
              <h1 className="text-xl font-bold">
                Gig<span className="text-primary">Hold</span>
              </h1>
            </Link>
            <SidebarCollapseButton />
          </>
        ) : (
          <div className="w-full flex justify-center">
            <span className="text-primary font-bold text-lg">G</span>
          </div>
        )}
      </div>

      {/* 2. Content Area - Let the component handle the scrolling */}
      <SidebarContent className="bg-sidebar scrollbar-none">
        <SidebarGroup>
          {!collapsed && (
            <SidebarGroupLabel className="text-sidebar-foreground/50 uppercase text-[10px] tracking-widest">
              {label}
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent className="py-3">
            <SidebarMenu className="gap-1">
              {links.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild tooltip={collapsed ? item.title : undefined}>
                    <NavLink
                      to={item.url}
                      end={item.url === "/dashboard" || item.url === "/admin"}
                      className="flex items-center gap-3 px-3 py-2 rounded-lg text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
                      activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* 3. Footer Area */}
      <SidebarFooter className="border-t border-sidebar-border p-3 mt-auto shrink-0">
          <div className="flex flex-col items-center gap-2">
            {collapsed && <SidebarCollapseButton />}
            <Button
              variant="ghost"
              size={collapsed ? "icon" : "default"}
              onClick={signOut}
              className={collapsed ? "rounded-lg text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors" : "w-full justify-start gap-3 px-3 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"}
            >
              <LogOut className="h-4 w-4" />
              {!collapsed && <span>Sign Out</span>}
            </Button>
          </div>
        </SidebarFooter>
    </Sidebar>
  );
}
