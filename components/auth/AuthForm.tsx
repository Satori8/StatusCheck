'use client';

import { useState, useTransition } from 'react';
import { login, register } from '@/app/actions/auth';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function AuthForm({ type }: { type: 'signin' | 'register' }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (formData: FormData) => {
    setError(null);
    startTransition(async () => {
      try {
        const result = type === 'signin'
          ? await login(formData)
          : await register(formData);

        if (result?.error) {
          setError(result.error);
        }
      } catch {
        setError('An unexpected error occurred');
      }
    });
  };

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

      <div className="text-center text-sm text-gray-500">
        {type === 'signin' ? (
          <>Don't have an account? <button
            type="button"
            onClick={() => router.push('?register=true')}
            className="text-white hover:underline"
          >Create one</button></>
        ) : (
          <>Already have an account? <button
            type="button"
            onClick={() => router.push('?signin=true')}
            className="text-white hover:underline"
          >Sign in</button></>
        )}
      </div>
    </form>
  );
}