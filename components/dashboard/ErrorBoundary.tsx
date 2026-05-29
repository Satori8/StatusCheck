'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Warning } from '@phosphor-icons/react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Dashboard Error Boundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex flex-col items-center justify-center h-full py-16 space-y-5" role="alert">
          <div className="w-16 h-16 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center justify-center text-red-400 shadow-inner">
            <Warning size={28} weight="bold" />
          </div>
          <h3 className="text-xs font-bold text-white uppercase tracking-widest">Something went wrong</h3>
          <p className="text-sm text-[#64748b] text-center max-w-sm leading-relaxed">
            We encountered an unexpected error loading the dashboard container. Please try refreshing the workspace.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-5 py-2.5 bg-[#24263b] hover:bg-[#313552] text-[#f1f5f9] border border-[#24263b] rounded-xl text-xs font-bold uppercase tracking-wider transition-all active:scale-95 duration-200"
          >
            Refresh Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
