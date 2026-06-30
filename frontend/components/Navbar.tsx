'use client';

import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import NotificationBell from './NotificationBell';

export default function Navbar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Hide navbar on public auth pages
  if (!session || pathname === '/login' || pathname === '/register') {
    return null;
  }

  const role = (session.user as { role?: string } | undefined)?.role;
  const isSysAdmin = role === 'sys_admin';
  const isEngAdmin = role === 'eng_admin';
  const isAnyAdmin = isSysAdmin || isEngAdmin;

  const userName = session.user?.name || session.user?.email?.split('@')[0] || 'User';
  const userDept = (session.user as { department?: string } | undefined)?.department || '';

  // ── Role badge label ──────────────────────────────────────────────────────
  const roleBadge = isSysAdmin ? 'Sys Admin' : isEngAdmin ? 'Eng Admin' : userDept || 'Employee';

  // ── Employee nav (visible to ALL authenticated users) ─────────────────────
  const employeeLinks = [
    { href: '/my-requests', label: 'My Requests', icon: '📋' },
    { href: '/ledger',      label: 'Company Ledger', icon: '👁️' },
  ];

  // ── Engineering Admin nav (eng_admin + sys_admin) ─────────────────────────
  const engAdminLinks = [
    { href: '/admin/requests',  label: 'Pipeline',   icon: '📊' },
    { href: '/admin/analytics', label: 'Analytics',  icon: '📈' },
  ];

  // ── System Admin only nav (sys_admin) ─────────────────────────────────────
  const sysAdminLinks = [
    { href: '/admin/users',     label: 'Users',      icon: '👥' },
    { href: '/admin/audit-log', label: 'Audit Log',  icon: '📜' },
  ];

  const navLinkClass = (active: boolean) =>
    `px-3 py-2 rounded-xl font-medium transition-all flex items-center gap-1.5 text-xs ${
      active
        ? 'bg-[#6366f1] text-white shadow-md shadow-[#6366f1]/20 font-semibold'
        : 'text-[#9ca3af] hover:text-white hover:bg-[#1a1a2e]'
    }`;

  return (
    <nav className="border-b border-[#1e1e3a] bg-[#0f0f1e]/95 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">

        {/* ── Brand ─────────────────────────────────────────────────── */}
        <div className="flex items-center gap-5">
          <Link
            href={isAnyAdmin ? '/admin/requests' : '/my-requests'}
            className="flex items-center gap-2.5 group shrink-0"
          >
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#6366f1] to-[#8b5cf6] flex items-center justify-center text-white text-base shadow-lg shadow-[#6366f1]/30 group-hover:scale-105 transition-transform">
              🤖
            </div>
            <div className="hidden sm:block">
              <span className="font-extrabold text-sm text-white tracking-tight group-hover:text-[#818cf8] transition-colors">
                AI Automation
              </span>
              <span className="block text-[10px] text-[#6b7280] font-medium tracking-wide">
                Enterprise Intake & Priority Platform
              </span>
            </div>
          </Link>

          {/* ── Desktop Nav ────────────────────────────────────────── */}
          <div className="hidden md:flex items-center gap-1 border-l border-[#1e1e3a] pl-5">

            {/* Employee links — everyone */}
            {employeeLinks.map((link) => (
              <Link key={link.href} href={link.href} className={navLinkClass(pathname === link.href)}>
                <span>{link.icon}</span>
                <span>{link.label}</span>
              </Link>
            ))}

            {/* Eng Admin section — eng_admin + sys_admin */}
            {isAnyAdmin && (
              <>
                <span className="text-[#2a2a4e] px-1 text-xs select-none">│</span>
                {engAdminLinks.map((link) => (
                  <Link key={link.href} href={link.href} className={navLinkClass(pathname === link.href)}>
                    <span>{link.icon}</span>
                    <span>{link.label}</span>
                  </Link>
                ))}
              </>
            )}

            {/* Sys Admin section — sys_admin only */}
            {isSysAdmin && (
              <>
                {sysAdminLinks.map((link) => (
                  <Link key={link.href} href={link.href} className={navLinkClass(pathname === link.href)}>
                    <span>{link.icon}</span>
                    <span>{link.label}</span>
                  </Link>
                ))}
              </>
            )}

            {/* Settings Dropdown — sys_admin + eng_admin */}
            {isAnyAdmin && (
              <div className="relative">
                <button
                  onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                  onBlur={() => setTimeout(() => setIsSettingsOpen(false), 150)}
                  className={navLinkClass(pathname.startsWith('/admin/settings'))}
                >
                  <span>⚙️</span>
                  <span>Settings</span>
                  <span className="text-[9px] opacity-70">▼</span>
                </button>

                {isSettingsOpen && (
                  <div className="absolute left-0 mt-2 w-52 bg-[#0f0f1e] border border-[#2a2a4e] rounded-xl shadow-2xl shadow-black/60 py-2 z-50">
                    <p className="px-4 pt-1 pb-2 text-[10px] font-bold uppercase tracking-widest text-[#4b5563]">
                      Algorithm Config
                    </p>
                    <Link href="/admin/settings/priority-weights" className="flex items-center gap-2 px-4 py-2 text-xs text-[#d1d5db] hover:text-white hover:bg-[#1a1a2e] transition-colors rounded-lg mx-1">
                      <span>⚖️</span> Priority Weights
                    </Link>
                    <Link href="/admin/settings/effort-ranges" className="flex items-center gap-2 px-4 py-2 text-xs text-[#d1d5db] hover:text-white hover:bg-[#1a1a2e] transition-colors rounded-lg mx-1">
                      <span>⏱️</span> Effort Hour Ranges
                    </Link>
                    <Link href="/admin/settings/rates" className="flex items-center gap-2 px-4 py-2 text-xs text-[#d1d5db] hover:text-white hover:bg-[#1a1a2e] transition-colors rounded-lg mx-1">
                      <span>💵</span> Blended Hourly Rates
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── Right Side Actions ─────────────────────────────────────── */}
        <div className="flex items-center gap-2.5">
          <NotificationBell />

          {/* New Request CTA */}
          <Link
            href="/intake/new"
            className="px-3.5 py-1.5 rounded-xl font-bold text-xs bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] hover:from-[#5558e0] hover:to-[#7c4fdb] text-white shadow-md shadow-[#6366f1]/20 transition-all flex items-center gap-1.5 whitespace-nowrap"
          >
            <span>+</span>
            <span className="hidden sm:inline">New Request</span>
          </Link>

          {/* User info pill */}
          <div className="flex items-center gap-2 bg-[#1a1a2e] border border-[#2a2a4e] rounded-xl px-3 py-1.5">
            {/* Avatar */}
            <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${
              isSysAdmin ? 'bg-amber-500/20 text-amber-400' :
              isEngAdmin ? 'bg-[#6366f1]/20 text-[#818cf8]' :
              'bg-[#6366f1]/15 text-[#818cf8]'
            }`}>
              {userName.charAt(0).toUpperCase()}
            </div>

            <div className="hidden lg:block text-left">
              <p className="text-white font-semibold text-[11px] leading-tight truncate max-w-[90px]">
                {userName}
              </p>
              <p className={`text-[10px] leading-tight font-medium ${
                isSysAdmin ? 'text-amber-400' :
                isEngAdmin ? 'text-[#818cf8]' :
                'text-[#6b7280]'
              }`}>
                {roleBadge}
              </p>
            </div>

            <button
              onClick={() => signOut({ callbackUrl: '/login' })}
              title="Sign Out"
              className="text-[#6b7280] hover:text-rose-400 text-xs px-1 py-0.5 rounded hover:bg-rose-500/10 transition-colors ml-0.5"
            >
              🚪
            </button>
          </div>

          {/* Mobile menu toggle */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 rounded-xl bg-[#1a1a2e] border border-[#2a2a4e] text-[#9ca3af] hover:text-white transition-colors"
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? '✕' : '☰'}
          </button>
        </div>
      </div>

      {/* ── Mobile Menu ────────────────────────────────────────────────── */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-[#1e1e3a] bg-[#0f0f1e] px-4 py-4 space-y-1">
          {/* Employee links */}
          {employeeLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setIsMobileMenuOpen(false)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                pathname === link.href
                  ? 'bg-[#6366f1] text-white'
                  : 'text-[#9ca3af] hover:text-white hover:bg-[#1a1a2e]'
              }`}
            >
              <span>{link.icon}</span>
              <span>{link.label}</span>
            </Link>
          ))}

          {/* Eng admin links */}
          {isAnyAdmin && (
            <>
              <div className="pt-2 pb-1 px-4 text-[10px] font-bold uppercase tracking-widest text-[#4b5563]">Engineering Admin</div>
              {engAdminLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    pathname === link.href
                      ? 'bg-[#6366f1] text-white'
                      : 'text-[#9ca3af] hover:text-white hover:bg-[#1a1a2e]'
                  }`}
                >
                  <span>{link.icon}</span>
                  <span>{link.label}</span>
                </Link>
              ))}
            </>
          )}

          {/* Sys admin links */}
          {isSysAdmin && (
            <>
              <div className="pt-2 pb-1 px-4 text-[10px] font-bold uppercase tracking-widest text-[#4b5563]">System Admin</div>
              {sysAdminLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    pathname === link.href
                      ? 'bg-[#6366f1] text-white'
                      : 'text-[#9ca3af] hover:text-white hover:bg-[#1a1a2e]'
                  }`}
                >
                  <span>{link.icon}</span>
                  <span>{link.label}</span>
                </Link>
              ))}
            </>
          )}

          {/* Settings links */}
          {isAnyAdmin && (
            <>
              <div className="pt-2 pb-1 px-4 text-[10px] font-bold uppercase tracking-widest text-[#4b5563]">Settings</div>
              {[
                { href: '/admin/settings/priority-weights', label: '⚖️ Priority Weights' },
                { href: '/admin/settings/effort-ranges', label: '⏱️ Effort Ranges' },
                { href: '/admin/settings/rates', label: '💵 Blended Rates' },
              ].map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    pathname === link.href
                      ? 'bg-[#6366f1] text-white'
                      : 'text-[#9ca3af] hover:text-white hover:bg-[#1a1a2e]'
                  }`}
                >
                  <span>{link.label}</span>
                </Link>
              ))}
            </>
          )}
        </div>
      )}
    </nav>
  );
}
