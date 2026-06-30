'use client';

import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import {
  LayoutDashboard,
  FileText,
  Eye,
  BarChart2,
  Users,
  Shield,
  Settings,
  ChevronRight,
  ChevronLeft,
  LogOut,
  Plus,
  Bell,
  ChevronDown,
  ChevronUp,
  Menu,
  X,
} from 'lucide-react';
import NotificationBell from './NotificationBell';

// ─── Types ─────────────────────────────────────────────────────────────────────

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  exact?: boolean;
}

interface NavSection {
  title?: string;
  items: NavItem[];
  roleRequired?: 'any_admin' | 'eng_admin' | 'sys_admin';
}

// ─── Nav config ───────────────────────────────────────────────────────────────

const EMPLOYEE_SECTION: NavSection = {
  items: [
    { href: '/my-requests', label: 'My Requests',    icon: <FileText className="h-4 w-4" />, exact: true },
    { href: '/ledger',      label: 'Company Ledger', icon: <Eye className="h-4 w-4" />, exact: true },
  ],
};

const ENG_ADMIN_SECTION: NavSection = {
  title: 'Engineering Admin',
  roleRequired: 'any_admin',
  items: [
    { href: '/admin/requests',  label: 'Pipeline',  icon: <LayoutDashboard className="h-4 w-4" /> },
    { href: '/admin/analytics', label: 'Analytics', icon: <BarChart2 className="h-4 w-4" /> },
  ],
};

const SYS_ADMIN_SECTION: NavSection = {
  title: 'System Admin',
  roleRequired: 'sys_admin',
  items: [
    { href: '/admin/users',     label: 'Users',     icon: <Users className="h-4 w-4" /> },
    { href: '/admin/audit-log', label: 'Audit Log', icon: <Shield className="h-4 w-4" /> },
  ],
};

const SETTINGS_SECTION: NavSection = {
  title: 'Settings',
  roleRequired: 'any_admin',
  items: [
    { href: '/admin/settings/priority-weights', label: 'Priority Weights',   icon: <span className="text-sm">⚖️</span> },
    { href: '/admin/settings/effort-ranges',    label: 'Effort Ranges',      icon: <span className="text-sm">⏱️</span> },
    { href: '/admin/settings/rates',            label: 'Blended Rates',      icon: <span className="text-sm">💵</span> },
  ],
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isActive(pathname: string, href: string, exact?: boolean): boolean {
  if (exact) return pathname === href;
  return pathname === href || pathname.startsWith(href + '/');
}

function roleLabel(role?: string, dept?: string): string {
  if (role === 'sys_admin') return 'Sys Admin';
  if (role === 'eng_admin') return 'Eng Admin';
  return dept || 'Employee';
}

function roleColor(role?: string): string {
  if (role === 'sys_admin') return 'text-amber-400';
  if (role === 'eng_admin') return 'text-[#818cf8]';
  return 'text-[#6b7280]';
}

function avatarColor(role?: string): string {
  if (role === 'sys_admin') return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
  if (role === 'eng_admin') return 'bg-[#6366f1]/20 text-[#818cf8] border-[#6366f1]/30';
  return 'bg-[#6366f1]/15 text-[#818cf8] border-[#6366f1]/20';
}

// ─── NavLink ──────────────────────────────────────────────────────────────────

function NavLink({
  item,
  pathname,
  collapsed,
  onClick,
}: {
  item: NavItem;
  pathname: string;
  collapsed: boolean;
  onClick?: () => void;
}) {
  const active = isActive(pathname, item.href, item.exact);
  return (
    <Link
      href={item.href}
      onClick={onClick}
      title={collapsed ? item.label : undefined}
      className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
        active
          ? 'bg-[#6366f1] text-white shadow-md shadow-[#6366f1]/25'
          : 'text-[#9ca3af] hover:text-white hover:bg-[#1a1a2e]'
      } ${collapsed ? 'justify-center' : ''}`}
    >
      <span className="shrink-0">{item.icon}</span>
      {!collapsed && <span className="truncate">{item.label}</span>}
      {!collapsed && active && (
        <ChevronRight className="h-3 w-3 ml-auto opacity-60" />
      )}
    </Link>
  );
}

// ─── SectionHeader ────────────────────────────────────────────────────────────

function SectionHeader({ title, collapsed }: { title?: string; collapsed: boolean }) {
  if (!title || collapsed) return null;
  return (
    <p className="px-3 pt-4 pb-1 text-[10px] font-bold uppercase tracking-widest text-[#3d3d5c]">
      {title}
    </p>
  );
}

// ─── Sidebar Inner Content (shared by desktop + mobile) ──────────────────────

function SidebarContent({
  collapsed,
  onLinkClick,
}: {
  collapsed: boolean;
  onLinkClick?: () => void;
}) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [settingsOpen, setSettingsOpen] = useState(
    pathname.startsWith('/admin/settings')
  );

  const role = (session?.user as { role?: string } | undefined)?.role;
  const dept = (session?.user as { department?: string } | undefined)?.department || '';
  const isSysAdmin = role === 'sys_admin';
  const isAnyAdmin = role === 'sys_admin' || role === 'eng_admin';
  const userName = session?.user?.name || session?.user?.email?.split('@')[0] || 'User';

  const settingsActive = pathname.startsWith('/admin/settings');

  return (
    <div className="flex flex-col h-full">
      {/* ── Logo ─────────────────────────────────────────────── */}
      <div className={`flex items-center gap-3 px-4 py-5 border-b border-[#1e1e3a] ${collapsed ? 'justify-center px-2' : ''}`}>
        <Link
          href={isAnyAdmin ? '/admin/requests' : '/my-requests'}
          onClick={onLinkClick}
          className="flex items-center gap-3 group shrink-0"
        >
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#6366f1] to-[#8b5cf6] flex items-center justify-center text-white text-base shadow-lg shadow-[#6366f1]/30 group-hover:scale-105 transition-transform shrink-0">
            🤖
          </div>
          {!collapsed && (
            <div>
              <p className="font-extrabold text-sm text-white tracking-tight leading-tight group-hover:text-[#818cf8] transition-colors">
                AI Automation
              </p>
              <p className="text-[10px] text-[#4b5563] font-medium tracking-wide leading-tight">
                Intake & Priority Platform
              </p>
            </div>
          )}
        </Link>
      </div>

      {/* ── New Request CTA ──────────────────────────────────── */}
      <div className={`px-3 pt-4 ${collapsed ? 'px-2' : ''}`}>
        <Link
          href="/intake/new"
          onClick={onLinkClick}
          title={collapsed ? 'New Request' : undefined}
          className={`flex items-center gap-2 px-3 py-2.5 rounded-xl font-bold text-xs bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] hover:from-[#5558e0] hover:to-[#7c4fdb] text-white shadow-md shadow-[#6366f1]/20 transition-all ${collapsed ? 'justify-center' : ''}`}
        >
          <Plus className="h-4 w-4 shrink-0" />
          {!collapsed && <span>New Request</span>}
        </Link>
      </div>

      {/* ── Navigation ───────────────────────────────────────── */}
      <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-0.5 mt-2">
        {/* Employee links — visible to everyone */}
        <SectionHeader title={collapsed ? undefined : undefined} collapsed={collapsed} />
        {EMPLOYEE_SECTION.items.map((item) => (
          <NavLink key={item.href} item={item} pathname={pathname} collapsed={collapsed} onClick={onLinkClick} />
        ))}

        {/* Eng Admin section */}
        {isAnyAdmin && (
          <>
            <SectionHeader title={ENG_ADMIN_SECTION.title} collapsed={collapsed} />
            {ENG_ADMIN_SECTION.items.map((item) => (
              <NavLink key={item.href} item={item} pathname={pathname} collapsed={collapsed} onClick={onLinkClick} />
            ))}
          </>
        )}

        {/* Sys Admin section */}
        {isSysAdmin && (
          <>
            <SectionHeader title={SYS_ADMIN_SECTION.title} collapsed={collapsed} />
            {SYS_ADMIN_SECTION.items.map((item) => (
              <NavLink key={item.href} item={item} pathname={pathname} collapsed={collapsed} onClick={onLinkClick} />
            ))}
          </>
        )}

        {/* Settings — collapsible group, any admin */}
        {isAnyAdmin && (
          <>
            {collapsed ? (
              // In collapsed mode: show settings items directly with icons
              <>
                {SETTINGS_SECTION.items.map((item) => (
                  <NavLink key={item.href} item={item} pathname={pathname} collapsed={collapsed} onClick={onLinkClick} />
                ))}
              </>
            ) : (
              <div className="pt-4">
                <button
                  onClick={() => setSettingsOpen((v) => !v)}
                  className={`w-full flex items-center justify-between px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-colors ${
                    settingsActive ? 'text-[#818cf8]' : 'text-[#3d3d5c] hover:text-[#6b7280]'
                  }`}
                >
                  <span>Settings</span>
                  {settingsOpen
                    ? <ChevronUp className="h-3 w-3" />
                    : <ChevronDown className="h-3 w-3" />
                  }
                </button>

                {settingsOpen && (
                  <div className="mt-0.5 space-y-0.5">
                    {SETTINGS_SECTION.items.map((item) => (
                      <NavLink key={item.href} item={item} pathname={pathname} collapsed={collapsed} onClick={onLinkClick} />
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </nav>

      {/* ── Bottom: Notifications + User Pill ────────────────── */}
      <div className={`border-t border-[#1e1e3a] px-3 py-3 space-y-2 ${collapsed ? 'px-2' : ''}`}>
        {/* Notifications */}
        <div className={`flex ${collapsed ? 'justify-center' : 'items-center px-1'}`}>
          <NotificationBell />
          {!collapsed && <span className="ml-2 text-xs font-semibold text-[#6b7280]">Notifications</span>}
        </div>

        {/* User pill */}
        <div className={`flex items-center gap-2.5 bg-[#0f0f1e] border border-[#1e1e3a] rounded-xl p-2.5 ${collapsed ? 'justify-center' : ''}`}>
          <div className={`w-7 h-7 rounded-lg border flex items-center justify-center font-bold text-xs shrink-0 ${avatarColor(role)}`}>
            {userName.charAt(0).toUpperCase()}
          </div>

          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-white font-semibold text-[11px] truncate leading-tight">
                {userName}
              </p>
              <p className={`text-[10px] font-medium leading-tight ${roleColor(role)}`}>
                {roleLabel(role, dept)}
              </p>
            </div>
          )}

          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            title="Sign Out"
            className="shrink-0 text-[#4b5563] hover:text-rose-400 transition-colors p-1 rounded-lg hover:bg-rose-500/10"
          >
            <LogOut className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Mobile spacer (consumed by layout to push content below the fixed top bar) ─

export function MobileTopBarSpacer() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  if (
    status === 'loading' ||
    !session ||
    pathname === '/login' ||
    pathname === '/register'
  ) {
    return null;
  }
  return <div className="h-14 md:hidden shrink-0" />;
}

// ─── Main Sidebar export ──────────────────────────────────────────────────────

export default function Sidebar() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Hide on auth pages or while loading
  if (
    status === 'loading' ||
    !session ||
    pathname === '/login' ||
    pathname === '/register'
  ) {
    return null;
  }

  return (
    <>
      {/* ── Mobile top bar (shows on small screens) ──────────────── */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-4 py-3 bg-[#0f0f1e]/95 backdrop-blur-md border-b border-[#1e1e3a]">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-[#6366f1] to-[#8b5cf6] flex items-center justify-center text-white text-sm">
            🤖
          </div>
          <span className="font-extrabold text-sm text-white">AI Automation</span>
        </Link>
        <div className="flex items-center gap-2">
          <NotificationBell />
          <button
            onClick={() => setMobileOpen(true)}
            className="p-2 rounded-xl bg-[#1a1a2e] border border-[#2a2a4e] text-[#9ca3af] hover:text-white transition-colors"
          >
            <Menu className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* ── Mobile drawer overlay ─────────────────────────────────── */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          {/* Drawer */}
          <div className="relative z-10 w-72 max-w-[85vw] bg-[#0d0d1c] border-r border-[#1e1e3a] h-full flex flex-col">
            <div className="absolute top-3 right-3">
              <button
                onClick={() => setMobileOpen(false)}
                className="p-1.5 rounded-lg bg-[#1a1a2e] text-[#6b7280] hover:text-white transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <SidebarContent collapsed={false} onLinkClick={() => setMobileOpen(false)} />
          </div>
        </div>
      )}

      {/* ── Desktop sidebar ───────────────────────────────────────── */}
      <aside
        className={`hidden md:flex flex-col bg-[#0d0d1c] border-r border-[#1e1e3a] sticky top-0 h-screen transition-all duration-300 ease-in-out shrink-0 ${
          collapsed ? 'w-16' : 'w-60'
        }`}
      >
        {/* Collapse/expand toggle */}
        <button
          onClick={() => setCollapsed((v) => !v)}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="absolute -right-3 top-20 z-10 w-6 h-6 rounded-full bg-[#1a1a2e] border border-[#2a2a4e] text-[#6b7280] hover:text-white hover:border-[#6366f1]/50 transition-all flex items-center justify-center shadow-md"
        >
          {collapsed
            ? <ChevronRight className="h-3 w-3" />
            : <ChevronLeft className="h-3 w-3" />
          }
        </button>

        <SidebarContent collapsed={collapsed} />
      </aside>
    </>
  );
}
