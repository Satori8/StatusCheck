'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useFilter } from '@/components/dashboard/FilterContext';
import { CommitmentCalendar } from '@/components/dashboard/CommitmentCalendar';
import { CommitmentList } from '@/components/dashboard/CommitmentList';
import { CommitmentForm } from '@/components/dashboard/CommitmentForm';
import { SearchInput } from '@/components/dashboard/SearchInput';
import { ErrorBoundary } from '@/components/dashboard/ErrorBoundary';
import { useRouter } from 'next/navigation';

interface Profile {
  id: string
  email: string
  role: 'manager' | 'member'
}

interface Commitment {
  id: string
  title: string
  description?: string | null
  author_id: string
  project: string
  assignee_id: string
  checker_id: string
  deadline: string
  status: 'to_check' | 'done' | 'expired' | 'not_actual' | 'ideas_backlog'
  created_at: string
  author?: Profile
  assignee?: Profile
  checker?: Profile
}

interface DashboardPageClientProps {
  commitments: Commitment[]
  profiles: Profile[]
  currentUserProfile: {
    email: string
    role: 'manager' | 'member'
    id: string
  }
}

export const DashboardPageClient: React.FC<DashboardPageClientProps> = ({
  commitments,
  profiles,
  currentUserProfile
}) => {
  const router = useRouter();
  const { selectedProject, selectedCheckerId, searchQuery } = useFilter();
  const [activeView, setActiveView] = useState<'calendar' | 'list'>('calendar');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCommitment, setEditingCommitment] = useState<Commitment | null>(null);

  // Filter commitments based on current filter state
  const filteredCommitments = useMemo(() => {
    let result = [...commitments];

    // Apply project filter
    if (selectedProject) {
      result = result.filter(c => c.project === selectedProject);
    }

    // Apply checker filter
    if (selectedCheckerId) {
      result = result.filter(c => 
        c.checker_id === selectedCheckerId || 
        c.assignee_id === selectedCheckerId
      );
    }

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(commitment => 
        commitment.title.toLowerCase().includes(query) ||
        commitment.description?.toLowerCase().includes(query) ||
        commitment.project.toLowerCase().includes(query) ||
        commitment.assignee?.email?.toLowerCase().includes(query) ||
        commitment.checker?.email?.toLowerCase().includes(query)
      );
    }

    return result;
  }, [commitments, selectedProject, selectedCheckerId, searchQuery]);

  // Calculate stats for the header
  const stats = useMemo(() => {
    const total = filteredCommitments.length;
    const pendingReview = filteredCommitments.filter(c => c.status === 'to_check').length;
    const verifiedDone = filteredCommitments.filter(c => c.status === 'done').length;
    const expired = filteredCommitments.filter(c => c.status === 'expired').length;

    return {
      total,
      pendingReview,
      verifiedDone,
      expired
    };
  }, [filteredCommitments]);

  const handleEditCommitment = (commitment: Commitment) => {
    setEditingCommitment(commitment);
    setIsFormOpen(true);
  };

  const handleFormSuccess = () => {
    // Refresh the page to get updated data
    router.refresh();
    setIsFormOpen(false);
    setEditingCommitment(null);
  };

  // Prepare checkers data for the form
  const checkers = useMemo(() => {
    return profiles.map(profile => ({
      id: profile.id,
      email: profile.email
    }));
  }, [profiles]);

  return (
    <ErrorBoundary>
      <div className="space-y-6">
        {/* Stats Header */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Commitments */}
          <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
            <div className="text-sm font-medium text-slate-500 mb-1">Total Commitments</div>
            <div className="text-3xl font-mono font-bold text-slate-800">{stats.total}</div>
          </div>

          {/* Pending Review */}
          <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
            <div className="text-sm font-medium text-slate-500 mb-1">Pending Review</div>
            <div className="text-3xl font-mono font-bold text-amber-600">{stats.pendingReview}</div>
          </div>

          {/* Verified Done */}
          <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
            <div className="text-sm font-medium text-slate-500 mb-1">Verified Done</div>
            <div className="text-3xl font-mono font-bold text-emerald-600">{stats.verifiedDone}</div>
          </div>

          {/* Expired */}
          <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
            <div className="text-sm font-medium text-slate-500 mb-1">Expired</div>
            <div className="text-3xl font-mono font-bold text-red-600">{stats.expired}</div>
          </div>
        </div>

        {/* Main Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Commitments Overview</h1>
            <p className="text-sm text-slate-500">Manage and track your team&apos;s commitments</p>
          </div>

          <div className="flex items-center space-x-3">
            {/* View Switcher */}
            <div className="flex bg-slate-100 rounded-lg p-1">
              <button
                onClick={() => setActiveView('calendar')}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  activeView === 'calendar' 
                    ? 'bg-white text-slate-800 shadow-sm' 
                    : 'text-slate-600 hover:text-slate-800'
                }`}
              >
                Calendar
              </button>
              <button
                onClick={() => setActiveView('list')}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  activeView === 'list'
                    ? 'bg-white text-slate-800 shadow-sm'
                    : 'text-slate-600 hover:text-slate-800'
                }`}
              >
                List
              </button>
            </div>

            {/* Add Commitment Button - only visible to managers */}
            {currentUserProfile.role === 'manager' && (
              <button
                onClick={() => {
                  setEditingCommitment(null);
                  setIsFormOpen(true);
                }}
                className="px-4 py-2 bg-slate-700 text-white rounded-md hover:bg-slate-800 transition-colors"
              >
                + Add Commitment
              </button>
            )}
          </div>
        </div>

        {/* Search Input */}
        <div className="flex items-center justify-between">
          <SearchInput placeholder="Search commitments..." className="w-full max-w-md" />
        </div>

        {/* Content Body */}
        <div className="space-y-8">
          {filteredCommitments.length === 0 ? (
            <div className="bg-white rounded-xl p-12 border border-slate-200 text-center">
              <div className="mb-6">
                <svg className="w-16 h-16 mx-auto text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-slate-800 mb-2">No commitments found</h2>
              <p className="text-slate-500 mb-4">
                {selectedProject || selectedCheckerId || searchQuery 
                  ? 'Your current filters don\'t match any commitments.'
                  : 'There are no commitments to display.'}
              </p>
              {currentUserProfile.role === 'manager' && (
                <button
                  onClick={() => setIsFormOpen(true)}
                  className="px-4 py-2 bg-slate-700 text-white rounded-md hover:bg-slate-800 transition-colors"
                >
                  Create First Commitment
                </button>
              )}
            </div>
          ) : (
            <AnimatePresence mode="wait">
              {activeView === 'calendar' ? (
                <motion.div
                  key="calendar"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="bg-white rounded-xl p-6 border border-slate-200">
                    <h2 className="text-xl font-semibold text-slate-800 mb-4">Calendar Overview</h2>
                    <CommitmentCalendar
                      commitments={filteredCommitments}
                      onEditCommitment={handleEditCommitment}
                      currentUserProfile={currentUserProfile}
                    />
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="list"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="bg-white rounded-xl p-6 border border-slate-200">
                    <h2 className="text-xl font-semibold text-slate-800 mb-4">Detailed Commitments</h2>
                    <CommitmentList
                      commitments={filteredCommitments}
                      onEditCommitment={handleEditCommitment}
                      currentUserProfile={currentUserProfile}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          )}
        </div>
      </div>

      {/* Commitment Form */}
      <CommitmentForm
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingCommitment(null);
        }}
        onSubmitSuccess={handleFormSuccess}
        currentUserProfile={currentUserProfile}
        checkers={checkers}
        editingCommitment={editingCommitment}
      />
    </ErrorBoundary>
  );
};