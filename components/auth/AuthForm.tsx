'use client';

import { useState, useTransition } from 'react';
import { login, register } from '@/app/actions/auth';
import { CircleNotch, CheckCircle, Warning, CaretDown, Check } from '@phosphor-icons/react';

interface AuthFormProps {
  type: 'signin' | 'register';
  setActiveTab?: (tab: 'signin' | 'register') => void;
}

export default function AuthForm({ type, setActiveTab }: AuthFormProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [isRegistered, setIsRegistered] = useState(false);

  // Custom role dropdown state
  const [selectedRole, setSelectedRole] = useState<'manager' | 'member' | ''>('');
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);

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
      <div className="glass-panel space-y-6 text-center py-8 fade-in w-full max-w-[450px]">
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
          className="w-full flex items-center justify-center space-x-2 bg-[#24263b] hover:bg-[#313552] border border-[#24263b] text-white active:scale-[0.98] transition-all duration-200 font-bold uppercase tracking-wider rounded-xl py-3.5 text-xs whitespace-nowrap"
        >
          <span>Continue to Sign In</span>
        </button>
      </div>
    );
  }

  return (
    <form action={handleSubmit} className="glass-panel space-y-6 bg-[#11121d] border border-[#24263b] shadow-2xl p-7 rounded-2xl w-full max-w-[450px] mx-auto">
      <div className="space-y-4.5">
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
            
            {/* Custom Role Dropdown matching forms & calendar widgets */}
            <div className="relative">
              <input type="hidden" name="role" value={selectedRole} required />
              
              <div
                role="button"
                tabIndex={0}
                onClick={() => setIsRoleDropdownOpen(!isRoleDropdownOpen)}
                className={`w-full flex items-center justify-between px-3 py-2.5 border rounded-xl bg-[#161726] text-[#f1f5f9] focus:outline-none focus:ring-2 focus:ring-blue-500/40 text-left text-sm select-none transition-all ${
                  isRoleDropdownOpen ? 'border-blue-500/40' : 'border-[#24263b]'
                }`}
              >
                <span className="truncate">
                  {selectedRole === 'manager' ? 'Manager' : selectedRole === 'member' ? 'Member' : 'Select your team role'}
                </span>
                <CaretDown size={14} weight="bold" className={`text-[#64748b] transition-transform duration-300 ${isRoleDropdownOpen ? 'rotate-180' : ''}`} />
              </div>

              {isRoleDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsRoleDropdownOpen(false)} />
                  <ul className="absolute z-50 w-full mt-1.5 bg-[#11121d] border border-[#24263b] rounded-xl shadow-2xl py-1.5 text-sm">
                    <li className="px-1">
                      <div
                        role="button"
                        onClick={() => {
                          setSelectedRole('manager');
                          setIsRoleDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 transition-colors rounded-lg cursor-pointer select-none text-xs font-semibold flex items-center justify-between ${
                          selectedRole === 'manager'
                            ? 'bg-[#143c90] text-white font-bold'
                            : 'text-[#64748b] hover:text-[#f1f5f9] hover:bg-[#161726]'
                        }`}
                      >
                        <span>Manager</span>
                        {selectedRole === 'manager' && <Check size={12} weight="bold" />}
                      </div>
                    </li>
                    <li className="px-1">
                      <div
                        role="button"
                        onClick={() => {
                          setSelectedRole('member');
                          setIsRoleDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 transition-colors rounded-lg cursor-pointer select-none text-xs font-semibold flex items-center justify-between ${
                          selectedRole === 'member'
                            ? 'bg-[#143c90] text-white font-bold'
                            : 'text-[#64748b] hover:text-[#f1f5f9] hover:bg-[#161726]'
                        }`}
                      >
                        <span>Member</span>
                        {selectedRole === 'member' && <Check size={12} weight="bold" />}
                      </div>
                    </li>
                  </ul>
                </>
              )}
            </div>
            
            <p className="text-[10px] text-[#64748b] font-mono leading-relaxed mt-1">
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

      {/* Enlarged Button to fit long text and custom fonts perfectly without wrapping */}
      <button
        type="submit"
        disabled={isPending}
        className="w-full flex items-center justify-center space-x-2 bg-[#143c90] hover:bg-[#1e4fb8] text-white active:scale-[0.98] transition-all duration-200 font-bold uppercase tracking-widest rounded-xl py-3.5 text-xs border-none shadow-lg shadow-blue-500/10 disabled:bg-[#24263b] disabled:text-[#64748b] whitespace-nowrap px-6"
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
