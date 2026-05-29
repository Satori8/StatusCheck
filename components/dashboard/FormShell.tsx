'use client';

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from '@phosphor-icons/react';

interface FormShellProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export const FormShell: React.FC<FormShellProps> = ({
  isOpen,
  onClose,
  title,
  children,
}) => {
  // Prevent background scrolling when slide-over is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop blur overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
            onClick={onClose}
            className="slide-over-backdrop"
          />

          {/* Right edge slide-over container */}
          <motion.div
            initial={{ x: '100%', opacity: 0.9 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0.9 }}
            transition={{ type: 'spring', damping: 26, stiffness: 180 }}
            className="slide-over-panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby="slide-over-title"
          >
            {/* Slide-over header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-[#24263b] bg-[#11121d] sticky top-0 z-10 backdrop-blur-md bg-opacity-95">
              <h2 id="slide-over-title" className="text-base font-bold tracking-tight text-[#f1f5f9] uppercase tracking-widest text-xs">
                {title}
              </h2>
              <button
                onClick={onClose}
                className="text-[#64748b] hover:text-[#f1f5f9] transition-colors p-1.5 hover:bg-[#161726] rounded-full border border-[#24263b] flex items-center justify-center bg-transparent active:scale-95 duration-200"
                aria-label="Close panel"
              >
                <X size={16} weight="bold" />
              </button>
            </div>

            {/* Slide-over body container */}
            <div className="flex-1 p-6 overflow-y-auto space-y-6 bg-[#0d0e15]/50">
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
