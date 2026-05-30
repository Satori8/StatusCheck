'use client';

import { useState } from 'react';
import AuthForm from './AuthForm';
import { motion, AnimatePresence } from 'framer-motion';
import { LogIn, UserPlus } from 'lucide-react';

export default function AuthPortal() {
  const [activeTab, setActiveTab] = useState<'signin' | 'register'>('signin');

  return (
    <div className="w-full max-w-[450px] space-y-6">
      {/* Premium Segmented Control / Sliding Pill Switcher */}
      <div className="bg-zinc-950/40 border border-white/10 backdrop-blur-xl p-1.5 rounded-full flex relative w-full shadow-inner">
        {/* Sign In Tab */}
        <button
          onClick={() => setActiveTab('signin')}
          className={`flex-1 flex items-center justify-center space-x-2 py-3 text-sm font-medium rounded-full relative z-10 transition-colors duration-200 bg-transparent border-none ${
            activeTab === 'signin' ? 'text-white' : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          <LogIn className="w-4 h-4" />
          <span>Sign In</span>
          {activeTab === 'signin' && (
            <motion.div
              layoutId="active-pill"
              className="absolute inset-0 bg-white/10 border border-white/10 shadow-[0_4px_12px_rgba(0,0,0,0.2)] rounded-full -z-10"
              transition={{ type: 'spring', stiffness: 380, damping: 30 }}
            />
          )}
        </button>

        {/* Create Account Tab */}
        <button
          onClick={() => setActiveTab('register')}
          className={`flex-1 flex items-center justify-center space-x-2 py-3 text-sm font-medium rounded-full relative z-10 transition-colors duration-200 bg-transparent border-none ${
            activeTab === 'register' ? 'text-white' : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          <UserPlus className="w-4 h-4" />
          <span>Create Account</span>
          {activeTab === 'register' && (
            <motion.div
              layoutId="active-pill"
              className="absolute inset-0 bg-white/10 border border-white/10 shadow-[0_4px_12px_rgba(0,0,0,0.2)] rounded-full -z-10"
              transition={{ type: 'spring', stiffness: 380, damping: 30 }}
            />
          )}
        </button>
      </div>

      {/* Auth Form with AnimatePresence */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 12, filter: 'blur(4px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          exit={{ opacity: 0, y: -12, filter: 'blur(4px)' }}
          transition={{ duration: 0.2, ease: 'easeInOut' }}
        >
          <AuthForm type={activeTab} setActiveTab={setActiveTab} />
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
