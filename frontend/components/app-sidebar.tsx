"use client"

import * as React from "react"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenuButton,
  SidebarTrigger,
  SidebarMenuItem,
  useSidebar,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu
} from "@/components/ui/sidebar"
import { Users, Shield, BarChart2, LayoutDashboard, FileText, Eye, LogOut, PlusCircle, Sliders } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut, useSession } from "next-auth/react"
import NotificationBell from "./NotificationBell"

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  exact?: boolean;
}

const employeeItems: NavItem[] = [
  { href: '/my-requests', label: 'My Requests', icon: <FileText className="size-4 text-[#4edea3]" />, exact: true },
  { href: '/ledger', label: 'Company Ledger', icon: <Eye className="size-4 text-[#c0c1ff]" />, exact: true },
];

const engineeringItems: NavItem[] = [
  { href: '/admin/requests', label: 'Requests Backlog', icon: <LayoutDashboard className="size-4 text-[#c0c1ff]" /> },
  { href: '/admin/analytics', label: 'Portfolio Analytics', icon: <BarChart2 className="size-4 text-[#ffb95f]" /> },
];

const systemItems: NavItem[] = [
  { href: '/admin/users', label: 'User Management', icon: <Users className="size-4 text-[#c0c1ff]" /> },
  { href: '/admin/audit-log', label: 'Security Audit Log', icon: <Shield className="size-4 text-[#ffb4ab]" /> },
  // { href: '/admin/settings/priority-weights', label: 'Priority Settings', icon: <Sliders className="size-4 text-[#c0c1ff]" /> },
];

function isActive(pathname: string, href: string, exact?: boolean) {
  return exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
}

function NavigationItem({ item }: { item: NavItem }) {
  const pathname = usePathname();
  const { isMobile, setOpenMobile } = useSidebar();
  const active = isActive(pathname, item.href, item.exact);

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        render={<Link href={item.href} />}
        isActive={active}
        tooltip={item.label}
        onClick={() => isMobile && setOpenMobile(false)}
        className={`h-10 gap-3 rounded-md px-3 text-xs font-medium transition-all ${
          active
            ? 'bg-[#00a572]/15 text-[#4edea3] border-r-2 border-[#4edea3] font-semibold'
            : 'text-[#c7c4d7] hover:bg-[#34343d]/50 hover:text-white'
        }`}
      >
        {item.icon}
        <span>{item.label}</span>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

function NavigationGroup({ label, items }: { label?: string; items: NavItem[] }) {
  return (
    <SidebarGroup className="px-2 py-1.5">
      {label && (
        <SidebarGroupLabel className="px-2 text-[10px] font-bold uppercase tracking-wider text-[#908fa0] font-outfit">
          {label}
        </SidebarGroupLabel>
      )}
      <SidebarGroupContent>
        <SidebarMenu className="gap-1">
          {items.map((item) => <NavigationItem key={item.href} item={item} />)}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const { state } = useSidebar();

  if (status === 'loading' || !session || pathname === '/login' || pathname === '/register') return null;

  const role = (session.user as { role?: string } | undefined)?.role;
  const department = (session.user as { department?: string } | undefined)?.department || 'Employee';
  const isSysAdmin = role === 'sys_admin';
  const isAnyAdmin = isSysAdmin || role === 'eng_admin';
  const userName = session.user?.name || session.user?.email?.split('@')[0] || 'User';
  const roleLabel = isSysAdmin ? 'System Admin' : role === 'eng_admin' ? 'Engineering Admin' : department;

  return (
    <Sidebar collapsible="icon" className="border-r border-[#464554]/30 bg-[#13131b] text-[#e4e1ed]" {...props}>
      <SidebarHeader className="border-b border-[#464554]/30 p-4">
        <div className="flex items-center justify-between">
          {state === 'expanded' && (
            <div>
              <h1 className="font-outfit text-base font-bold text-[#c0c1ff]">AI Automate</h1>
              <p className="text-[10px] text-[#908fa0] font-inter uppercase tracking-wider">Admin Console</p>
            </div>
          )}
          <SidebarTrigger className="h-8 w-8 text-[#908fa0] hover:text-white" />
        </div>

        {state === 'expanded' && (
          <Link
            href="/intake/new"
            className="mt-3 flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-indigo-600 to-[#8083ff] px-3 py-2 text-xs font-semibold text-white transition-all hover:brightness-110 shadow-md shadow-[#6366f1]/30 active:scale-[0.98]"
          >
            <PlusCircle className="h-4 w-4" />
            <span>+ New Request</span>
          </Link>
        )}
      </SidebarHeader>

      <SidebarContent className="font-inter space-y-1 py-2">
        <NavigationGroup label="General" items={employeeItems} />
        {isAnyAdmin && <NavigationGroup label="Pipeline & Backlog" items={engineeringItems} />}
        {isSysAdmin && <NavigationGroup label="Governance & System" items={systemItems} />}
      </SidebarContent>

      <SidebarFooter className="border-t border-[#464554]/30 p-3">
        <div className="flex items-center gap-2 px-2 py-1 group-data-[collapsible=icon]:justify-center">
          <NotificationBell />
          <span className="text-xs font-medium text-[#c7c4d7] group-data-[collapsible=icon]:hidden">Notifications</span>
        </div>
        <div className="flex items-center gap-2.5 rounded-lg border border-[#464554]/40 bg-[#1f1f27] p-2.5 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:border-0 group-data-[collapsible=icon]:p-0">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-[#8083ff]/30 bg-[#6366f1]/20 text-xs font-bold text-[#c0c1ff] font-outfit">
            {userName.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1 group-data-[collapsible=icon]:hidden">
            <p className="truncate text-xs font-semibold text-[#e4e1ed]">{userName}</p>
            <p className="truncate text-[10px] text-[#908fa0]">{roleLabel}</p>
          </div>
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="rounded-md p-1.5 text-[#908fa0] hover:bg-[#ffb4ab]/15 hover:text-[#ffb4ab] transition-colors group-data-[collapsible=icon]:hidden"
            aria-label="Sign out"
            title="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}

