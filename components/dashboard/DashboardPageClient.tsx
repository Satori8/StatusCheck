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
import { 
  Calendar, 
  ListBullets, 
  Plus, 
  Clock, 
  CheckCircle, 
  Warning, 
  Lightbulb, 
  ClipboardText
} from '@phosphor-icons/react';

interface Profile {
  id: string;
  email: string;
  role: 'manager' | 'member';
  name?: string | null;
}

interface Commitment {
  id: string;
  title: string;
  description?: string | null;
  author_id: string;
  project: string;
  assignee_id: string;
  checker_id: string;
  deadline: string;
  status: 'to_check' | 'done' | 'expired' | 'not_actual' | 'ideas_backlog';
  created_at: string;
  author?: Profile;
  assignee?: Profile;
  checker?: Profile;
}

interface DashboardPageClientProps {
  commitments: Commitment[];
  profiles: Profile[];
  projects: { name: string; description?: string | null }[];
  currentUserProfile: {
    email: string;
    role: 'manager' | 'member';
    id: string;
    name?: string | null;
  };
}

export const DashboardPageClient: React.FC<DashboardPageClientProps> = ({
  commitments,
  profiles,
  projects,
  currentUserProfile
}) => {
  const router = useRouter();
  const { selectedProject, selectedCheckerId, searchQuery } = useFilter();
  const [activeView, setActiveView] = useState<'calendar' | 'list' | 'backlog'>('calendar');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCommitment, setEditingCommitment] = useState<Commitment | null>(null);

  // Filter commitments based on current filter state
  const filteredCommitments = useMemo(() => {
    let result = [...commitments];

    // Isolate Backlog versus scheduled commitments
    if (activeView === 'calendar') {
      result = result.filter(c => c.status !== 'ideas_backlog');
    } else if (activeView === 'backlog') {
      result = result.filter(c => c.status === 'ideas_backlog');
    } else {
      result = result.filter(c => c.status !== 'ideas_backlog');
    }

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
        commitment.assignee?.name?.toLowerCase().includes(query) ||
        commitment.assignee?.email?.toLowerCase().includes(query) ||
        commitment.checker?.name?.toLowerCase().includes(query) ||
        commitment.checker?.email?.toLowerCase().includes(query)
      );
    }

    return result;
  }, [commitments, selectedProject, selectedCheckerId, searchQuery, activeView]);

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
      email: profile.email,
      name: profile.name
    }));
  }, [profiles]);

  return (
    <ErrorBoundary>
      <div className="space-y-8">
        {/* Stats Header */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Commitments */}
          <div className="bg-[#11121d] border border-[#24263b] rounded-2xl p-5 relative overflow-hidden group hover:border-blue-500/20 transition-all duration-300">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-bold text-[#64748b] tracking-widest uppercase">Total Commitments</span>
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                <ClipboardText size={16} weight="bold" />
              </div>
            </div>
            <div className="text-3xl font-mono font-bold text-[#f1f5f9] tracking-tight">{stats.total}</div>
          </div>

          {/* Pending Review */}
          <div className="bg-[#11121d] border border-[#24263b] rounded-2xl p-5 relative overflow-hidden group hover:border-amber-500/20 transition-all duration-300">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-bold text-[#64748b] tracking-widest uppercase">Pending Review</span>
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                <Clock size={16} weight="bold" />
              </div>
            </div>
            <div className="text-3xl font-mono font-bold text-amber-400 tracking-tight">{stats.pendingReview}</div>
          </div>

          {/* Verified Done */}
          <div className="bg-[#11121d] border border-[#24263b] rounded-2xl p-5 relative overflow-hidden group hover:border-emerald-500/20 transition-all duration-300">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-bold text-[#64748b] tracking-widest uppercase">Verified Done</span>
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <CheckCircle size={16} weight="bold" />
              </div>
            </div>
            <div className="text-3xl font-mono font-bold text-emerald-400 tracking-tight">{stats.verifiedDone}</div>
          </div>

          {/* Expired */}
          <div className="bg-[#11121d] border border-[#24263b] rounded-2xl p-5 relative overflow-hidden group hover:border-red-500/20 transition-all duration-300">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-bold text-[#64748b] tracking-widest uppercase">Expired</span>
              <div className="w-8 h-8 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
                <Warning size={16} weight="bold" />
              </div>
            </div>
            <div className="text-3xl font-mono font-bold text-red-400 tracking-tight">{stats.expired}</div>
          </div>
        </div>

        {/* Main Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 pb-6 border-b border-[#24263b]/60">
          <div>
            <h1 className="text-xl font-bold text-[#f1f5f9] tracking-wide uppercase text-xs tracking-widest text-blue-400 mb-1">Commitments Overview</h1>
            <h2 className="text-2xl font-extrabold text-white tracking-tight">Manage & track team commitments</h2>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            {/* View Switcher Sliding Pill */}
            <div className="bg-[#11121d] border border-[#24263b] rounded-full p-1 flex relative shadow-inner">
              <button
                onClick={() => setActiveView('calendar')}
                className={`flex items-center space-x-1.5 px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-full relative z-10 transition-colors duration-200 bg-transparent border-none ${
                  activeView === 'calendar' ? 'text-white' : 'text-[#64748b] hover:text-[#f1f5f9]'
                }`}
              >
                <Calendar size={14} weight="bold" />
                <span>Calendar</span>
                {activeView === 'calendar' && (
                  <motion.div
                    layoutId="active-view-pill"
                    className="absolute inset-0 bg-[#24263b] border border-blue-500/10 rounded-full -z-10"
                    transition={{ type: 'spring', stiffness: 350, damping: 25 }}
                  />
                )}
              </button>
              <button
                onClick={() => setActiveView('list')}
                className={`flex items-center space-x-1.5 px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-full relative z-10 transition-colors duration-200 bg-transparent border-none ${
                  activeView === 'list' ? 'text-white' : 'text-[#64748b] hover:text-[#f1f5f9]'
                }`}
              >
                <ListBullets size={14} weight="bold" />
                <span>List</span>
                {activeView === 'list' && (
                  <motion.div
                    layoutId="active-view-pill"
                    className="absolute inset-0 bg-[#24263b] border border-blue-500/10 rounded-full -z-10"
                    transition={{ type: 'spring', stiffness: 350, damping: 25 }}
                  />
                )}
              </button>
              <button
                onClick={() => setActiveView('backlog')}
                className={`flex items-center space-x-1.5 px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-full relative z-10 transition-colors duration-200 bg-transparent border-none ${
                  activeView === 'backlog' ? 'text-white' : 'text-[#64748b] hover:text-[#f1f5f9]'
                }`}
              >
                <Lightbulb size={14} weight="bold" />
                <span>Backlog</span>
                {activeView === 'backlog' && (
                  <motion.div
                    layoutId="active-view-pill"
                    className="absolute inset-0 bg-[#24263b] border border-blue-500/10 rounded-full -z-10"
                    transition={{ type: 'spring', stiffness: 350, damping: 25 }}
                  />
                )}
              </button>
            </div>

            {/* Add Commitment Button */}
            <button
              onClick={() => {
                setEditingCommitment(null);
                setIsFormOpen(true);
              }}
              className="flex items-center space-x-2 px-5 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-full transition-all active:scale-[0.98] duration-200 text-xs font-bold uppercase tracking-wider shadow-lg shadow-blue-500/10 border-none"
            >
              <Plus size={14} weight="bold" />
              <span>Add Commitment</span>
            </button>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <SearchInput placeholder="Search commitments..." className="w-full max-w-md" />
        </div>

        {/* Main Content Area */}
        <div className="space-y-6">
          {filteredCommitments.length === 0 ? (
            <div className="bg-[#11121d] border border-[#24263b] rounded-2xl p-16 text-center max-w-xl mx-auto shadow-2xl">
              <div className="mb-6 flex justify-center">
                <div className="w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shadow-inner">
                  <ClipboardText size={28} weight="bold" />
                </div>
              </div>
              <h2 className="text-base font-bold text-[#f1f5f9] uppercase tracking-widest mb-2">No commitments found</h2>
              <p className="text-[#64748b] text-sm mb-6 max-w-xs mx-auto leading-relaxed">
                {selectedProject || selectedCheckerId || searchQuery 
                  ? 'Your active filter settings don\'t match any commitments in this view.'
                  : 'There are no active commitments configured for this project yet.'}
              </p>
              <button
                onClick={() => setIsFormOpen(true)}
                className="px-5 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-full transition-all active:scale-[0.98] duration-200 text-xs font-bold uppercase tracking-wider shadow-lg shadow-blue-500/10 border-none"
              >
                Create First Commitment
              </button>
            </div>
          ) : (
            <AnimatePresence mode="wait">
              {activeView === 'calendar' ? (
                <motion.div
                  key="calendar"
                  initial={{ opacity: 0, y: 12, filter: 'blur(4px)' }}
                  animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                  exit={{ opacity: 0, y: -12, filter: 'blur(4px)' }}
                  transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
                >
                  <div className="bg-[#11121d] border border-[#24263b] rounded-2xl p-6 shadow-2xl">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-xs font-bold text-[#64748b] tracking-widest uppercase flex items-center">
                        <Calendar size={14} className="mr-2 text-blue-400" />
                        Calendar Overview
                      </h2>
                    </div>
                    <CommitmentCalendar
                      commitments={filteredCommitments}
                      onEditCommitment={handleEditCommitment}
                      currentUserProfile={currentUserProfile}
                    />
                  </div>
                </motion.div>
              ) : activeView === 'list' ? (
                <motion.div
                  key="list"
                  initial={{ opacity: 0, y: 12, filter: 'blur(4px)' }}
                  animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                  exit={{ opacity: 0, y: -12, filter: 'blur(4px)' }}
                  transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
                >
                  <div className="bg-[#11121d] border border-[#24263b] rounded-2xl p-6 shadow-2xl">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-xs font-bold text-[#64748b] tracking-widest uppercase flex items-center">
                        <ListBullets size={14} className="mr-2 text-blue-400" />
                        Detailed Commitments
                      </h2>
                    </div>
                    <CommitmentList
                      commitments={filteredCommitments}
                      onEditCommitment={handleEditCommitment}
                      currentUserProfile={currentUserProfile}
                    />
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="backlog"
                  initial={{ opacity: 0, y: 12, filter: 'blur(4px)' }}
                  animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                  exit={{ opacity: 0, y: -12, filter: 'blur(4px)' }}
                  transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
                >
                  <div className="bg-[#11121d] border border-[#24263b] rounded-2xl p-6 shadow-2xl">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-xs font-bold text-[#64748b] tracking-widest uppercase flex items-center">
                        <Lightbulb size={14} className="mr-2 text-blue-400" />
                        Ideas Backlog
                      </h2>
                    </div>
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

        {/* Commitment Drawer Modal */}
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
          projects={projects}
        />
      </div>
    </ErrorBoundary>
  );
};
