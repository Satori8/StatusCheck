'use client';

import { useState } from 'react';
import AuthForm from './AuthForm';
import { motion, AnimatePresence } from 'framer-motion';

export default function AuthPortal() {
  const [activeTab, setActiveTab] = useState<'signin' | 'register'>('signin');

  return (
    <div className="w-full max-w-md">
      <div className="glass-panel mb-6">
        <div className="flex space-x-6 border-b border-white/10">
          <button
            className={`pb-2 px-2 font-medium transition-colors ${
              activeTab === 'signin'
                ? 'text-white border-b border-white/30'
                : 'text-gray-400 hover:text-white'
            }`}
            onClick={() => setActiveTab('signin')}
          >
            Sign In
          </button>
          <button
            className={`pb-2 px-2 font-medium transition-colors ${
              activeTab === 'register'
                ? 'text-white border-b border-white/30'
                : 'text-gray-400 hover:text-white'
            }`}
            onClick={() => setActiveTab('register')}
          >
            Create Account
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          <AuthForm type={activeTab} setActiveTab={setActiveTab} />
        </motion.div>
      </AnimatePresence>
    </div>
  );
}