'use client';

import * as React from 'react';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { SidebarTrigger } from '@/components/ui/sidebar';
import NotificationBell from './NotificationBell';
import { LogOut } from 'lucide-react';

export function MobileHeader() {
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

  const userName =
    session.user?.name || session.user?.email?.split('@')[0] || 'User';

  return (
    <header className="flex h-14 w-full items-center justify-between border-b border-[#464554]/30 bg-[#13131b] px-4 md:hidden">
      {/* Left: sidebar trigger only */}
      <SidebarTrigger className="h-9 w-9 text-[#908fa0] hover:bg-[#34343d]/50 hover:text-white rounded-md transition-colors" />

      {/* Right: bell + user avatar */}
      <div className="flex items-center gap-2">
        <NotificationBell />
        <div className="flex h-8 w-8 items-center justify-center rounded-md border border-[#8083ff]/30 bg-[#6366f1]/20 text-xs font-bold text-[#c0c1ff] font-outfit">
          {userName.charAt(0).toUpperCase()}
        </div>
        <button
          type="button"
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="rounded-md p-1.5 text-[#908fa0] hover:bg-[#ffb4ab]/15 hover:text-[#ffb4ab] transition-colors"
          aria-label="Sign out"
          title="Sign out"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
}
