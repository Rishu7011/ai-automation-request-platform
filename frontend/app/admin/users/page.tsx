'use client';

import { useState, useEffect, useCallback } from 'react';
import { signOut, useSession } from 'next-auth/react';
import {
  ShieldCheck,
  UserCheck,
  UserX,
  Clock,
  LogOut,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  Building,
  Mail,
  Shield,
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
  const { data: session } = useSession();
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
      if (!res.ok) {
        throw new Error('Failed to fetch users');
      }
      const data = await res.json();
      setUsers(data.users || []);
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: 'Could not load users list.' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchUsers();
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

      if (!res.ok) {
        throw new Error(data.error || 'Failed to update user status');
      }

      setMessage({ type: 'success', text: data.message || 'User status updated successfully!' });
      fetchUsers();
    } catch (err) {
      setMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Error updating user status',
      });
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchesStatus =
      filterStatus === 'all' ? true : u.status === filterStatus;
    const matchesSearch =
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.department.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const pendingCount = users.filter((u) => u.status === 'pending_approval').length;
  const activeCount = users.filter((u) => u.status === 'active').length;
  const deactivatedCount = users.filter((u) => u.status === 'deactivated').length;

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans">
      {/* Header */}
      <header className="bg-slate-800 border-b border-slate-700 px-6 py-4 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white">Admin Approval Console</h1>
            <p className="text-xs text-slate-400">
              Manage account creation requests and backend approvals
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-semibold text-slate-200">{session?.user?.name}</p>
            <p className="text-xs text-slate-400 capitalize">
              {(session?.user as unknown as { role?: string })?.role || 'Admin'}
            </p>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="flex items-center gap-2 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-medium rounded-lg transition-colors border border-slate-600"
          >
            <LogOut className="h-3.5 w-3.5" /> Sign Out
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 space-y-6">
        {/* Toast / Alert Message */}
        {message && (
          <div
            className={`p-4 rounded-xl border text-sm flex items-center justify-between ${
              message.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
            }`}
          >
            <div className="flex items-center gap-3">
              {message.type === 'success' ? (
                <CheckCircle2 className="h-5 w-5 shrink-0" />
              ) : (
                <AlertCircle className="h-5 w-5 shrink-0" />
              )}
              <span>{message.text}</span>
            </div>
            <button
              onClick={() => setMessage(null)}
              className="text-xs hover:underline opacity-80"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div
            onClick={() => setFilterStatus('pending_approval')}
            className={`cursor-pointer bg-slate-800 border rounded-xl p-5 shadow-sm transition-all hover:border-amber-500/50 ${
              filterStatus === 'pending_approval' ? 'border-amber-500 ring-1 ring-amber-500' : 'border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Pending Approval
              </span>
              <div className="h-8 w-8 rounded-full bg-amber-500/10 text-amber-400 flex items-center justify-center">
                <Clock className="h-4 w-4" />
              </div>
            </div>
            <div className="text-3xl font-extrabold mt-2 text-amber-400">{pendingCount}</div>
            <p className="text-xs text-slate-400 mt-1">Requires backend action</p>
          </div>

          <div
            onClick={() => setFilterStatus('active')}
            className={`cursor-pointer bg-slate-800 border rounded-xl p-5 shadow-sm transition-all hover:border-emerald-500/50 ${
              filterStatus === 'active' ? 'border-emerald-500 ring-1 ring-emerald-500' : 'border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Approved & Active
              </span>
              <div className="h-8 w-8 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                <UserCheck className="h-4 w-4" />
              </div>
            </div>
            <div className="text-3xl font-extrabold mt-2 text-emerald-400">{activeCount}</div>
            <p className="text-xs text-slate-400 mt-1">Can log in via Credentials</p>
          </div>

          <div
            onClick={() => setFilterStatus('deactivated')}
            className={`cursor-pointer bg-slate-800 border rounded-xl p-5 shadow-sm transition-all hover:border-rose-500/50 ${
              filterStatus === 'deactivated' ? 'border-rose-500 ring-1 ring-rose-500' : 'border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Deactivated
              </span>
              <div className="h-8 w-8 rounded-full bg-rose-500/10 text-rose-400 flex items-center justify-center">
                <UserX className="h-4 w-4" />
              </div>
            </div>
            <div className="text-3xl font-extrabold mt-2 text-rose-400">{deactivatedCount}</div>
            <p className="text-xs text-slate-400 mt-1">Login blocked by backend</p>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-800 p-4 rounded-xl border border-slate-700 shadow-sm">
          {/* Search input */}
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search by name, email, username..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-4 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Status Tabs */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter className="h-4 w-4 text-slate-400 hidden sm:block" />
            <span className="text-xs text-slate-400 hidden sm:block">Status:</span>
            <div className="flex bg-slate-900 p-1 rounded-lg border border-slate-700 w-full sm:w-auto">
              {[
                { id: 'all', label: 'All Users' },
                { id: 'pending_approval', label: 'Pending Approval' },
                { id: 'active', label: 'Approved' },
                { id: 'deactivated', label: 'Deactivated' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setFilterStatus(tab.id)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                    filterStatus === tab.id
                      ? 'bg-indigo-600 text-white shadow'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl shadow-md overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-slate-400 space-y-3">
              <div className="h-8 w-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-sm">Loading users list...</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="p-12 text-center text-slate-400 space-y-2">
              <UserIcon className="h-10 w-10 mx-auto text-slate-600" />
              <h3 className="text-base font-semibold text-slate-300">No users found</h3>
              <p className="text-xs text-slate-500">
                No user accounts match your current filter or search criteria.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-900/60 border-b border-slate-700 text-xs uppercase tracking-wider text-slate-400">
                    <th className="py-3.5 px-4 font-semibold">User Info</th>
                    <th className="py-3.5 px-4 font-semibold">Department</th>
                    <th className="py-3.5 px-4 font-semibold">Role</th>
                    <th className="py-3.5 px-4 font-semibold">Status</th>
                    <th className="py-3.5 px-4 font-semibold">Registered Date</th>
                    <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/60">
                  {filteredUsers.map((user) => (
                    <tr key={user._id} className="hover:bg-slate-750/50 transition-colors">
                      {/* User Info */}
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-full bg-slate-700 border border-slate-600 flex items-center justify-center font-bold text-indigo-400 text-sm">
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-100 flex items-center gap-1.5">
                              {user.name}
                              <span className="text-xs text-slate-400 font-normal">
                                (@{user.username})
                              </span>
                            </div>
                            <div className="text-xs text-slate-400 flex items-center gap-1">
                              <Mail className="h-3 w-3 text-slate-500" /> {user.email}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Department */}
                      <td className="py-4 px-4 text-slate-300">
                        <div className="flex items-center gap-1.5 text-xs">
                          <Building className="h-3.5 w-3.5 text-slate-500" />
                          {user.department}
                        </div>
                      </td>

                      {/* Role */}
                      <td className="py-4 px-4">
                        <select
                          value={user.role}
                          onChange={(e) =>
                            handleUpdateStatus(user._id, user.status, e.target.value as UserRole)
                          }
                          disabled={updatingId === user._id}
                          className="bg-slate-900 border border-slate-700 text-xs text-slate-300 rounded-lg px-2.5 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        >
                          {USER_ROLES.map((r) => (
                            <option key={r} value={r}>
                              {r}
                            </option>
                          ))}
                        </select>
                      </td>

                      {/* Status badge */}
                      <td className="py-4 px-4">
                        {user.status === 'pending_approval' && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                            <Clock className="h-3 w-3" /> Pending Approval
                          </span>
                        )}
                        {user.status === 'active' && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            <UserCheck className="h-3 w-3" /> Approved / Active
                          </span>
                        )}
                        {user.status === 'deactivated' && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                            <UserX className="h-3 w-3" /> Deactivated
                          </span>
                        )}
                      </td>

                      {/* Registered Date */}
                      <td className="py-4 px-4 text-xs text-slate-400">
                        {new Date(user.createdAt).toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {user.status === 'pending_approval' && (
                            <button
                              onClick={() => handleUpdateStatus(user._id, 'active')}
                              disabled={updatingId === user._id}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1 shadow-sm"
                            >
                              <UserCheck className="h-3.5 w-3.5" /> Approve
                            </button>
                          )}

                          {user.status === 'active' && (
                            <button
                              onClick={() => handleUpdateStatus(user._id, 'deactivated')}
                              disabled={updatingId === user._id}
                              className="px-3 py-1.5 bg-slate-700 hover:bg-rose-600/80 hover:text-white disabled:opacity-50 text-slate-300 text-xs font-medium rounded-lg transition-colors"
                            >
                              Deactivate
                            </button>
                          )}

                          {user.status === 'deactivated' && (
                            <button
                              onClick={() => handleUpdateStatus(user._id, 'active')}
                              disabled={updatingId === user._id}
                              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition-colors"
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
      </main>
    </div>
  );
}
