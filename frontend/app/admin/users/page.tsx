'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  UserCheck,
  UserX,
  Clock,
  Search,
  CheckCircle2,
  AlertCircle,
  Shield,
  User as UserIcon,
} from 'lucide-react';
import { USER_ROLES, UserRole, UserStatus } from '@/constants';

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

  const pendingCount     = users.filter((u) => u.status === 'pending_approval').length;
  const activeCount      = users.filter((u) => u.status === 'active').length;
  const deactivatedCount = users.filter((u) => u.status === 'deactivated').length;

  const selectClass = 'bg-[#1f1f27] border border-[#464554]/40 text-[#e4e1ed] text-xs font-semibold rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#6366f1] cursor-pointer';

  return (
    <div className="min-h-screen bg-[#13131b] text-[#e4e1ed] font-inter">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">

        {/* Page header */}
        <div className="border-b border-[#464554]/30 pb-6">
          <h1 className="text-xl sm:text-2xl font-bold font-outfit text-[#c0c1ff] tracking-tight">User Account Governance &amp; Approvals</h1>
          <p className="text-xs text-[#908fa0] mt-1">
            Review registration requests, assign organization roles, and manage system access states.
          </p>
        </div>

        {/* Alert Toast */}
        {message && (
          <div className={`p-4 rounded-xl border text-xs flex items-center justify-between ${
            message.type === 'success'
              ? 'bg-[#00a572]/15 border-[#00a572]/30 text-[#4edea3]'
              : 'bg-[#93000a]/20 border-[#ffb4ab]/30 text-[#ffb4ab]'
          }`}>
            <div className="flex items-center gap-3">
              {message.type === 'success'
                ? <CheckCircle2 className="h-4 w-4 shrink-0 text-[#4edea3]" />
                : <AlertCircle className="h-4 w-4 shrink-0 text-[#ffb4ab]" />
              }
              <span>{message.text}</span>
            </div>
            <button onClick={() => setMessage(null)} className="text-xs font-semibold underline cursor-pointer hover:opacity-80">
              Dismiss
            </button>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <button
            onClick={() => setFilterStatus('pending_approval')}
            className={`glass-panel rounded-xl p-5 text-left transition-all hover:border-[#ffb95f]/50 cursor-pointer ${
              filterStatus === 'pending_approval' ? 'border-[#ffb95f]/60 ring-2 ring-[#ffb95f]/20' : 'border-[#464554]/30'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#908fa0] font-outfit">Pending Approval</span>
              <div className="h-9 w-9 rounded-lg bg-[#ffb95f]/15 border border-[#ffb95f]/30 text-[#ffb95f] flex items-center justify-center">
                <Clock className="h-4 w-4" />
              </div>
            </div>
            <div className="text-3xl font-bold font-outfit mt-3 text-[#ffb95f]">{pendingCount}</div>
            <p className="text-[11px] text-[#908fa0] mt-1 font-medium">Requires admin review</p>
          </button>

          <button
            onClick={() => setFilterStatus('active')}
            className={`glass-panel rounded-xl p-5 text-left transition-all hover:border-[#00a572]/50 cursor-pointer ${
              filterStatus === 'active' ? 'border-[#00a572]/60 ring-2 ring-[#00a572]/20' : 'border-[#464554]/30'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#908fa0] font-outfit">Approved & Active</span>
              <div className="h-9 w-9 rounded-lg bg-[#00a572]/15 border border-[#00a572]/30 text-[#4edea3] flex items-center justify-center">
                <UserCheck className="h-4 w-4" />
              </div>
            </div>
            <div className="text-3xl font-bold font-outfit mt-3 text-[#4edea3]">{activeCount}</div>
            <p className="text-[11px] text-[#908fa0] mt-1 font-medium">Active accounts</p>
          </button>

          <button
            onClick={() => setFilterStatus('deactivated')}
            className={`glass-panel rounded-xl p-5 text-left transition-all hover:border-[#ffb4ab]/50 cursor-pointer ${
              filterStatus === 'deactivated' ? 'border-[#ffb4ab]/60 ring-2 ring-[#ffb4ab]/20' : 'border-[#464554]/30'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#908fa0] font-outfit">Deactivated Users</span>
              <div className="h-9 w-9 rounded-lg bg-[#93000a]/20 border border-[#ffb4ab]/30 text-[#ffb4ab] flex items-center justify-center">
                <UserX className="h-4 w-4" />
              </div>
            </div>
            <div className="text-3xl font-bold font-outfit mt-3 text-[#ffb4ab]">{deactivatedCount}</div>
            <p className="text-[11px] text-[#908fa0] mt-1 font-medium">Access revoked</p>
          </button>
        </div>

        {/* Filter and Search Bar */}
        <div className="glass-panel p-4 rounded-xl border border-[#464554]/30 flex flex-col sm:flex-row items-center gap-3">
          <div className="relative w-full sm:flex-1">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-[#908fa0]" />
            <input
              type="text"
              placeholder="Search by name, email, username, or department…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#1f1f27] border border-[#464554]/40 rounded-lg pl-10 pr-4 py-2 text-xs text-[#e4e1ed] placeholder-[#908fa0] focus:outline-none focus:ring-2 focus:ring-[#6366f1]"
            />
          </div>

          <button
            onClick={() => setFilterStatus('all')}
            className={`w-full sm:w-auto px-3 py-2 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
              filterStatus === 'all'
                ? 'bg-[#6366f1] text-white border-[#6366f1]'
                : 'bg-[#1f1f27] border-[#464554]/40 text-[#c7c4d7] hover:bg-[#34343d]'
            }`}
          >
            Show All ({users.length})
          </button>
        </div>

        {/* Users Table */}
        {loading ? (
          <div className="py-20 text-center space-y-3">
            <div className="w-10 h-10 border-2 border-[#6366f1] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-[#908fa0] text-xs font-medium">Loading user database…</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-12 text-center glass-panel rounded-xl border border-[#464554]/30 text-[#908fa0] text-xs font-medium">
            No user accounts found matching your search.
          </div>
        ) : (
          <div className="glass-panel border border-[#464554]/30 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-[#e4e1ed]">
                <thead className="bg-[#1f1f27] border-b border-[#464554]/30 text-[10px] font-bold uppercase tracking-wider text-[#908fa0] font-outfit">
                  <tr>
                    <th className="px-4 py-3.5">User Details</th>
                    <th className="px-4 py-3.5">Department</th>
                    <th className="px-4 py-3.5">Role</th>
                    <th className="px-4 py-3.5">Account Status</th>
                    <th className="px-4 py-3.5">Registered Date</th>
                    <th className="px-4 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#464554]/20">
                  {filteredUsers.map((user) => {
                    const isUpdating = updatingId === user._id;

                    const statusBadge =
                      user.status === 'active'
                        ? { label: 'Active', color: 'bg-[#00a572]/15 text-[#4edea3] border-[#00a572]/30' }
                        : user.status === 'pending_approval'
                        ? { label: 'Pending Approval', color: 'bg-[#ffb95f]/15 text-[#ffb95f] border-[#ffb95f]/30' }
                        : { label: 'Deactivated', color: 'bg-[#93000a]/20 text-[#ffb4ab] border-[#ffb4ab]/30' };

                    return (
                      <tr key={user._id} className="hover:bg-[#34343d]/40 transition-colors">
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-lg bg-[#6366f1]/20 border border-[#8083ff]/30 text-[#c0c1ff] flex items-center justify-center font-bold text-xs font-outfit shrink-0">
                              {user.name ? user.name.charAt(0).toUpperCase() : <UserIcon className="h-4 w-4" />}
                            </div>
                            <div>
                              <p className="font-semibold text-white text-xs">{user.name}</p>
                              <p className="text-[#908fa0] text-[11px] font-mono-code">{user.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <span className="px-2.5 py-1 rounded-md bg-[#1f1f27] text-[#c7c4d7] border border-[#464554]/40 font-medium text-[11px]">
                            {user.department || 'General'}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <select
                            disabled={isUpdating}
                            value={user.role}
                            onChange={(e) => handleUpdateStatus(user._id, user.status, e.target.value as UserRole)}
                            className={`${selectClass} border-[#6366f1]/30 text-[#c0c1ff]`}
                          >
                            {USER_ROLES.map((r) => (
                              <option key={r} value={r}>{r}</option>
                            ))}
                          </select>
                        </td>
                        <td className="px-4 py-4">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${statusBadge.color}`}>
                            {statusBadge.label}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-[#908fa0] font-mono-code text-[11px]">
                          {new Date(user.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                        </td>
                        <td className="px-4 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {user.status === 'pending_approval' && (
                              <button
                                disabled={isUpdating}
                                onClick={() => handleUpdateStatus(user._id, 'active')}
                                className="px-3 py-1.5 rounded-md bg-[#00a572] hover:bg-[#4edea3] hover:text-[#002113] text-white font-semibold text-xs transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50"
                              >
                                <UserCheck className="h-3.5 w-3.5" />
                                <span>Approve</span>
                              </button>
                            )}

                            {user.status === 'active' && (
                              <button
                                disabled={isUpdating}
                                onClick={() => handleUpdateStatus(user._id, 'deactivated')}
                                className="px-3 py-1.5 rounded-md border border-[#ffb4ab]/30 bg-[#93000a]/20 text-[#ffb4ab] hover:bg-[#93000a]/40 font-semibold text-xs transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50"
                              >
                                <UserX className="h-3.5 w-3.5" />
                                <span>Deactivate</span>
                              </button>
                            )}

                            {user.status === 'deactivated' && (
                              <button
                                disabled={isUpdating}
                                onClick={() => handleUpdateStatus(user._id, 'active')}
                                className="px-3 py-1.5 rounded-md border border-[#00a572]/40 bg-[#00a572]/15 text-[#4edea3] hover:bg-[#00a572] hover:text-white font-semibold text-xs transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50"
                              >
                                <Shield className="h-3.5 w-3.5" />
                                <span>Reactivate</span>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Footer note */}
        <div className="flex items-center gap-2 text-[11px] text-[#908fa0] font-semibold uppercase tracking-wider">
          <Shield className="h-4 w-4 text-[#4edea3]" />
          <span>Enterprise Access Control — sys_admin &amp; eng_admin only</span>
        </div>
      </main>
    </div>
  );
}
