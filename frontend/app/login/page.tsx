'use client';

import { useState } from 'react';
import Link from 'next/link';
import { signIn } from 'next-auth/react';
import { Lock, User as UserIcon, Eye, EyeOff, ArrowRight, CheckCircle2, AlertCircle, Zap } from 'lucide-react';

const PLATFORM_FEATURES = [
  {
    icon: '🤖',
    title: 'AI-Guided Intake',
    desc: 'Multi-stage conversational intake powered by AI agents that extract structured business info.',
  },
  {
    icon: '💰',
    title: 'Deterministic ROI Engine',
    desc: 'AI extracts inputs, but your backend calculates ROI — auditable, reproducible math every time.',
  },
  {
    icon: '📊',
    title: 'Priority-Scored Backlog',
    desc: 'Engineering gets a ranked backlog combining ROI, urgency, effort, risk and strategic value.',
  },
  {
    icon: '👁️',
    title: 'Company-Wide Ledger',
    desc: 'All employees see submitted proposals — transparent visibility, no duplicate requests.',
  },
  {
    icon: '📜',
    title: 'Immutable Audit Trail',
    desc: 'Every override, status change, and approval is permanently logged for compliance.',
  },
];

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await signIn('credentials', {
        username,
        password,
        redirect: false,
      });

      if (res?.error) {
        setError(res.error);
        setLoading(false);
        return;
      }

      window.location.href = '/my-requests';
    } catch {
      setError('An error occurred during login. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col md:flex-row bg-[#0a0a12] text-white font-sans">
      {/* ── Left Hero Panel ────────────────────────────────────────── */}
      <aside className="hidden md:flex flex-col justify-between w-[46%] xl:w-[42%] bg-gradient-to-br from-[#0f0f1e] via-[#13132a] to-[#0d0d1c] border-r border-[#1e1e3a] p-10 xl:p-14 relative overflow-hidden">
        {/* Background glow */}
        <div className="pointer-events-none absolute -top-32 -left-32 w-[500px] h-[500px] rounded-full bg-[#6366f1]/10 blur-[120px]" />
        <div className="pointer-events-none absolute bottom-0 right-0 w-[300px] h-[300px] rounded-full bg-[#8b5cf6]/8 blur-[80px]" />

        {/* Logo */}
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-12">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#6366f1] to-[#8b5cf6] flex items-center justify-center text-white text-xl shadow-lg shadow-[#6366f1]/30">
              🤖
            </div>
            <div>
              <p className="font-extrabold text-base text-white tracking-tight">AI Automation</p>
              <p className="text-[11px] text-[#6b7280] font-medium tracking-wide">Enterprise Intake & Priority Platform</p>
            </div>
          </div>

          <h1 className="text-3xl xl:text-4xl font-extrabold text-white leading-tight mb-4">
            Submit ideas.<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#818cf8] to-[#a78bfa]">
              Prioritize with AI.
            </span>
          </h1>
          <p className="text-sm text-[#9ca3af] leading-relaxed mb-10 max-w-sm">
            Give your team a structured, AI-powered way to surface automation opportunities — and give engineering a defensible, data-driven backlog.
          </p>

          {/* Feature list */}
          <ul className="space-y-5">
            {PLATFORM_FEATURES.map((f) => (
              <li key={f.title} className="flex items-start gap-3.5">
                <div className="w-9 h-9 rounded-xl bg-[#1e1e3a] border border-[#2a2a4e] flex items-center justify-center text-lg shrink-0 mt-0.5">
                  {f.icon}
                </div>
                <div>
                  <p className="text-sm font-bold text-white">{f.title}</p>
                  <p className="text-xs text-[#9ca3af] leading-relaxed">{f.desc}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Bottom tag */}
        <div className="relative z-10 mt-8 flex items-center gap-2 text-[11px] text-[#4b5563] font-semibold uppercase tracking-wider">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          Internal access only — not a public product
        </div>
      </aside>

      {/* ── Right Login Panel ───────────────────────────────────────── */}
      <section className="flex-1 flex flex-col items-center justify-center bg-[#0a0a12] p-6 md:p-12">
        <div className="w-full max-w-md">
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
                <Lock className="h-6 w-6" />
              </div>
              <h2 className="text-2xl font-bold text-white tracking-tight">Sign In to Workspace</h2>
              <p className="text-sm text-[#6b7280]">Access your AI Automation Intake Dashboard</p>
            </div>

            {error && (
              <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm rounded-xl p-3.5 flex items-center gap-2.5">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#9ca3af] mb-1.5">
                  Username or Email
                </label>
                <div className="relative">
                  <UserIcon className="absolute left-3.5 top-3.5 h-4 w-4 text-[#4b5563]" />
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter your email or username"
                    className="w-full bg-[#1a1a2e] border border-[#2a2a4e] rounded-xl pl-10 pr-4 py-3 text-sm text-[#e0e0e0] placeholder-[#4b5563] focus:outline-none focus:ring-2 focus:ring-[#6366f1] focus:border-[#6366f1] transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#9ca3af] mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-[#4b5563]" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-[#1a1a2e] border border-[#2a2a4e] rounded-xl pl-10 pr-11 py-3 text-sm text-[#e0e0e0] placeholder-[#4b5563] focus:outline-none focus:ring-2 focus:ring-[#6366f1] focus:border-[#6366f1] transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-3.5 text-[#4b5563] hover:text-[#9ca3af] transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-4 bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] hover:from-[#5558e0] hover:to-[#7c4fdb] disabled:opacity-50 text-white font-bold text-sm rounded-xl transition-all shadow-lg shadow-[#6366f1]/20 flex items-center justify-center gap-2 group cursor-pointer"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Authenticating…</span>
                  </>
                ) : (
                  <>
                    <span>Sign In to Dashboard</span>
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                  </>
                )}
              </button>
            </form>

            <div className="pt-5 border-t border-[#1e1e3a] text-center space-y-2">
              <p className="text-xs text-[#6b7280]">
                Need an account?{' '}
                <Link href="/register" className="text-[#818cf8] font-bold hover:text-[#a78bfa] transition-colors">
                  Request Access
                </Link>
              </p>
              <p className="text-[11px] text-[#4b5563] uppercase tracking-wider font-semibold">
                Accounts require admin approval before activation
              </p>
            </div>
          </div>

          {/* Security sub-footer */}
          <div className="mt-8 flex items-center justify-center gap-2 text-[#4b5563] text-xs">
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="font-semibold uppercase tracking-wider text-[11px]">
              Protected by Enterprise-Grade Security & RBAC
            </span>
          </div>
        </div>
      </section>
    </div>
  );
}
