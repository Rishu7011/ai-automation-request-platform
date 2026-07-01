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
import { Users, Shield, BarChart2, LayoutDashboard, FileText, Eye, LogOut, Sun, Moon } from "lucide-react"
import Image from 'next/image'
import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut, useSession } from "next-auth/react"
import { useTheme } from "next-themes"
import NotificationBell from "./NotificationBell"

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  exact?: boolean;
}

const employeeItems: NavItem[] = [
  { href: '/my-requests', label: 'My Requests', icon: <FileText />, exact: true },
  { href: '/ledger', label: 'Company Ledger', icon: <Eye />, exact: true },
];

const engineeringItems: NavItem[] = [
  { href: '/admin/requests', label: 'Pipeline', icon: <LayoutDashboard /> },
  { href: '/admin/analytics', label: 'Analytics', icon: <BarChart2 /> },
];

const systemItems: NavItem[] = [
  { href: '/admin/users', label: 'Users', icon: <Users /> },
  { href: '/admin/audit-log', label: 'Audit Log', icon: <Shield /> },
];

function isActive(pathname: string, href: string, exact?: boolean) {
  return exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
}

function NavigationItem({ item }: { item: NavItem }) {
  const pathname = usePathname();
  const { isMobile, setOpenMobile } = useSidebar();
  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        render={<Link href={item.href} />}
        isActive={isActive(pathname, item.href, item.exact)}
        tooltip={item.label}
        onClick={() => isMobile && setOpenMobile(false)}
        className="h-11 gap-3 rounded-lg text-base text-[#5f6470] [&_svg]:size-5 hover:bg-[#f1f5f9] hover:text-[#191c1e] data-active:bg-[#dbeafe] data-active:text-[#004ac6]"
      >
        {item.icon}
        <span>{item.label}</span>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

function NavigationGroup({ label, items }: { label?: string; items: NavItem[] }) {
  return (
    <SidebarGroup className="px-3 py-1.5">
      {label && <SidebarGroupLabel className="px-2 text-[10px] font-semibold uppercase tracking-[0.08em] text-[#737686]">{label}</SidebarGroupLabel>}
      <SidebarGroupContent>
        <SidebarMenu className="gap-1">
          {items.map((item) => <NavigationItem key={item.href} item={item} />)}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

function DarkModeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted ? resolvedTheme === 'dark' : false;

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        tooltip={isDark ? "Light Mode" : "Dark Mode"}
        onClick={() => setTheme(isDark ? 'light' : 'dark')}
        className="h-11 gap-3 rounded-lg text-base text-[#5f6470] [&_svg]:size-5 hover:bg-[#f1f5f9] hover:text-[#191c1e]"
      >
        {isDark ? (
          <Sun className="text-amber-500" />
        ) : (
          <Moon className="text-slate-600" />
        )}
        <span>{isDark ? 'Light Mode' : 'Dark Mode'}</span>
      </SidebarMenuButton>
    </SidebarMenuItem>
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
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <div className="flex justify-between items-center px-1">
          {state === 'expanded' &&
            <Image src="/logo.png" width={500} height={500} alt="AI Automation logo" className="h-12 w-12 shrink-0 rounded-lg object-cover" priority />
          }
          <SidebarTrigger className='h-10 w-10' />
        </div>
      </SidebarHeader>

      <SidebarContent className="font-medium">
        <NavigationGroup items={employeeItems} />
        {isAnyAdmin && <NavigationGroup label="Engineering Admin" items={engineeringItems} />}
        {isSysAdmin && <NavigationGroup label="System Admin" items={systemItems} />}
        
        <SidebarGroup className="px-3 py-1.5 mt-auto">
          <SidebarGroupContent>
            <SidebarMenu className="gap-1">
              <DarkModeToggle />
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-[#dfe3e8] p-3 font-medium">
        <div className="flex items-center gap-2 px-2 py-1 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0">
          <NotificationBell />
          <span className="text-sm font-medium text-[#5f6470] group-data-[collapsible=icon]:hidden">Notifications</span>
        </div>
        <div className="flex items-center gap-2.5 rounded-lg border border-[#dfe3e8] bg-white p-2.5 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:border-0 group-data-[collapsible=icon]:p-0">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-blue-100 bg-blue-50 text-sm font-semibold text-[#004ac6]">
            {userName.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1 group-data-[collapsible=icon]:hidden">
            <p className="truncate text-sm font-semibold text-[#191c1e]">{userName}</p>
            <p className="truncate text-xs text-[#5f6470]">{roleLabel}</p>
          </div>
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="rounded-md p-1.5 text-[#737686] hover:bg-rose-50 hover:text-rose-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#004ac6] group-data-[collapsible=icon]:hidden"
            aria-label="Sign out"
            title="Sign out"
          >
            <LogOut className="h-[18px] w-[18px]" />
          </button>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
