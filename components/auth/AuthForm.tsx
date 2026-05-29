'use client';

import { useState, useTransition } from 'react';
import { login, register } from '@/app/actions/auth';
import { CircleNotch, CheckCircle, Warning } from '@phosphor-icons/react';

interface AuthFormProps {
  type: 'signin' | 'register';
  setActiveTab?: (tab: 'signin' | 'register') => void;
}

export default function AuthForm({ type, setActiveTab }: AuthFormProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [isRegistered, setIsRegistered] = useState(false);

  const handleSubmit = async (formData: FormData) => {
    setError(null);
    startTransition(async () => {
      try {
        const result = type === 'signin'
          ? await login(formData)
          : await register(formData);

        if (result?.error) {
          if (result.error.includes('over_email_send_rate_limit') || result.error.includes('rate_limit') || result.error.includes('email_send')) {
            setError('Supabase SMTP email rate limit reached. To bypass this, go to your Supabase Auth Dashboard -> Providers -> Email and disable "Confirm Email". You can also try signing in directly.');
          } else {
            setError(result.error);
          }
        } else if (type === 'register' && result && 'success' in result) {
          setIsRegistered(true);
        }
      } catch {
        setError('An unexpected error occurred. Please try again.');
      }
    });
  };

  if (isRegistered) {
    return (
      <div className="glass-panel space-y-6 text-center py-8 fade-in">
        <div className="flex justify-center">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <CheckCircle size={32} weight="bold" />
          </div>
        </div>
        
        <div className="space-y-2">
          <h2 className="text-xl font-bold tracking-tight text-white uppercase tracking-widest text-xs">Registration Confirmed</h2>
          <p className="text-[#64748b] text-sm max-w-xs mx-auto leading-relaxed">
            Your account has been successfully created. Email confirmation check has been bypassed.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setIsRegistered(false);
            setActiveTab?.('signin');
          }}
          className="w-full flex items-center justify-center space-x-2 bg-[#24263b] hover:bg-[#313552] border border-[#24263b] text-white active:scale-[0.98] transition-all duration-200 font-bold uppercase tracking-wider rounded-xl py-3 text-xs"
        >
          <span>Continue to Sign In</span>
        </button>
      </div>
    );
  }

  return (
    <form action={handleSubmit} className="glass-panel space-y-6 bg-[#11121d] border border-[#24263b] shadow-2xl p-6 rounded-2xl">
      <div className="space-y-4">
        {type === 'register' && (
          <div className="space-y-1.5">
            <label htmlFor="name" className="block text-[10px] font-bold text-[#64748b] tracking-wider uppercase">
              Full Name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              placeholder="e.g. Liam Sterling"
              className="w-full bg-[#161726] border border-[#24263b] text-[#f1f5f9] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all focus:border-blue-500/40"
            />
          </div>
        )}

        <div className="space-y-1.5">
          <label htmlFor="email" className="block text-[10px] font-bold text-[#64748b] tracking-wider uppercase">
            Email Address
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            placeholder="e.g. liam@statuscheck.com"
            className="w-full bg-[#161726] border border-[#24263b] text-[#f1f5f9] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all focus:border-blue-500/40"
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="password" className="block text-[10px] font-bold text-[#64748b] tracking-wider uppercase">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            minLength={8}
            placeholder="••••••••"
            className="w-full bg-[#161726] border border-[#24263b] text-[#f1f5f9] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all focus:border-blue-500/40"
          />
          <p className="text-[10px] text-[#64748b] font-mono leading-none">Minimum 8 characters required</p>
        </div>

        {type === 'register' && (
          <div className="space-y-1.5">
            <label htmlFor="role" className="block text-[10px] font-bold text-[#64748b] tracking-wider uppercase">
              Role
            </label>
            <div className="relative">
              <select
                id="role"
                name="role"
                required
                className="w-full bg-[#161726] border border-[#24263b] text-[#f1f5f9] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all appearance-none"
                defaultValue=""
              >
                <option value="" disabled className="bg-[#11121d] text-[#64748b]">Select your team role</option>
                <option value="manager" className="bg-[#11121d] text-[#f1f5f9]">Manager</option>
                <option value="member" className="bg-[#11121d] text-[#f1f5f9]">Member</option>
              </select>
            </div>
            <p className="text-[10px] text-[#64748b] font-mono leading-relaxed">
              Managers create and verify commitments, Members execute commitments
            </p>
          </div>
        )}
      </div>

      {error && (
        <div className="p-3.5 bg-red-500/5 border border-red-500/20 rounded-xl text-red-400 text-xs font-medium leading-relaxed flex items-start space-x-2">
          <Warning size={14} className="flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="w-full flex items-center justify-center space-x-2 bg-blue-500 hover:bg-blue-600 text-white active:scale-[0.98] transition-all duration-200 font-bold uppercase tracking-wider rounded-xl py-3 text-xs border-none shadow-lg shadow-blue-500/10 disabled:bg-[#24263b] disabled:text-[#64748b]"
      >
        {isPending && <CircleNotch size={14} className="animate-spin" />}
        <span>
          {type === 'signin' ? 'Sign In' : 'Create Account'}
        </span>
      </button>

      <div className="text-center text-xs font-semibold uppercase tracking-wider text-[#64748b]">
        {type === 'signin' ? (
          <>
            Don&apos;t have an account?{' '}
            <button
              type="button"
              onClick={() => setActiveTab?.('register')}
              className="text-blue-400 hover:text-blue-300 font-bold bg-transparent border-0 p-0 active:scale-95 transition-transform"
            >
              Create one
            </button>
          </>
        ) : (
          <>
            Already have an account?{' '}
            <button
              type="button"
              onClick={() => setActiveTab?.('signin')}
              className="text-blue-400 hover:text-blue-300 font-bold bg-transparent border-0 p-0 active:scale-95 transition-transform"
            >
              Sign in
            </button>
          </>
        )}
      </div>
    </form>
  );
}
