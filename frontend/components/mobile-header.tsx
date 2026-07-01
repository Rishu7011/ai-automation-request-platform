'use client';

import * as React from 'react';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { SidebarTrigger } from '@/components/ui/sidebar';
import NotificationBell from './NotificationBell';

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
    <header className="flex h-14 w-full items-center justify-between border-b border-[#dfe3e8] bg-white px-4 md:hidden">
      <div className="flex items-center gap-3">
        <SidebarTrigger className="h-9 w-9 text-slate-700 hover:bg-slate-100" />
        <div className="flex items-center gap-2">
          <Image
            src="/logo.png"
            width={32}
            height={32}
            alt="AI Automation logo"
            className="h-8 w-8 rounded-lg object-cover"
          />
          <span className="text-sm font-bold text-slate-900">AI Automation</span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <NotificationBell />
        <div className="flex h-8 w-8 items-center justify-center rounded-full border border-blue-200 bg-blue-50 text-xs font-bold text-[#004ac6]">
          {userName.charAt(0).toUpperCase()}
        </div>
      </div>
    </header>
  );
}
