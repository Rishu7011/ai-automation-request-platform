'use client';

import { useEffect, useState } from 'react';
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

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const errParam = urlParams.get('error');
      if (errParam === 'Configuration') {
        setError('Server authentication error. Please verify MONGODB_URI and AUTH_SECRET are set in Vercel environment variables.');
      } else if (errParam === 'CredentialsSignin') {
        setError('Invalid username, email, or password.');
      } else if (errParam) {
        setError(errParam);
      }
    }
  }, []);

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
        if (res.error === 'Configuration') {
          setError('Server authentication error. Please verify MONGODB_URI and AUTH_SECRET are set in Vercel environment variables.');
        } else if (res.error === 'CredentialsSignin') {
          setError('Invalid username, email, or password.');
        } else {
          setError(res.error);
        }
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
    <div className="min-h-screen w-full bg-[#13131b] font-sans text-[#e4e1ed] relative overflow-hidden flex items-center justify-center">
      {/* Ambient glowing background accents */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-[#6366f1]/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-[#8083ff]/10 rounded-full blur-3xl pointer-events-none" />

      <section className="flex min-h-screen flex-1 flex-col items-center justify-center px-6 py-12 relative z-10 w-full">
        <div className="w-full max-w-[440px]">
          <div className="rounded-2xl border border-[#464554]/30 bg-[#191924]/80 backdrop-blur-xl p-8 shadow-2xl sm:p-10">
            <div className="mb-8 flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-2xl bg-[#6366f1]/20 border border-[#6366f1]/40 flex items-center justify-center text-[#c0c1ff] mb-4 shadow-inner">
                <Lock className="h-6 w-6" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-white font-outfit">Welcome Back</h1>
              <p className="mt-1 text-xs font-medium text-[#908fa0]">Sign in to access your intake dashboard</p>
            </div>

            {error && (
              <div className="flex items-center gap-2.5 mb-6 rounded-xl border border-[#ffb4ab]/30 bg-[#93000a]/20 p-3.5 text-xs font-semibold text-[#ffb4ab]">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <Input
                label="USERNAME / EMAIL"
                type="text"
                id="username"
                name="username"
                placeholder="Enter your username or email"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                leadingIcon={<AtSign className="h-5 w-5" />}
              />

              <Input
                label="PASSWORD"
                labelAction={<button type="button" className="text-xs font-semibold text-[#c0c1ff] hover:underline cursor-pointer">Forgot Password?</button>}
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
                    className="text-[#908fa0] transition-colors hover:text-white cursor-pointer"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                }
              />

              <label className="flex cursor-pointer items-center gap-2.5 text-xs text-[#908fa0] font-medium pt-1">
                <input className="h-4 w-4 rounded border-[#464554] bg-[#1f1f27] text-[#6366f1] focus:ring-[#6366f1] accent-[#6366f1]" type="checkbox" />
                Remember this device
              </label>

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-[#8083ff] hover:brightness-110 px-4 py-3.5 text-sm font-bold text-white shadow-lg shadow-[#6366f1]/25 transition-all duration-200 active:scale-[0.98] disabled:opacity-50 cursor-pointer"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Authenticating…</span>
                  </>
                ) : (
                  <>
                    <span>Sign In to Dashboard</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-8 space-y-3 border-t border-[#464554]/30 pt-6 text-center">
              <p className="text-xs text-[#908fa0] font-medium">
                Need an account?{' '}
                <Link href="/register" className="font-bold text-[#c0c1ff] hover:underline">
                  Request Access
                </Link>
              </p>
              <p className="text-[10px] font-mono-code uppercase tracking-widest text-[#908fa0]">
                Accounts require admin approval before activation
              </p>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-center gap-2 text-[11px] text-[#908fa0]">
            <Lock className="h-4 w-4 text-[#c0c1ff]" />
            <span className="font-semibold uppercase tracking-wider font-outfit">
              Enterprise-Grade Security &amp; Encryption
            </span>
          </div>
        </div>
      </section>
    </div>
  );
}
