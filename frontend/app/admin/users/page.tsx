'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  ShieldCheck,
  UserCheck,
  UserX,
  Clock,
  Search,
  CheckCircle2,
  AlertCircle,
  Building,
  Mail,
  User as UserIcon,
} from 'lucide-react';
import { DEPARTMENTS, USER_ROLES, UserRole, UserStatus } from '@/constants';

interface IUserItem {
  _id: string;
  name: string;
  email: string;
  username: string;
  department: string;
  role: UserRole;
  status: UserStatus;
  createdAt: string;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<IUserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/users');
      if (!res.ok) throw new Error('Failed to fetch users');
      const data = await res.json();
      setUsers(data.users || []);
    } catch (err) {
      setMessage({ type: 'error', text: 'Could not load users list.' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    queueMicrotask(() => { void fetchUsers(); });
  }, [fetchUsers]);

  const handleUpdateStatus = async (userId: string, newStatus: UserStatus, newRole?: UserRole) => {
    setUpdatingId(userId);
    setMessage(null);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, status: newStatus, role: newRole }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update user status');
      setMessage({ type: 'success', text: data.message || 'User status updated successfully!' });
      fetchUsers();
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Error updating user status' });
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchesStatus = filterStatus === 'all' ? true : u.status === filterStatus;
    const matchesSearch =
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.department.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const pendingCount    = users.filter((u) => u.status === 'pending_approval').length;
  const activeCount     = users.filter((u) => u.status === 'active').length;
  const deactivatedCount = users.filter((u) => u.status === 'deactivated').length;

  const selectClass = 'bg-[#1a1a2e] border border-[#2a2a4e] text-[#d1d5db] text-xs font-semibold rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#6366f1] cursor-pointer';

  return (
    <div className="min-h-screen bg-[#0a0a12] text-[#e0e0e0] font-sans">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">

        {/* Page header */}
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">User Account Governance & Approvals</h1>
          <p className="text-sm text-[#9ca3af] mt-1">
            Review self-service registration requests, assign roles, and manage user access states.
          </p>
        </div>

        {/* Alert Toast */}
        {message && (
          <div className={`p-4 rounded-2xl border text-sm flex items-center justify-between ${
            message.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
          }`}>
            <div className="flex items-center gap-3">
              {message.type === 'success'
                ? <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-400" />
                : <AlertCircle className="h-5 w-5 shrink-0 text-rose-400" />
              }
              <span>{message.text}</span>
            </div>
            <button onClick={() => setMessage(null)} className="text-xs font-bold underline cursor-pointer hover:opacity-80">
              Dismiss
            </button>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <button
            onClick={() => setFilterStatus('pending_approval')}
            className={`bg-[#0f0f1e] border rounded-2xl p-5 text-left transition-all hover:border-amber-500/50 ${
              filterStatus === 'pending_approval' ? 'border-amber-500/60 ring-2 ring-amber-500/15' : 'border-[#1e1e3a]'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#6b7280]">Pending Approval</span>
              <div className="h-9 w-9 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
                <Clock className="h-4 w-4" />
              </div>
            </div>
            <div className="text-3xl font-extrabold mt-3 text-amber-400">{pendingCount}</div>
            <p className="text-xs text-[#6b7280] mt-1 font-medium">Requires admin approval</p>
          </button>

          <button
            onClick={() => setFilterStatus('active')}
            className={`bg-[#0f0f1e] border rounded-2xl p-5 text-left transition-all hover:border-emerald-500/50 ${
              filterStatus === 'active' ? 'border-emerald-500/60 ring-2 ring-emerald-500/15' : 'border-[#1e1e3a]'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#6b7280]">Approved & Active</span>
              <div className="h-9 w-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <UserCheck className="h-4 w-4" />
              </div>
            </div>
            <div className="text-3xl font-extrabold mt-3 text-emerald-400">{activeCount}</div>
            <p className="text-xs text-[#6b7280] mt-1 font-medium">Can log in and submit</p>
          </button>

          <button
            onClick={() => setFilterStatus('deactivated')}
            className={`bg-[#0f0f1e] border rounded-2xl p-5 text-left transition-all hover:border-rose-500/50 ${
              filterStatus === 'deactivated' ? 'border-rose-500/60 ring-2 ring-rose-500/15' : 'border-[#1e1e3a]'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#6b7280]">Deactivated</span>
              <div className="h-9 w-9 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center">
                <UserX className="h-4 w-4" />
              </div>
            </div>
            <div className="text-3xl font-extrabold mt-3 text-rose-400">{deactivatedCount}</div>
            <p className="text-xs text-[#6b7280] mt-1 font-medium">Login blocked</p>
          </button>
        </div>

        {/* Search & Filter Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-[#0f0f1e] border border-[#1e1e3a] p-4 rounded-2xl">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-[#4b5563]" />
            <input
              type="text"
              placeholder="Search by name, email, username…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#1a1a2e] border border-[#2a2a4e] rounded-xl pl-10 pr-4 py-2.5 text-sm text-[#e0e0e0] placeholder-[#4b5563] focus:outline-none focus:ring-2 focus:ring-[#6366f1] transition-all"
            />
          </div>

          <div className="flex items-center gap-1 bg-[#1a1a2e] border border-[#2a2a4e] p-1 rounded-xl w-full sm:w-auto">
            {[
              { id: 'all', label: 'All Users' },
              { id: 'pending_approval', label: 'Pending' },
              { id: 'active', label: 'Active' },
              { id: 'deactivated', label: 'Deactivated' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilterStatus(tab.id)}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  filterStatus === tab.id ? 'bg-[#6366f1] text-white shadow-sm' : 'text-[#9ca3af] hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-[#0f0f1e] border border-[#1e1e3a] rounded-2xl overflow-hidden">
          {loading ? (
            <div className="p-12 text-center space-y-3">
              <div className="h-8 w-8 border-2 border-[#6366f1] border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-sm font-medium text-[#6b7280]">Loading user roster…</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="p-12 text-center space-y-2">
              <UserIcon className="h-10 w-10 mx-auto text-[#4b5563]" />
              <h3 className="text-base font-bold text-white">No users found</h3>
              <p className="text-xs text-[#6b7280]">No user accounts match your search or filter.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#1e1e3a] text-[10px] font-bold uppercase tracking-wider text-[#6b7280]">
                    <th className="py-3.5 px-5">User Info</th>
                    <th className="py-3.5 px-5">Department</th>
                    <th className="py-3.5 px-5">Role</th>
                    <th className="py-3.5 px-5">Status</th>
                    <th className="py-3.5 px-5">Registered</th>
                    <th className="py-3.5 px-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1a1a2e]">
                  {filteredUsers.map((user) => (
                    <tr key={user._id} className="hover:bg-[#1a1a2e]/50 transition-colors">
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-xl bg-[#6366f1]/15 border border-[#6366f1]/25 flex items-center justify-center font-bold text-[#818cf8] text-sm shrink-0">
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-white text-sm flex items-center gap-1.5">
                              {user.name}
                              <span className="text-xs text-[#4b5563] font-normal">(@{user.username})</span>
                            </div>
                            <div className="text-xs text-[#6b7280] font-medium flex items-center gap-1">
                              <Mail className="h-3 w-3 text-[#4b5563]" /> {user.email}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-5">
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-[#d1d5db]">
                          <Building className="h-3.5 w-3.5 text-[#4b5563]" />
                          {user.department}
                        </div>
                      </td>

                      <td className="py-4 px-5">
                        <select
                          value={user.role}
                          onChange={(e) => handleUpdateStatus(user._id, user.status, e.target.value as UserRole)}
                          disabled={updatingId === user._id}
                          className={selectClass}
                        >
                          {USER_ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                        </select>
                      </td>

                      <td className="py-4 px-5">
                        {user.status === 'pending_approval' && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                            <Clock className="h-3 w-3" /> Pending Approval
                          </span>
                        )}
                        {user.status === 'active' && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                            <UserCheck className="h-3 w-3" /> Active
                          </span>
                        )}
                        {user.status === 'deactivated' && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-500/15 text-rose-300 border border-rose-500/30">
                            <UserX className="h-3 w-3" /> Deactivated
                          </span>
                        )}
                      </td>

                      <td className="py-4 px-5 text-xs text-[#6b7280] font-medium">
                        {new Date(user.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                      </td>

                      <td className="py-4 px-5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {user.status === 'pending_approval' && (
                            <button
                              onClick={() => handleUpdateStatus(user._id, 'active')}
                              disabled={updatingId === user._id}
                              className="px-3.5 py-1.5 bg-emerald-500/15 hover:bg-emerald-500 hover:text-white disabled:opacity-50 text-emerald-300 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 border border-emerald-500/30 cursor-pointer"
                            >
                              <UserCheck className="h-3.5 w-3.5" /> Approve
                            </button>
                          )}
                          {user.status === 'active' && (
                            <button
                              onClick={() => handleUpdateStatus(user._id, 'deactivated')}
                              disabled={updatingId === user._id}
                              className="px-3.5 py-1.5 bg-[#1a1a2e] hover:bg-rose-500/15 hover:text-rose-300 hover:border-rose-500/30 disabled:opacity-50 text-[#9ca3af] text-xs font-bold rounded-xl transition-all border border-[#2a2a4e] cursor-pointer"
                            >
                              Deactivate
                            </button>
                          )}
                          {user.status === 'deactivated' && (
                            <button
                              onClick={() => handleUpdateStatus(user._id, 'active')}
                              disabled={updatingId === user._id}
                              className="px-3.5 py-1.5 bg-[#6366f1]/15 hover:bg-[#6366f1] hover:text-white disabled:opacity-50 text-[#818cf8] text-xs font-bold rounded-xl transition-all border border-[#6366f1]/30 cursor-pointer"
                            >
                              Re-activate
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer note */}
        <div className="flex items-center gap-2 text-[11px] text-[#4b5563] font-semibold uppercase tracking-wider">
          <ShieldCheck className="h-4 w-4 text-emerald-500/60" />
          <span>Enterprise Access Control — sys_admin &amp; eng_admin only</span>
        </div>
      </main>
    </div>
  );
}
