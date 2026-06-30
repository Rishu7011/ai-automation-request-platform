'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Bell, Check, ExternalLink } from 'lucide-react';
import Link from 'next/link';

interface NotificationItem {
  _id: string;
  title: string;
  message: string;
  link: string;
  isRead: boolean;
  type: string;
  createdAt: string;
}

export default function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/notifications');
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch {
      // Ignore network errors in header
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000); // refresh every 30s
    return () => clearInterval(interval);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const markAsRead = async (id: string) => {
    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId: id }),
      });
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch {
      // Ignore errors
    }
  };

  const markAllAsRead = async () => {
    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAllRead: true }),
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch {
      // Ignore errors
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative rounded-lg p-2 text-[#5f6470] transition-colors hover:bg-[#f1f5f9] hover:text-[#191c1e] focus:outline-none"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-indigo-500 text-white font-bold text-[10px] rounded-full flex items-center justify-center animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute left-2 bottom-10 z-50 mt-2 w-80 overflow-hidden rounded-xl border border-[#dfe3e8] bg-white shadow-lg sm:w-96">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[#dfe3e8] bg-[#f1f5f9] px-4 py-3">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-semibold text-[#191c1e]">Notifications</span>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                  {unreadCount} new
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="flex items-center gap-1 text-[11px] font-medium text-[#004ac6] hover:underline"
              >
                <Check className="w-3 h-3" /> Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-80 divide-y divide-[#dfe3e8] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="py-8 text-center text-xs text-gray-500">
                No notifications yet.
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n._id}
                  onClick={() => !n.isRead && markAsRead(n._id)}
                  className={`p-3.5 transition-colors flex items-start justify-between gap-3 ${
                    n.isRead ? 'bg-white opacity-60' : 'bg-blue-50/40 hover:bg-blue-50'
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      {!n.isRead && <span className="w-2 h-2 rounded-full bg-indigo-400 shrink-0" />}
                      <p className="truncate text-xs font-semibold text-[#191c1e]">{n.title}</p>
                    </div>
                    <p className="mt-1 line-clamp-2 text-xs text-[#5f6470]">{n.message}</p>
                    <span className="text-[10px] text-gray-500 mt-1 block">
                      {new Date(n.createdAt).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>

                  {n.link && n.link !== '#' && (
                    <Link
                      href={n.link}
                      onClick={() => setIsOpen(false)}
                      className="mt-1 shrink-0 rounded-lg p-1 text-[#004ac6] hover:bg-blue-50 hover:text-[#003ea8]"
                      title="View item"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Link>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
