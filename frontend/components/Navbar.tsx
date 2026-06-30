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

  // Do not render navbar on login/register pages
  if (!session || pathname === '/login' || pathname === '/register') {
    return null;
  }

  const role = (session.user as { role?: string } | undefined)?.role;
  const isAdmin = role === 'sys_admin' || role === 'eng_admin';
  const userName = session.user?.name || session.user?.email?.split('@')[0] || 'User';
  const userDept = (session.user as { department?: string } | undefined)?.department || '';

  const navLinks = [
    { href: '/my-requests', label: 'My Requests', icon: '📋' },
    { href: '/ledger', label: 'Company Ledger', icon: '👁️' },
  ];

  const adminLinks = [
    { href: '/admin/requests', label: 'Pipeline', icon: '📊' },
    { href: '/admin/analytics', label: 'Analytics', icon: '📈' },
    { href: '/admin/users', label: 'User Admin', icon: '👥' },
    { href: '/admin/audit-log', label: 'Audit Log', icon: '📜' },
  ];

  return (
    <nav className="border-b border-[#1e1e3a] bg-[#0f0f1e]/90 backdrop-blur-md sticky top-0 z-50 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
        {/* Brand & App Title */}
        <div className="flex items-center gap-6">
          <Link
            href={isAdmin ? '/admin/requests' : '/my-requests'}
            className="flex items-center gap-2.5 group"
          >
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#6366f1] to-[#8b5cf6] flex items-center justify-center text-white text-base shadow-lg shadow-[#6366f1]/30 group-hover:scale-105 transition-transform">
              🤖
            </div>
            <div>
              <span className="font-extrabold text-sm text-white tracking-tight group-hover:text-[#818cf8] transition-colors">
                AI Automation
              </span>
              <span className="block text-[10px] text-[#6b7280] font-medium tracking-wide">
                Enterprise Intake & Priority Platform
              </span>
            </div>
          </Link>

          {/* Primary Navigation Links */}
          <div className="hidden md:flex items-center gap-1.5 border-l border-[#1e1e3a] pl-6">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-3 py-2 rounded-xl font-medium transition-all flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-[#6366f1] text-white shadow-md shadow-[#6366f1]/20 font-semibold'
                      : 'text-[#9ca3af] hover:text-white hover:bg-[#1a1a2e]'
                  }`}
                >
                  <span>{link.icon}</span>
                  <span>{link.label}</span>
                </Link>
              );
            })}

            {/* Admin Links */}
            {isAdmin && (
              <>
                <span className="text-[#2a2a4e] px-1">|</span>
                {adminLinks.map((link) => {
                  const isActive = pathname === link.href;
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={`px-3 py-2 rounded-xl font-medium transition-all flex items-center gap-1.5 ${
                        isActive
                          ? 'bg-[#6366f1] text-white shadow-md shadow-[#6366f1]/20 font-semibold'
                          : 'text-[#9ca3af] hover:text-white hover:bg-[#1a1a2e]'
                      }`}
                    >
                      <span>{link.icon}</span>
                      <span>{link.label}</span>
                    </Link>
                  );
                })}

                {/* Admin Settings Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                    onBlur={() => setTimeout(() => setIsSettingsOpen(false), 200)}
                    className={`px-3 py-2 rounded-xl font-medium transition-all flex items-center gap-1.5 ${
                      pathname.startsWith('/admin/settings')
                        ? 'bg-[#6366f1] text-white shadow-md shadow-[#6366f1]/20 font-semibold'
                        : 'text-[#9ca3af] hover:text-white hover:bg-[#1a1a2e]'
                    }`}
                  >
                    <span>⚙️</span>
                    <span>Settings</span>
                    <span className="text-[10px]">▼</span>
                  </button>

                  {isSettingsOpen && (
                    <div className="absolute left-0 mt-2 w-52 bg-[#0f0f1e] border border-[#2a2a4e] rounded-xl shadow-2xl py-2 z-50">
                      <Link
                        href="/admin/settings/priority-weights"
                        className="flex items-center gap-2 px-4 py-2 text-xs text-[#d1d5db] hover:text-white hover:bg-[#1a1a2e] transition-colors"
                      >
                        <span>⚖️</span> Priority Weights
                      </Link>
                      <Link
                        href="/admin/settings/effort-ranges"
                        className="flex items-center gap-2 px-4 py-2 text-xs text-[#d1d5db] hover:text-white hover:bg-[#1a1a2e] transition-colors"
                      >
                        <span>⏱️</span> Effort Hour Ranges
                      </Link>
                      <Link
                        href="/admin/settings/rates"
                        className="flex items-center gap-2 px-4 py-2 text-xs text-[#d1d5db] hover:text-white hover:bg-[#1a1a2e] transition-colors"
                      >
                        <span>💵</span> Blended Hourly Rates
                      </Link>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Action Button & User Badge */}
        <div className="flex items-center gap-3">
          <NotificationBell />
          <Link
            href="/intake/new"
            className="
              px-3.5 py-1.5 rounded-xl font-bold text-xs
              bg-gradient-to-r from-[#6366f1] to-[#8b5cf6]
              hover:from-[#5558e0] hover:to-[#7c4fdb]
              text-white shadow-md shadow-[#6366f1]/20 transition-all duration-200
              flex items-center gap-1.5 whitespace-nowrap
            "
          >
            <span>+</span>
            <span className="hidden sm:inline">New Request</span>
          </Link>

          {/* User Account Info Pill */}
          <div className="flex items-center gap-2.5 bg-[#1a1a2e] border border-[#2a2a4e] rounded-xl px-3 py-1.5">
            <div className="w-6 h-6 rounded-full bg-[#6366f1]/20 text-[#818cf8] flex items-center justify-center font-bold text-xs">
              {userName.charAt(0).toUpperCase()}
            </div>

            <div className="hidden lg:block text-left">
              <p className="text-white font-semibold text-[11px] leading-tight truncate max-w-[100px]">
                {userName}
              </p>
              <p className="text-[10px] text-[#6b7280] leading-tight">
                {isAdmin ? 'Admin' : userDept || 'Employee'}
              </p>
            </div>

            <button
              onClick={() => signOut({ callbackUrl: '/login' })}
              title="Sign Out"
              className="text-[#9ca3af] hover:text-rose-400 text-xs font-semibold px-1.5 py-0.5 rounded hover:bg-rose-500/10 transition-colors ml-1"
            >
              🚪
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
