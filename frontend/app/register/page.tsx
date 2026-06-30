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
    <div className="min-h-screen w-full bg-[#f7f9fb] font-sans text-[#191c1e]">
      <section className="flex min-h-screen flex-1 flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-[520px]">
          <div className="rounded-2xl border border-[#c3c6d7] bg-white p-8 shadow-xl sm:p-10">
            <div className="mb-8 flex flex-col items-center text-center">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[#dbe1ff] text-[#004ac6]">
                <UserPlus className="h-6 w-6" />
              </div>
              <h1 className="text-2xl font-semibold tracking-tight text-[#191c1e]">Request an Account</h1>
              <p className="mt-1 text-sm text-[#434655]">Register for the AI Automation Platform</p>
            </div>

            {error && (
              <div className="flex items-center gap-2.5 rounded-xl border border-[#ffdad6] bg-[#ffdad6] p-3.5 text-sm text-[#93000a]">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {successMsg ? (
              <div className="space-y-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-center text-sm text-emerald-800">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-emerald-200 bg-emerald-100 text-emerald-600">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-emerald-800">Request Submitted Successfully!</h3>
                  <p className="text-xs leading-relaxed text-emerald-700">{successMsg}</p>
                </div>
                <div className="pt-2">
                  <Link
                    href="/login"
                    className="inline-flex items-center gap-2 rounded-xl bg-[#2563eb] px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-[#004ac6]/20 transition-colors hover:bg-[#004ac6]"
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
                  placeholder="Jane Doe"
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
                  placeholder="jane.doe@company.com"
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
                  placeholder="janedoe"
                  leadingIcon={<UserIcon className="h-5 w-5" />}
                />

                {/* Department */}
                <div>
                  <label className="mb-2 block text-xs font-semibold tracking-[0.05em] text-[#434655]">DEPARTMENT</label>
                  <div className="relative">
                    <Building className="pointer-events-none absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 text-[#434655]" />
                    <select
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      className="w-full cursor-pointer appearance-none rounded-lg border-0 bg-[#f1f5f9] py-3.5 pr-4 pl-11 text-sm text-[#191c1e] transition-all focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#004ac6]"
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
                      className="text-[#434655] transition-colors hover:text-[#191c1e]"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  }
                  className="w-full rounded-lg border-0 bg-[#f1f5f9] py-3.5 pr-12 pl-11 text-sm text-[#191c1e] placeholder:text-[#737686] transition-all focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#004ac6]"
                />

                <button
                  type="submit"
                  disabled={loading}
                  className="mt-2 flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#2563eb] px-4 py-4 text-base font-bold text-white shadow-lg shadow-[#004ac6]/20 transition-all duration-200 hover:scale-[1.02] hover:bg-[#004ac6] active:scale-[0.98] disabled:opacity-50"
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

                <div className="mt-8 border-t border-[#c3c6d7] pt-6 text-center text-sm text-[#434655]">
                  Already have an approved account?{' '}
                  <Link href="/login" className="font-bold text-[#004ac6] hover:underline">
                    Sign In
                  </Link>
                </div>
                <div className="mt-8 flex items-center justify-center gap-2 text-xs text-[#737686]">
                  <Lock className="h-[18px] w-[18px]" />
                  <span className="font-semibold uppercase tracking-wider">
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
