import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ size = 'md', className = '' }) => {
  const sizeClasses = {
    sm: 'h-6 w-6 border-2',
    md: 'h-8 w-8 border-2',
    lg: 'h-12 w-12 border-3',
  };

  return (
    <div className={`flex justify-center items-center ${className}`}>
      <div
        className={`animate-spin rounded-full border-slate-300 border-t-slate-700 ${sizeClasses[size]}`}
        role="status"
        aria-live="polite"
      >
        <span className="sr-only">Loading...</span>
      </div>
    </div>
  );
};