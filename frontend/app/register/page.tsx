'use client';

import { useState } from 'react';
import Link from 'next/link';
import { User as UserIcon, Mail, Lock, Building, CheckCircle2, Eye, EyeOff, ArrowRight, AlertCircle, UserPlus } from 'lucide-react';
import { DEPARTMENTS } from '@/constants';

const WHY_JOIN = [
  { icon: '🗣️', text: 'Submit automation ideas in minutes via AI-guided intake — no business-case writing needed.' },
  { icon: '📊', text: 'Track your requests in real time: from AI review, to scoring, to engineering approval.' },
  { icon: '👁️', text: 'See every org-wide automation proposal in the company ledger for full transparency.' },
  { icon: '🔔', text: 'Get notified instantly on status changes, comments, and engineering decisions.' },
];

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [department, setDepartment] = useState<string>(DEPARTMENTS[0]);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, username, password, department }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to submit account request');
        setLoading(false);
        return;
      }

      setSuccessMsg(data.message);
      setName('');
      setEmail('');
      setUsername('');
      setPassword('');
      setLoading(false);
    } catch {
      setError('An error occurred during registration. Please try again.');
      setLoading(false);
    }
  };

  const inputClass =
    'w-full bg-[#1a1a2e] border border-[#2a2a4e] rounded-xl pl-10 pr-4 py-2.5 text-sm text-[#e0e0e0] placeholder-[#4b5563] focus:outline-none focus:ring-2 focus:ring-[#6366f1] focus:border-[#6366f1] transition-all';

  return (
    <div className="min-h-screen w-full flex flex-col md:flex-row bg-[#0a0a12] text-white font-sans">
      {/* ── Left Hero Panel ────────────────────────────────────────── */}
      <aside className="hidden md:flex flex-col justify-between w-[42%] xl:w-[40%] bg-gradient-to-br from-[#0f0f1e] via-[#13132a] to-[#0d0d1c] border-r border-[#1e1e3a] p-10 xl:p-14 relative overflow-hidden">
        {/* Background glow */}
        <div className="pointer-events-none absolute -top-32 -left-32 w-[500px] h-[500px] rounded-full bg-[#6366f1]/10 blur-[120px]" />
        <div className="pointer-events-none absolute bottom-0 right-0 w-[300px] h-[300px] rounded-full bg-[#8b5cf6]/8 blur-[80px]" />

        {/* Logo */}
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-10">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#6366f1] to-[#8b5cf6] flex items-center justify-center text-white text-xl shadow-lg shadow-[#6366f1]/30">
              🤖
            </div>
            <div>
              <p className="font-extrabold text-base text-white tracking-tight">AI Automation</p>
              <p className="text-[11px] text-[#6b7280] font-medium tracking-wide">Enterprise Intake & Priority Platform</p>
            </div>
          </div>

          <h1 className="text-3xl xl:text-4xl font-extrabold text-white leading-tight mb-4">
            Your ideas deserve<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#818cf8] to-[#a78bfa]">
              a fair hearing.
            </span>
          </h1>
          <p className="text-sm text-[#9ca3af] leading-relaxed mb-10 max-w-sm">
            Request an account to start submitting automation ideas. An admin will approve your access before you can log in.
          </p>

          {/* Why join list */}
          <ul className="space-y-5">
            {WHY_JOIN.map((item) => (
              <li key={item.icon} className="flex items-start gap-3.5">
                <div className="w-9 h-9 rounded-xl bg-[#1e1e3a] border border-[#2a2a4e] flex items-center justify-center text-lg shrink-0 mt-0.5">
                  {item.icon}
                </div>
                <p className="text-xs text-[#9ca3af] leading-relaxed pt-1">{item.text}</p>
              </li>
            ))}
          </ul>
        </div>

        {/* Bottom approval notice */}
        <div className="relative z-10 mt-8 p-4 rounded-xl bg-[#1a1a2e]/60 border border-[#2a2a4e] text-xs text-[#9ca3af] leading-relaxed">
          <span className="font-bold text-[#818cf8]">Note:</span> Account requests enter a{' '}
          <span className="font-bold text-amber-400">Pending Approval</span> state. A System Admin
          must activate your account before you can sign in.
        </div>
      </aside>

      {/* ── Right Registration Panel ────────────────────────────────── */}
      <section className="flex-1 flex flex-col items-center justify-center bg-[#0a0a12] p-6 md:p-12 overflow-y-auto">
        <div className="w-full max-w-md my-auto">
          {/* Mobile logo */}
          <div className="flex md:hidden items-center gap-3 mb-8 justify-center">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#6366f1] to-[#8b5cf6] flex items-center justify-center text-lg">
              🤖
            </div>
            <p className="font-extrabold text-base text-white">AI Automation Platform</p>
          </div>

          {/* Card */}
          <div className="bg-[#0f0f1e] border border-[#1e1e3a] rounded-2xl p-8 sm:p-10 shadow-2xl space-y-6">
            <div className="flex flex-col items-center text-center space-y-2">
              <div className="h-12 w-12 rounded-xl bg-[#6366f1]/15 border border-[#6366f1]/30 flex items-center justify-center text-[#818cf8] mb-1">
                <UserPlus className="h-6 w-6" />
              </div>
              <h2 className="text-2xl font-bold text-white tracking-tight">Request an Account</h2>
              <p className="text-sm text-[#6b7280]">Register for the AI Automation Platform</p>
            </div>

            {error && (
              <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm rounded-xl p-3.5 flex items-center gap-2.5">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
                <span>{error}</span>
              </div>
            )}

            {successMsg ? (
              <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-sm rounded-2xl p-6 space-y-4 text-center">
                <div className="h-12 w-12 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mx-auto">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-bold text-emerald-300 text-base">Request Submitted Successfully!</h3>
                  <p className="text-xs text-emerald-400/80 leading-relaxed">{successMsg}</p>
                </div>
                <div className="pt-2">
                  <Link
                    href="/login"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] hover:from-[#5558e0] hover:to-[#7c4fdb] text-white font-bold text-xs transition-all shadow-md shadow-[#6366f1]/20"
                  >
                    <span>Return to Login</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Full Name */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#9ca3af] mb-1.5">Full Name</label>
                  <div className="relative">
                    <UserIcon className="absolute left-3.5 top-3 h-4 w-4 text-[#4b5563]" />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Jane Doe"
                      className={inputClass}
                    />
                  </div>
                </div>

                {/* Work Email */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#9ca3af] mb-1.5">Work Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-3 h-4 w-4 text-[#4b5563]" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="jane.doe@company.com"
                      className={inputClass}
                    />
                  </div>
                </div>

                {/* Username */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#9ca3af] mb-1.5">Username</label>
                  <div className="relative">
                    <UserIcon className="absolute left-3.5 top-3 h-4 w-4 text-[#4b5563]" />
                    <input
                      type="text"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="janedoe"
                      className={inputClass}
                    />
                  </div>
                </div>

                {/* Department */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#9ca3af] mb-1.5">Department</label>
                  <div className="relative">
                    <Building className="absolute left-3.5 top-3 h-4 w-4 text-[#4b5563] pointer-events-none" />
                    <select
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      className="w-full bg-[#1a1a2e] border border-[#2a2a4e] rounded-xl pl-10 pr-4 py-2.5 text-sm text-[#e0e0e0] focus:outline-none focus:ring-2 focus:ring-[#6366f1] focus:border-[#6366f1] transition-all appearance-none cursor-pointer"
                    >
                      {DEPARTMENTS.map((dept) => (
                        <option key={dept} value={dept}>{dept}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#9ca3af] mb-1.5">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-3 h-4 w-4 text-[#4b5563]" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      minLength={6}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-[#1a1a2e] border border-[#2a2a4e] rounded-xl pl-10 pr-11 py-2.5 text-sm text-[#e0e0e0] placeholder-[#4b5563] focus:outline-none focus:ring-2 focus:ring-[#6366f1] focus:border-[#6366f1] transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-3 text-[#4b5563] hover:text-[#9ca3af] transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 px-4 bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] hover:from-[#5558e0] hover:to-[#7c4fdb] disabled:opacity-50 text-white font-bold text-sm rounded-xl transition-all shadow-lg shadow-[#6366f1]/20 flex items-center justify-center gap-2 group cursor-pointer mt-2"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Submitting Request…</span>
                    </>
                  ) : (
                    <>
                      <span>Submit Account Request</span>
                      <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                    </>
                  )}
                </button>

                <div className="pt-4 border-t border-[#1e1e3a] text-center text-xs text-[#6b7280]">
                  Already have an approved account?{' '}
                  <Link href="/login" className="text-[#818cf8] font-bold hover:text-[#a78bfa] transition-colors">
                    Sign In
                  </Link>
                </div>
              </form>
            )}
          </div>

          {/* Security sub-footer */}
          <div className="mt-6 flex items-center justify-center gap-2 text-[#4b5563] text-xs">
            <div className="w-2 h-2 rounded-full bg-amber-400" />
            <span className="font-semibold uppercase tracking-wider text-[11px]">
              Requires Admin Activation Before Login
            </span>
          </div>
        </div>
      </section>
    </div>
  );
}
