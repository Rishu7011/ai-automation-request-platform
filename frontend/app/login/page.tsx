'use client';

import { useState } from 'react';
import Link from 'next/link';
import { signIn } from 'next-auth/react';
import { AtSign, Lock, Eye, EyeOff, ArrowRight, AlertCircle } from 'lucide-react';
import Input from '@/components/components2/input';


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
    <div className="min-h-screen w-full bg-[#f7f9fb] font-sans text-[#191c1e]">
      <section className="flex min-h-screen flex-1 flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-[440px]">
          <div className="rounded-2xl border border-[#c3c6d7] bg-white p-8 shadow-xl sm:p-10">
            <div className="mb-8 flex flex-col items-center text-center">
              <h1 className="text-2xl font-semibold tracking-tight text-[#191c1e]">Welcome back</h1>
              <p className="mt-1 text-sm text-[#434655]">Sign in to access your intake dashboard</p>
            </div>

            {error && (
              <div className="flex items-center gap-2.5 rounded-xl border border-[#ffdad6] bg-[#ffdad6] p-3.5 text-sm text-[#93000a]">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <Input
                label="USERNAME / EMAIL"
                type="text"
                id="username"
                name="username"
                placeholder="Enter your professional email"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                leadingIcon={<AtSign className="h-5 w-5" />}
              />

              <Input
                label="PASSWORD"
                labelAction={<button type="button" className="text-xs font-semibold text-[#004ac6] hover:underline">Forgot Password?</button>}
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                required
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

              <label className="flex cursor-pointer items-center gap-3 text-sm text-[#434655]">
                <input className="h-5 w-5 rounded border-[#c3c6d7] text-[#10b981] focus:ring-[#10b981]" type="checkbox" />
                Remember this device
              </label>

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#2563eb] px-4 py-4 text-base font-bold text-white shadow-lg shadow-[#004ac6]/20 transition-all duration-200 hover:scale-[1.02] hover:bg-[#004ac6] active:scale-[0.98] disabled:opacity-50"
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

            <div className="mt-8 space-y-4 border-t border-[#c3c6d7] pt-6 text-center">
              <p className="text-sm text-[#434655]">
                Need an account?{' '}
                <Link href="/register" className="font-bold text-[#004ac6] hover:underline">
                  Request Access
                </Link>
              </p>
              <p className="text-xs font-semibold uppercase tracking-widest text-[#737686]">
                Accounts require admin approval before activation
              </p>
            </div>
          </div>

          <div className="mt-8 flex items-center justify-center gap-2 text-xs text-[#737686]">
            <Lock className="h-[18px] w-[18px]" />
            <span className="font-semibold uppercase tracking-wider">
              Enterprise-Grade Security &amp; Encryption
            </span>
          </div>
        </div>
      </section>
    </div>
  );
}
