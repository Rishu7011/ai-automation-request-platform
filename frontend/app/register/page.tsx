'use client';

import { useState } from 'react';
import Link from 'next/link';
import { User as UserIcon, Mail, Lock, Building, CheckCircle2, Eye, EyeOff, ArrowRight, AlertCircle, UserPlus } from 'lucide-react';
import { DEPARTMENTS } from '@/constants';
import Input from '@/components/components2/input';

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

  return (
    <div className="min-h-screen w-full bg-[#13131b] font-sans text-[#e4e1ed] relative overflow-hidden flex items-center justify-center">
      {/* Ambient glowing background accents */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-[#6366f1]/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-[#8083ff]/10 rounded-full blur-3xl pointer-events-none" />

      <section className="flex min-h-screen flex-1 flex-col items-center justify-center px-6 py-12 relative z-10 w-full">
        <div className="w-full max-w-[520px]">
          <div className="rounded-2xl border border-[#464554]/30 bg-[#191924]/80 backdrop-blur-xl p-8 shadow-2xl sm:p-10">
            <div className="mb-8 flex flex-col items-center text-center">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#6366f1]/20 border border-[#6366f1]/40 text-[#c0c1ff] shadow-inner">
                <UserPlus className="h-6 w-6" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-white font-outfit">Request an Account</h1>
              <p className="mt-1 text-xs font-medium text-[#908fa0]">Register for the AI Automation Platform</p>
            </div>

            {error && (
              <div className="flex items-center gap-2.5 mb-6 rounded-xl border border-[#ffb4ab]/30 bg-[#93000a]/20 p-3.5 text-xs font-semibold text-[#ffb4ab]">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {successMsg ? (
              <div className="space-y-4 rounded-2xl border border-emerald-500/30 bg-emerald-950/30 p-6 text-center text-sm text-emerald-200">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-emerald-500/40 bg-emerald-900/40 text-emerald-400">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-white font-outfit">Request Submitted Successfully!</h3>
                  <p className="text-xs leading-relaxed text-emerald-300">{successMsg}</p>
                </div>
                <div className="pt-2">
                  <Link
                    href="/login"
                    className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-[#8083ff] px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-[#6366f1]/30 transition-all hover:brightness-110"
                  >
                    <span>Return to Login</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  label="FULL NAME"
                  id="name"
                  name="name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your name"
                  leadingIcon={<UserIcon className="h-5 w-5" />}
                />

                <Input
                  label="WORK EMAIL"
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="exaple@company.com"
                  leadingIcon={<Mail className="h-5 w-5" />}
                />

                <Input
                  label="USERNAME"
                  id="username"
                  name="username"
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="enter username"
                  leadingIcon={<UserIcon className="h-5 w-5" />}
                />

                {/* Department Select */}
                <div>
                  <label className="mb-2 block text-xs font-semibold tracking-[0.05em] text-[#908fa0] uppercase font-outfit">DEPARTMENT</label>
                  <div className="relative">
                    <Building className="pointer-events-none absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 text-[#908fa0]" />
                    <select
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      className="w-full cursor-pointer appearance-none rounded-xl border border-[#464554]/40 bg-[#1f1f27] py-3.5 pr-4 pl-11 text-sm text-[#e4e1ed] transition-all focus:bg-[#282834] focus:outline-none focus:ring-2 focus:ring-[#6366f1] [color-scheme:dark]"
                    >
                      {DEPARTMENTS.map((dept) => (
                        <option key={dept} value={dept}>{dept}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <Input
                  label="PASSWORD"
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  leadingIcon={<Lock className="h-5 w-5" />}
                  trailingAdornment={
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-[#908fa0] transition-colors hover:text-white cursor-pointer"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  }
                />

                <button
                  type="submit"
                  disabled={loading}
                  className="mt-4 flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-[#8083ff] hover:brightness-110 px-4 py-3.5 text-sm font-bold text-white shadow-lg shadow-[#6366f1]/25 transition-all duration-200 active:scale-[0.98] disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Submitting Request…</span>
                    </>
                  ) : (
                    <>
                      <span>Submit Account Request</span>
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>

                <div className="mt-8 border-t border-[#464554]/30 pt-6 text-center text-xs text-[#908fa0] font-medium">
                  Already have an approved account?{' '}
                  <Link href="/login" className="font-bold text-[#c0c1ff] hover:underline">
                    Sign In
                  </Link>
                </div>
                <div className="mt-6 flex items-center justify-center gap-2 text-[11px] text-[#908fa0]">
                  <Lock className="h-4 w-4 text-[#c0c1ff]" />
                  <span className="font-semibold uppercase tracking-wider font-outfit">
                    Requires Admin Activation Before Login
                  </span>
                </div>
              </form>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
