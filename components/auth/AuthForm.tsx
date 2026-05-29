'use client';

import { useState, useTransition } from 'react';
import { login, register } from '@/app/actions/auth';
import { Loader2, CheckCircle } from 'lucide-react';

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
          setError(result.error);
        } else if (type === 'register' && result && 'success' in result) {
          setIsRegistered(true);
        }
      } catch {
        setError('An unexpected error occurred');
      }
    });
  };

  if (isRegistered) {
    return (
      <div className="glass-panel space-y-6 text-center py-8 fade-in">
        <div className="flex justify-center">
          <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <CheckCircle className="w-8 h-8" />
          </div>
        </div>
        
        <div className="space-y-2">
          <h2 className="text-2xl font-bold tracking-tight text-white">Registration Confirmed</h2>
          <p className="text-gray-400 text-sm max-w-xs mx-auto">
            Your account has been successfully created. Email confirmation check has been bypassed.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setIsRegistered(false);
            setActiveTab?.('signin');
          }}
          className="w-full flex items-center justify-center space-x-2 bg-slate-700 hover:bg-slate-600 active:scale-[0.98] transition-transform duration-100 ease-out font-medium rounded-md py-3 text-white"
        >
          <span>Continue to Sign In</span>
        </button>
      </div>
    );
  }

  return (
    <form action={handleSubmit} className="glass-panel space-y-6">
      <div className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1">
            Email Address
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            placeholder="your@company.com"
            className="w-full"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-1">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            minLength={8}
            placeholder="••••••••"
            className="w-full"
          />
          <p className="text-xs text-gray-500 mt-1">Minimum 8 characters</p>
        </div>

        {type === 'register' && (
          <div>
            <label htmlFor="role" className="block text-sm font-medium text-gray-300 mb-1">
              Role
            </label>
            <select
              id="role"
              name="role"
              required
              className="w-full"
              defaultValue=""
            >
              <option value="" disabled>Select your role</option>
              <option value="manager">Manager</option>
              <option value="member">Member</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Managers create commitments, Members track progress
            </p>
          </div>
        )}
      </div>

      {error && (
        <div className="p-3 bg-red-900/30 border border-red-500/20 rounded-md text-red-200 text-sm">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="w-full flex items-center justify-center space-x-2 active:scale-[0.98] transition-transform duration-100 ease-out"
      >
        {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
        <span>
          {type === 'signin' ? 'Sign In' : 'Create Account'}
        </span>
      </button>

      <div className="text-center text-sm text-gray-400">
        {type === 'signin' ? (
          <>Don't have an account? <button
            type="button"
            onClick={() => setActiveTab?.('register')}
            className="text-white hover:underline hover:text-gray-200 transition-colors bg-transparent border-0 p-0"
          >Create one</button></>
        ) : (
          <>Already have an account? <button
            type="button"
            onClick={() => setActiveTab?.('signin')}
            className="text-white hover:underline hover:text-gray-200 transition-colors bg-transparent border-0 p-0"
          >Sign in</button></>
        )}
      </div>
    </form>
  );
}