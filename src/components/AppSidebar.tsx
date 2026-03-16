import {
  LayoutDashboard, Briefcase, Wallet, PlusCircle, ShoppingBag, DollarSign,
  Users, Shield, AlertTriangle, LogOut, User, PanelLeft,
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
  { title: "Dashboard", url: "/client",  icon: LayoutDashboard },
  { title: "My Wallet", url: "/wallet",     icon: Wallet          },
  { title: "Post a Gig",url: "/post-gig",   icon: PlusCircle      },
  { title: "My Gigs",   url: "/my-gigs",    icon: Briefcase       },
  { title: "Profile",   url: "/profile",    icon: User            },
];

const hustlerLinks = [
  { title: "Dashboard",   url: "/hustler",   icon: LayoutDashboard },
  { title: "Marketplace", url: "/marketplace", icon: ShoppingBag     },
  { title: "My Jobs",     url: "/my-jobs",     icon: Briefcase       },
  { title: "Earnings",    url: "/earnings",    icon: DollarSign      },
  { title: "Profile",     url: "/profile",     icon: User            },
];

const adminLinks = [
  { title: "Dashboard",         url: "/admin",                   icon: LayoutDashboard },
  { title: "KYC Queue",         url: "/admin/kyc",               icon: Shield          },
  { title: "All Gigs",          url: "/admin/gigs",              icon: Briefcase       },
  { title: "Disputes",          url: "/admin/disputes",          icon: AlertTriangle   },
  { title: "Users",             url: "/admin/users",             icon: Users           },
  { title: "Pricing",           url: "/admin/pricing",           icon: DollarSign      },
  { title: "Pricing Overrides", url: "/admin/pricing-overrides", icon: DollarSign      },
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
      className="rounded-lg text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors duration-150"
    >
      <PanelLeft className="h-4 w-4 transition-transform duration-300" style={{ transform: collapsed ? "rotate(180deg)" : "rotate(0deg)" }} />
    </Button>
  );
}

export function AppSidebar() {
  const { profile, signOut } = useAuth();
  const { state } = useSidebar();
  const collapsed = state === "collapsed";

  const role  = profile?.role;
  const links = role === "admin" ? adminLinks : role === "hustler" ? hustlerLinks : clientLinks;
  const label = role === "admin" ? "Admin" : role === "hustler" ? "Hustler" : "Client";

  return (
    <Sidebar
      collapsible="icon"
      className="border-r border-border bg-white dark:bg-card [&>div]:transition-all [&>div]:duration-300"
    >
      {/* Header */}
      <div className="h-14 border-b border-gray-200 dark:border-sidebar-border flex items-center justify-between px-4 shrink-0 bg-white dark:bg-sidebar">
        {!collapsed ? (
          <>
            <Link to="/" className="hover:opacity-80 transition-opacity duration-150">
              <h1 className="text-xl font-bold tracking-tight text-gray-900 dark:text-foreground">
                Gig<span className="text-primary">Hold</span>
              </h1>
            </Link>
            <SidebarCollapseButton />
          </>
        ) : (
          <div className="w-full flex justify-center">
            <Link to="/" className="hover:opacity-80 transition-opacity duration-150">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 border border-primary/20">
                <Shield className="h-3.5 w-3.5 text-primary" />
              </div>
            </Link>
          </div>
        )}
      </div>

      {/* Content */}
      <SidebarContent className="bg-white dark:bg-sidebar scrollbar-none">
        <SidebarGroup>
          {!collapsed && (
            <SidebarGroupLabel className="text-gray-500 dark:text-sidebar-foreground/40 uppercase text-[10px] tracking-widest font-semibold px-3 mb-1">
              {label}
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent className="py-2 px-2">
            <SidebarMenu className="gap-0.5">
              {links.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild tooltip={collapsed ? item.title : undefined}>
                    {/* Use the activeClassName prop instead of className function */}
                    <NavLink
                      to={item.url}
                      end={item.url === "/client" || item.url === "/hustler" || item.url === "/admin"}
                      className="flex items-center gap-3 px-2.5 py-2 rounded-xl text-sm w-full text-gray-700 dark:text-sidebar-foreground hover:bg-gray-100 dark:hover:bg-sidebar-accent hover:text-gray-900 dark:hover:text-sidebar-accent-foreground transition-colors duration-150"
                      activeClassName="!bg-primary/10 !text-primary !font-semibold"
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

      {/* Footer */}
      <SidebarFooter className="border-t border-gray-200 dark:border-sidebar-border p-3 mt-auto shrink-0 bg-white dark:bg-sidebar">
        <div className="flex flex-col items-center gap-2">
          {collapsed && <SidebarCollapseButton />}
          <Button
            variant="ghost"
            size={collapsed ? "icon" : "default"}
            onClick={signOut}
            className={
              collapsed
                ? "rounded-xl text-gray-700 dark:text-sidebar-foreground hover:bg-red-50 dark:hover:bg-destructive/10 hover:text-red-600 dark:hover:text-destructive transition-colors duration-150"
                : "w-full justify-start gap-3 px-2.5 rounded-xl text-gray-700 dark:text-sidebar-foreground hover:bg-red-50 dark:hover:bg-destructive/10 hover:text-red-600 dark:hover:text-destructive transition-colors duration-150"
            }
          >
            <LogOut className="h-4 w-4" />
            {!collapsed && <span>Sign Out</span>}
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
