'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Clock, AlertTriangle, Trash2, FileText, ChevronDown, ChevronUp } from 'lucide-react';

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
}

interface CommitmentListProps {
  commitments: Commitment[];
  onEditCommitment: (commitment: Commitment) => void;
  currentUserProfile: {
    email: string;
    role: 'manager' | 'member';
  };
}

// Status color mapping
const statusColors = {
  to_check: {
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-200'
  },
  done: {
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200'
  },
  expired: {
    bg: 'bg-red-50',
    text: 'text-red-700',
    border: 'border-red-200'
  },
  not_actual: {
    bg: 'bg-slate-50',
    text: 'text-slate-700',
    border: 'border-slate-200'
  },
  ideas_backlog: {
    bg: 'bg-indigo-50',
    text: 'text-indigo-700',
    border: 'border-indigo-200'
  }
};

// Status icon mapping
const statusIcons = {
  to_check: Clock,
  done: Check,
  expired: AlertTriangle,
  not_actual: Trash2,
  ideas_backlog: FileText
};

// Status label mapping
const statusLabels = {
  to_check: 'Pending Review',
  done: 'Verified Done',
  expired: 'Expired',
  not_actual: 'Not Actual',
  ideas_backlog: 'Ideas Backlog'
};

export const CommitmentList: React.FC<CommitmentListProps> = ({
  commitments,
  onEditCommitment,
  currentUserProfile
}) => {
  const [expandedCommitmentId, setExpandedCommitmentId] = useState<string | null>(null);

  // Since commitments are already filtered in the parent DashboardPageClient,
  // we can use them directly.
  const filteredCommitments = commitments;

  // Toggle sort direction - currently unused but available for future implementation
  // const requestSort = (key: keyof Commitment) => {
  //   let direction: 'ascending' | 'descending' = 'ascending';
  //   if (sortConfig.key === key && sortConfig.direction === 'ascending') {
  //     direction = 'descending';
  //   }
  //   setSortConfig({ key, direction });
  // };

  // Check if user can edit this commitment
  const canEditCommitment = (commitment: Commitment) => {
    return currentUserProfile.role === 'manager' || 
           commitment.assignee?.email === currentUserProfile.email ||
           commitment.checker?.email === currentUserProfile.email;
  };

  // Handle mark as done
  const handleMarkAsDone = (commitment: Commitment) => {
    onEditCommitment({ ...commitment, status: 'done' });
  };

  return (
    <div className="space-y-6">

      {/* List Header */}
      <div className="hidden md:grid grid-cols-12 gap-4 px-2 py-2 text-sm font-medium text-slate-500 border-b border-slate-200">
        <div className="col-span-4 flex items-center">
          Title
        </div>
        <div className="col-span-2 flex items-center">
          Project
        </div>
        <div className="col-span-2 flex items-center">
          Assignee
        </div>
        <div className="col-span-2 flex items-center">
          Deadline
        </div>
        <div className="col-span-2 flex items-center justify-end">
          Status
        </div>
      </div>

      {/* Commitments List */}
      <div className="space-y-3">
        {filteredCommitments.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-slate-500">No commitments found matching your search.</p>
          </div>
        ) : (
          <AnimatePresence>
            {filteredCommitments.map((commitment) => {
              const StatusIcon = statusIcons[commitment.status as keyof typeof statusIcons] || Clock;
              const statusColor = statusColors[commitment.status as keyof typeof statusColors] || statusColors.to_check;
              const isExpanded = expandedCommitmentId === commitment.id;

              return (
                <motion.div
                  key={commitment.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  transition={{ duration: 0.2 }}
                  className="bg-white rounded-lg border border-slate-100 shadow-sm hover:shadow-md hover:border-slate-300 transition-all cursor-pointer"
                  onClick={() => onEditCommitment(commitment)}
                >
                  {/* Mobile Header */}
                  <div className="md:hidden px-4 py-3 border-b border-slate-100">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium text-slate-800 truncate flex-1 mr-2">
                        {commitment.title}
                      </h3>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setExpandedCommitmentId(isExpanded ? null : commitment.id);
                        }}
                        className="text-slate-400 hover:text-slate-600 transition-colors"
                      >
                        {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  {/* Desktop/Expanded Content */}
                  <div className={`px-4 py-3 ${isExpanded ? 'block' : 'hidden md:grid'} md:grid-cols-12 md:gap-4 md:items-center`}>
                    {/* Title and Description */}
                    <div className="col-span-4 mb-3 md:mb-0 pr-4">
                      <h3 className="font-semibold text-slate-800 text-sm mb-1 group-hover:text-slate-600 transition-colors">
                        {commitment.title}
                      </h3>
                      {commitment.description && (
                        <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed break-words whitespace-pre-wrap">
                          {commitment.description}
                        </p>
                      )}
                    </div>

                    {/* Project */}
                    <div className="col-span-2 flex items-center space-x-2 mb-2 md:mb-0">
                      <div className={`w-2 h-2 rounded-full ${statusColor.bg.replace('50', '500')}`} />
                      <span className="text-sm text-slate-700 truncate">
                        {commitment.project}
                      </span>
                    </div>

                    {/* Assignee */}
                    <div className="col-span-2 flex items-center space-x-2 mb-2 md:mb-0">
                      <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      <span className="text-sm text-slate-700 truncate">
                        {commitment.assignee?.email || 'Unassigned'}
                      </span>
                    </div>

                    {/* Deadline & Created At */}
                    <div className="col-span-2 flex flex-col justify-center space-y-1 mb-2 md:mb-0">
                      <div className="flex items-center space-x-2">
                        <svg className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span className="text-sm text-slate-700 font-medium">
                          {commitment.deadline ? (
                            new Date(commitment.deadline).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })
                          ) : (
                            <span className="text-slate-400 italic">No deadline</span>
                          )}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400 pl-5 leading-none">
                        Created:{' '}
                        {new Date(commitment.created_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </div>
                    </div>

                    {/* Status and Actions */}
                    <div className="col-span-2 flex items-center justify-end space-x-2">
                      <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-medium ${statusColor.bg} ${statusColor.text} border ${statusColor.border}`}>
                        <StatusIcon className="w-3 h-3" />
                        <span>{statusLabels[commitment.status as keyof typeof statusLabels]}</span>
                      </div>

                      {canEditCommitment(commitment) && (
                        <div className="flex space-x-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMarkAsDone(commitment);
                            }}
                            disabled={commitment.status === 'done'}
                            className={`p-1 rounded-md transition-colors ${commitment.status === 'done' ? 'text-slate-300 cursor-not-allowed' : 'text-emerald-600 hover:bg-emerald-50'}`}
                            title="Mark as Done"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onEditCommitment(commitment);
                            }}
                            className="p-1 text-slate-600 hover:bg-slate-100 rounded-md transition-colors"
                            title="Edit"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Mobile Expanded Details */}
                  {isExpanded && (
                    <div className="md:hidden px-4 pb-3 space-y-3 border-t border-slate-100">
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="flex items-center space-x-2">
                          <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          <span className="text-slate-500">Assignee:</span>
                          <span className="text-slate-700 truncate">{commitment.assignee?.email || 'Unassigned'}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          <span className="text-slate-500">Checker:</span>
                          <span className="text-slate-700 truncate">{commitment.checker?.email || 'Unassigned'}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span className="text-slate-500">Deadline:</span>
                          <span className="text-slate-700">
                            {new Date(commitment.deadline).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </span>
                        </div>
                      </div>

                      {/* Mobile Actions */}
                      {canEditCommitment(commitment) && (
                        <div className="flex space-x-2 pt-2">
                          <button
                            onClick={() => handleMarkAsDone(commitment)}
                            disabled={commitment.status === 'done'}
                            className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${commitment.status === 'done' ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'}`}
                          >
                            <Check className="w-4 h-4 inline-block mr-1" />
                            Mark as Done
                          </button>
                          <button
                            onClick={() => onEditCommitment(commitment)}
                            className="flex-1 px-3 py-2 text-sm font-medium text-white bg-slate-700 rounded-md hover:bg-slate-800 transition-colors"
                          >
                            Edit Details
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
};