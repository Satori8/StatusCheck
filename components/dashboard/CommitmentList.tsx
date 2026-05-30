'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Check, 
  Trash, 
  PencilSimple, 
  CalendarBlank, 
  CaretUp, 
  CaretDown, 
  Briefcase
} from '@phosphor-icons/react';
import { deleteCommitment } from '@/app/actions/commitments';
import { useRouter } from 'next/navigation';
import { StatusBadge } from './StatusBadge';

interface Commitment {
  id: string;
  title: string;
  description?: string | null | undefined;
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

interface Profile {
  id: string;
  email: string;
  role: 'manager' | 'member';
  name?: string | null;
}

interface CommitmentListProps {
  commitments: Commitment[];
  onEditCommitment: (commitment: Commitment) => void;
  currentUserProfile: {
    email: string;
    role: 'manager' | 'member';
  };
}

export const CommitmentList: React.FC<CommitmentListProps> = ({
  commitments,
  onEditCommitment,
  currentUserProfile
}) => {
  const router = useRouter();
  const [expandedCommitmentId, setExpandedCommitmentId] = useState<string | null>(null);

  const filteredCommitments = commitments;

  // Check if user can edit this commitment
  const canEditCommitment = (commitment: Commitment) => {
    return currentUserProfile.role === 'manager' || 
           commitment.assignee?.email === currentUserProfile.email ||
           commitment.checker?.email === currentUserProfile.email;
  };

  // Handle commitment deletion (managers only)
  const handleDeleteCommitment = async (id: string) => {
    if (confirm('Are you sure you want to delete this commitment?')) {
      const result = await deleteCommitment(id);
      if (result.error) {
        alert(result.error);
      } else {
        router.refresh();
      }
    }
  };

  // Handle mark as done
  const handleMarkAsDone = (commitment: Commitment) => {
    onEditCommitment({ ...commitment, status: 'done' });
  };

  return (
    <div className="space-y-4">
      {/* List Header Desktop — Optimized for responsive shrinking, 50px bigger deadline */}
      <div className="hidden md:grid grid-cols-[3.2fr_1.2fr_1.2fr_2.1fr_1.1fr_1.2fr] gap-4 px-5 py-3 text-[10px] font-bold text-[#64748b] border-b border-[#24263b] uppercase tracking-widest">
        <div className="flex items-center min-w-0">Title & Details</div>
        <div className="flex items-center min-w-0">Project</div>
        <div className="flex items-center min-w-0">Assignee</div>
        <div className="flex items-center min-w-0">Deadline</div>
        <div className="flex items-center min-w-0">Status</div>
        <div className="flex items-center justify-end min-w-0">Actions</div>
      </div>

      {/* Commitments List */}
      <div className="space-y-3.5">
        {filteredCommitments.length === 0 ? (
          <div className="text-center py-12 bg-[#11121d] rounded-2xl border border-[#24263b]">
            <p className="text-[#64748b] text-sm">No commitments found in this view.</p>
          </div>
        ) : (
          <AnimatePresence>
            {filteredCommitments.map((commitment) => {
              const isExpanded = expandedCommitmentId === commitment.id;

              return (
                <motion.div
                  key={commitment.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
                  className="bg-[#11121d] border border-[#24263b] rounded-2xl hover:border-blue-500/25 hover:bg-[#161726]/30 transition-all duration-300 cursor-pointer overflow-hidden shadow-lg hover:shadow-black/30"
                  onClick={() => onEditCommitment(commitment)}
                >
                  {/* Mobile Header */}
                  <div className="md:hidden px-4 py-3 border-b border-[#24263b] bg-[#0d0e15]/20 flex items-center justify-between">
                    <h3 className="font-bold text-[#f1f5f9] text-sm truncate flex-1 mr-2">
                      {commitment.title}
                    </h3>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setExpandedCommitmentId(isExpanded ? null : commitment.id);
                      }}
                      className="text-[#64748b] hover:text-[#f1f5f9] transition-colors p-1"
                    >
                      {isExpanded ? <CaretUp size={16} weight="bold" /> : <CaretDown size={16} weight="bold" />}
                    </button>
                  </div>

                  {/* Desktop/Expanded Content Grid — Fully responsive column priorities */}
                  <div className={`px-5 py-4 ${isExpanded ? 'block' : 'hidden md:grid'} md:grid-cols-[3.2fr_1.2fr_1.2fr_2.1fr_1.1fr_1.2fr] md:gap-4 md:items-center`}>
                    {/* Title and Description (Detail shrinks first) */}
                    <div className="mb-4 md:mb-0 pr-4 min-w-0 flex-1">
                      <h3 className="font-bold text-[#f1f5f9] text-sm leading-snug hover:text-blue-400 transition-colors truncate">
                        {commitment.title}
                      </h3>
                      {commitment.description && (
                        <p className="text-xs text-[#64748b] mt-1.5 leading-relaxed break-words whitespace-pre-wrap line-clamp-1 max-w-[55ch]">
                          {commitment.description}
                        </p>
                      )}
                    </div>

                    {/* Project */}
                    <div className="flex items-center space-x-2 mb-3 md:mb-0 min-w-0">
                      <Briefcase size={14} className="text-blue-500 flex-shrink-0" />
                      <span className="text-xs font-semibold text-[#f1f5f9] truncate">
                        {commitment.project}
                      </span>
                    </div>

                    {/* Assignee */}
                    <div className="flex items-center space-x-2 mb-3 md:mb-0 min-w-0">
                      <div className="w-5 h-5 rounded-md bg-[#161726] border border-[#24263b] flex items-center justify-center text-[10px] font-mono font-bold text-[#f1f5f9] flex-shrink-0">
                        {commitment.assignee?.name ? commitment.assignee.name.slice(0,2).toUpperCase() : commitment.assignee?.email.slice(0,2).toUpperCase()}
                      </div>
                      <span className="text-xs text-[#f1f5f9] truncate">
                        {commitment.assignee?.name || commitment.assignee?.email || 'Unassigned'}
                      </span>
                    </div>

                    {/* Deadline (50px Wider & never overlaps/word-wraps) */}
                    <div className="flex flex-col justify-center space-y-1 mb-4 md:mb-0 min-w-0 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <CalendarBlank size={14} className="text-[#64748b] flex-shrink-0" />
                        <span className="text-xs font-semibold text-[#f1f5f9] font-mono truncate">
                          {commitment.deadline ? (
                            new Date(commitment.deadline).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })
                          ) : (
                            <span className="text-[#64748b] italic">No deadline</span>
                          )}
                        </span>
                      </div>
                      <div className="text-[10px] text-[#64748b] pl-5 leading-none font-mono">
                        Created:{' '}
                        {new Date(commitment.created_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric'
                        })}
                      </div>
                    </div>

                    {/* Status badge (adapts without wrapping) */}
                    <div className="mb-4 md:mb-0 flex items-center min-w-0 whitespace-nowrap">
                      <StatusBadge status={commitment.status} showIcon={false} />
                    </div>

                    {/* Action Buttons (never clips/wraps) */}
                    <div className="flex items-center justify-between md:justify-end gap-3 min-w-0 whitespace-nowrap flex-shrink-0">
                      {canEditCommitment(commitment) && (
                        <div className="flex items-center space-x-1.5 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMarkAsDone(commitment);
                            }}
                            disabled={commitment.status === 'done'}
                            className={`p-1.5 rounded-lg border transition-all ${
                              commitment.status === 'done' 
                                ? 'text-[#64748b] bg-[#161726]/40 border-[#24263b] cursor-not-allowed' 
                                : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500 hover:text-white'
                            }`}
                            title="Mark as Done"
                          >
                            <Check size={14} weight="bold" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onEditCommitment(commitment);
                            }}
                            className="p-1.5 bg-[#161726] text-[#64748b] hover:text-[#f1f5f9] border border-[#24263b] hover:border-blue-500/40 rounded-lg transition-all"
                            title="Edit"
                          >
                            <PencilSimple size={14} weight="bold" />
                          </button>
                          {currentUserProfile.role === 'manager' && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteCommitment(commitment.id);
                              }}
                              className="p-1.5 bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500 hover:text-white rounded-lg transition-all"
                              title="Delete"
                            >
                              <Trash size={14} weight="bold" />
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
};
