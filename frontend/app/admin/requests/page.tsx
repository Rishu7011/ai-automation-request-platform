'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { DEPARTMENTS } from '@/constants';

interface AdminRequestItem {
  _id: string;
  title: string;
  department: string;
  status: string;
  priorityScore: number;
  createdAt: string;
  updatedAt: string;
  requesterId?: {
    _id: string;
    name: string;
    email: string;
    department: string;
  };
}

const STATUS_BADGES: Record<string, { label: string; color: string }> = {
  draft: { label: 'Draft', color: 'bg-amber-500/10 text-amber-400 border-amber-500/30' },
  submitted: { label: 'Submitted', color: 'bg-blue-500/10 text-blue-400 border-blue-500/30' },
  in_review: { label: 'In Review', color: 'bg-purple-500/10 text-purple-400 border-purple-500/30' },
  approved: { label: 'Approved', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' },
  rejected: { label: 'Rejected', color: 'bg-rose-500/10 text-rose-400 border-rose-500/30' },
  completed: { label: 'Completed', color: 'bg-green-500/10 text-green-400 border-green-500/30' },
};

const DEPARTMENT_ICONS: Record<string, string> = {
  Recruitment: '🤝',
  HR: '🧑‍💼',
  Finance: '💵',
  Compliance: '⚖️',
  IT: '💻',
  Operations: '⚙️',
  Engineering: '🔧',
  Legal: '📜',
  Sales: '📈',
  Marketing: '🎯',
};

export default function AdminRequestsPage() {
  const router = useRouter();
  const [requests, setRequests] = useState<AdminRequestItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchAdminRequests() {
      try {
        const res = await fetch('/api/admin/requests');
        if (!res.ok) {
          if (res.status === 403) {
            setError('Admin permissions required to view all requests.');
          } else {
            setError('Failed to fetch requests.');
          }
          return;
        }
        const data = await res.json();
        setRequests(data.requests || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error fetching requests');
      } finally {
        setIsLoading(false);
      }
    }
    fetchAdminRequests();
  }, []);

  const filteredRequests = requests.filter((req) => {
    const matchesSearch =
      req.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.requesterId?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.requesterId?.email.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesDept = selectedDepartment === 'all' || req.department === selectedDepartment;
    const matchesStatus = selectedStatus === 'all' || req.status === selectedStatus;

    return matchesSearch && matchesDept && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-[#0a0a12] text-[#e0e0e0]">
      {/* Admin Top Nav */}
      <div className="border-b border-[#1e1e3a] bg-[#0f0f1e]/80 backdrop-blur-md px-6 py-4 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold text-white tracking-tight">Admin Pipeline — Automation Requests</h1>
            <span className="bg-[#1a1a2e] text-[#6366f1] border border-[#2a2a4e] text-xs px-2.5 py-0.5 rounded-full font-medium">
              {requests.length} Total Requests
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/admin/users"
              className="text-xs text-[#9ca3af] hover:text-white px-3 py-1.5 rounded-lg border border-[#2a2a4e] transition-colors"
            >
              👥 Manage Users
            </Link>
            <Link
              href="/my-requests"
              className="text-xs text-[#9ca3af] hover:text-white px-3 py-1.5 rounded-lg border border-[#2a2a4e] transition-colors"
            >
              📋 My Requests
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Search & Filters */}
        <div className="flex flex-col md:flex-row items-center gap-4 mb-6">
          <input
            type="text"
            placeholder="Search by title, requester name, or email…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="
              flex-1 bg-[#0f0f1e] border border-[#1e1e3a] rounded-xl px-4 py-2.5
              text-sm text-[#e0e0e0] placeholder-[#4b5563]
              focus:outline-none focus:ring-2 focus:ring-[#6366f1] focus:border-transparent
            "
          />

          <select
            value={selectedDepartment}
            onChange={(e) => setSelectedDepartment(e.target.value)}
            className="
              bg-[#0f0f1e] border border-[#1e1e3a] rounded-xl px-4 py-2.5
              text-sm text-[#e0e0e0] focus:outline-none focus:ring-2 focus:ring-[#6366f1]
            "
          >
            <option value="all">All Departments</option>
            {DEPARTMENTS.map((dept) => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="
              bg-[#0f0f1e] border border-[#1e1e3a] rounded-xl px-4 py-2.5
              text-sm text-[#e0e0e0] focus:outline-none focus:ring-2 focus:ring-[#6366f1]
            "
          >
            <option value="all">All Statuses</option>
            <option value="draft">Draft</option>
            <option value="submitted">Submitted</option>
            <option value="in_review">In Review</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>

        {/* Requests Table */}
        {isLoading ? (
          <div className="py-20 text-center">
            <div className="w-10 h-10 border-2 border-[#6366f1] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-[#9ca3af] text-sm">Loading admin requests…</p>
          </div>
        ) : error ? (
          <div className="p-4 rounded-xl bg-red-400/10 border border-red-400/20 text-red-400 text-sm text-center my-8">
            {error}
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="p-12 text-center bg-[#0f0f1e] rounded-2xl border border-[#1e1e3a] text-[#9ca3af] text-sm">
            No requests matched your filter.
          </div>
        ) : (
          <div className="bg-[#0f0f1e] border border-[#1e1e3a] rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-[#e0e0e0]">
                <thead className="bg-[#1a1a2e] text-[#9ca3af] uppercase text-[10px] tracking-wider border-b border-[#1e1e3a]">
                  <tr>
                    <th className="px-6 py-4">Title & Department</th>
                    <th className="px-6 py-4">Requester</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Priority Score</th>
                    <th className="px-6 py-4">Last Updated</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1e1e3a]">
                  {filteredRequests.map((req) => {
                    const badge = STATUS_BADGES[req.status] || {
                      label: req.status,
                      color: 'bg-gray-500/10 text-gray-400 border-gray-500/30',
                    };
                    const icon = DEPARTMENT_ICONS[req.department] || '💼';
                    const updatedDate = new Date(req.updatedAt).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    });

                    return (
                      <tr key={req._id} className="hover:bg-[#131326] transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <span className="text-xl">{icon}</span>
                            <div>
                              <p className="font-semibold text-white text-sm">{req.title}</p>
                              <p className="text-[#6b7280] text-[11px]">{req.department}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-medium text-white">{req.requesterId?.name || 'Unknown'}</p>
                          <p className="text-[#6b7280] text-[11px]">{req.requesterId?.email || '-'}</p>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[11px] font-medium border ${badge.color}`}
                          >
                            {badge.label}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-semibold text-[#818cf8]">
                          {req.priorityScore > 0 ? req.priorityScore.toFixed(1) : '-'}
                        </td>
                        <td className="px-6 py-4 text-[#9ca3af]">{updatedDate}</td>
                        <td className="px-6 py-4 text-right">
                          <Link
                            href={`/requests/${req._id}`}
                            className="
                              px-3 py-1.5 rounded-lg bg-[#1a1a2e] border border-[#2a2a4e]
                              hover:bg-[#6366f1] hover:border-[#6366f1] hover:text-white
                              text-[#e0e0e0] font-medium text-xs transition-colors inline-block
                            "
                          >
                            View Details →
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
