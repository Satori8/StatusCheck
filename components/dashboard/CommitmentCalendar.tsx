'use client';

import React, { useState, useRef, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Trash2 } from 'lucide-react';
import { updateCommitment, deleteCommitment } from '@/app/actions/commitments';
import { useRouter } from 'next/navigation';

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

interface CommitmentCalendarProps {
  commitments: Commitment[];
  onEditCommitment: (commitment: Commitment) => void;
  currentUserProfile: {
    email: string;
    role: 'manager' | 'member';
  };
}

// Status color mapping
const statusColors = {
  to_check: 'bg-amber-500',
  done: 'bg-emerald-500',
  expired: 'bg-red-500',
  not_actual: 'bg-slate-500',
  ideas_backlog: 'bg-indigo-500'
};

// Status icon mapping - used in CommitmentList
// const statusIcons = {
//   to_check: Clock,
//   done: Check,
//   expired: AlertTriangle,
//   not_actual: Trash2,
//   ideas_backlog: FileText
// };

export const CommitmentCalendar: React.FC<CommitmentCalendarProps> = ({
  commitments,
  onEditCommitment,
  currentUserProfile
}) => {
  const router = useRouter();
  const [selectedEvent, setSelectedEvent] = useState<Commitment | null>(null);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const calendarRef = useRef<FullCalendar | null>(null);
  const popoverRef = useRef<HTMLDivElement | null>(null);

  // Handle event drag & drop (moving commitment to another day)
  const handleEventDrop = async (dropInfo: { event: { id: string; start: Date | null }; revert: () => void }) => {
    const { event } = dropInfo;
    const commitment = commitments.find(c => c.id === event.id);
    
    if (commitment && event.start) {
      const year = event.start.getFullYear();
      const month = String(event.start.getMonth() + 1).padStart(2, '0');
      const day = String(event.start.getDate()).padStart(2, '0');
      const newDate = `${year}-${month}-${day}T00:00:00`;
      
      const result = await updateCommitment(commitment.id, {
        deadline: newDate
      });
      
      if (result.success) {
        router.refresh();
      } else {
        alert(result.error || 'Failed to update date');
        dropInfo.revert();
      }
    }
  };

  // Close popover when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsPopoverOpen(false);
      }
    };

    if (isPopoverOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isPopoverOpen]);

  // Handle event click
  const handleEventClick = (clickInfo: { event: { id: string } }) => {
    const event = clickInfo.event;
    const commitment = commitments.find(c => c.id === event.id);
    
    if (commitment) {
      setSelectedEvent(commitment);
      setIsPopoverOpen(true);
    }
  };

  // Handle mark as done
  const handleMarkAsDone = () => {
    if (selectedEvent) {
      onEditCommitment({ ...selectedEvent, status: 'done' });
      setIsPopoverOpen(false);
    }
  };

  // Handle commitment deletion (managers only)
  const handleDeleteCommitment = async (id: string) => {
    if (confirm('Are you sure you want to delete this commitment?')) {
      const result = await deleteCommitment(id);
      if (result.error) {
        alert(result.error);
      } else {
        setIsPopoverOpen(false);
        router.refresh();
      }
    }
  };

  // Check if user can edit this commitment
  const canEditCommitment = (commitment: Commitment) => {
    return currentUserProfile.role === 'manager' || 
           commitment.assignee?.email === currentUserProfile.email ||
           commitment.checker?.email === currentUserProfile.email;
  };

  // Custom event content renderer
  const renderEventContent = (eventInfo: { event: { id: string; title: string } }) => {
    const commitment = commitments.find(c => c.id === eventInfo.event.id);
    const statusColor = statusColors[commitment?.status as keyof typeof statusColors] || 'bg-slate-500';

    return (
      <div className="flex flex-col p-1 relative group/event w-full">
        {currentUserProfile.role === 'manager' && commitment && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDeleteCommitment(commitment.id);
            }}
            className="absolute top-0 right-0 p-0.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded bg-white border border-slate-100 opacity-0 group-hover/event:opacity-100 transition-opacity z-20"
            title="Delete Commitment"
          >
            <X className="w-3 h-3" />
          </button>
        )}
        <div className="flex items-center space-x-1">
          <div className={`w-2 h-2 rounded-full ${statusColor}`} />
          <span className="text-xs font-bold text-slate-700 truncate max-w-[80%]">
            {commitment?.project}
          </span>
        </div>
        <div className="text-[11px] text-slate-600 truncate mt-0.5">
          {eventInfo.event.title}
        </div>
      </div>
    );
  };

  return (
    <div className="relative">
      {/* FullCalendar Component */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          headerToolbar={
            {
              left: 'prev,next today',
              center: 'title',
              right: 'dayGridMonth,dayGridWeek'
            }
          }
          events={commitments
            .filter(c => c.deadline)
            .map(commitment => ({
              id: commitment.id,
              title: commitment.title,
              start: commitment.deadline,
              end: commitment.deadline,
              allDay: true,
              className: 'custom-event',
              extendedProps: {
                status: commitment.status,
                project: commitment.project
              }
            }))}
          eventContent={renderEventContent}
          eventClick={handleEventClick}
          editable={true}
          eventDrop={handleEventDrop}
          height="auto"
          contentHeight={600}
          aspectRatio={1.5}
          
          // Custom styling
          eventClassNames="bg-slate-900/40 border border-slate-700/20 rounded-full py-1 px-2 hover:bg-slate-800/30 transition-colors"
          dayCellClassNames="hover:bg-slate-50 transition-colors"
          
          // Executive Slate theme
          themeSystem="standard"
          
          // Custom button text
          buttonText={
            {
              today: 'Today',
              month: 'Month',
              week: 'Week',
              day: 'Day'
            }
          }
        />
      </div>

      {/* Event Detail Modal Overlay */}
      <AnimatePresence>
        {isPopoverOpen && selectedEvent && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4"
          >
            <div
              ref={popoverRef}
              className="w-[500px] max-w-full bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
                <h3 className="font-bold text-slate-800 text-lg truncate pr-4">
                  {selectedEvent.title}
                </h3>
                <button
                  onClick={() => setIsPopoverOpen(false)}
                  className="text-slate-400 hover:text-slate-600 transition-colors flex-shrink-0 p-1 hover:bg-slate-200/50 rounded-md"
                  aria-label="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="px-6 py-5 space-y-5">
                {/* Description */}
                {selectedEvent.description && (
                  <div className="border-b border-slate-100 pb-3">
                    <p className="text-sm text-slate-600 leading-relaxed break-words whitespace-pre-wrap max-h-48 overflow-y-auto pr-1">
                      {selectedEvent.description}
                    </p>
                  </div>
                )}

                {/* Metadata Stack */}
                <div className="space-y-3.5 text-sm">
                  {/* Project */}
                  <div className="flex items-center space-x-3 py-1 border-b border-slate-50">
                    <div className={`w-3.5 h-3.5 rounded-full ${statusColors[selectedEvent.status as keyof typeof statusColors] || 'bg-slate-500'} flex-shrink-0`} />
                    <span className="text-slate-500 w-24">Project:</span>
                    <span className="text-slate-800 font-semibold truncate flex-1">
                      {selectedEvent.project}
                    </span>
                  </div>

                  {/* Assignee */}
                  <div className="flex items-center space-x-3 py-1 border-b border-slate-50">
                    <svg className="w-4 h-4 text-slate-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span className="text-slate-500 w-24">Assignee:</span>
                    <span className="text-slate-800 font-medium truncate flex-1">
                      {selectedEvent.assignee?.name || selectedEvent.assignee?.email || 'Unassigned'}
                    </span>
                  </div>

                  {/* Checker */}
                  <div className="flex items-center space-x-3 py-1 border-b border-slate-50">
                    <svg className="w-4 h-4 text-slate-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span className="text-slate-500 w-24">Checker:</span>
                    <span className="text-slate-800 font-medium truncate flex-1">
                      {selectedEvent.checker?.name || selectedEvent.checker?.email || 'Unassigned'}
                    </span>
                  </div>

                  {/* Deadline */}
                  <div className="flex items-center space-x-3 py-1 border-b border-slate-50">
                    <svg className="w-4 h-4 text-slate-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="text-slate-500 w-24">Deadline:</span>
                    <span className="text-slate-800 font-medium flex-1">
                      {selectedEvent.deadline ? (
                        new Date(selectedEvent.deadline).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })
                      ) : (
                        <span className="text-slate-400 italic">No deadline</span>
                      )}
                    </span>
                  </div>

                  {/* Created At */}
                  <div className="flex items-center space-x-3 py-1 border-b border-slate-50">
                    <svg className="w-4 h-4 text-slate-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-slate-500 w-24">Created:</span>
                    <span className="text-slate-800 font-medium flex-1">
                      {new Date(selectedEvent.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </span>
                  </div>

                  {/* Status */}
                  <div className="flex items-center space-x-3 py-1">
                    <svg className="w-4 h-4 text-slate-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-slate-500 w-24">Status:</span>
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                      selectedEvent.status === 'done' ? 'bg-emerald-100 text-emerald-700' :
                        selectedEvent.status === 'expired' ? 'bg-red-100 text-red-700' :
                          selectedEvent.status === 'to_check' ? 'bg-amber-100 text-amber-700' :
                            selectedEvent.status === 'not_actual' ? 'bg-slate-100 text-slate-700' :
                              'bg-indigo-100 text-indigo-700'
                    }`}>
                      {selectedEvent.status === 'to_check' ? 'Pending Review' :
                        selectedEvent.status === 'done' ? 'Verified Done' :
                          selectedEvent.status === 'expired' ? 'Expired' :
                            selectedEvent.status === 'not_actual' ? 'Not Actual' :
                              'Ideas Backlog'}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex space-x-2 pt-4 border-t border-slate-100">
                  {canEditCommitment(selectedEvent) && (
                    <>
                      <button
                        onClick={handleMarkAsDone}
                        disabled={selectedEvent.status === 'done'}
                        className={`flex-1 px-4 py-2.5 text-sm font-medium rounded-lg transition-colors flex items-center justify-center space-x-1.5 ${
                          selectedEvent.status === 'done'
                            ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                            : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                        }`}
                      >
                        <Check className="w-4 h-4" />
                        <span>Mark as Done</span>
                      </button>
                      <button
                        onClick={() => {
                          onEditCommitment(selectedEvent);
                          setIsPopoverOpen(false);
                        }}
                        className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-slate-700 rounded-lg hover:bg-slate-800 transition-colors border border-slate-700"
                      >
                        Edit Details
                      </button>
                    </>
                  )}
                  {currentUserProfile.role === 'manager' && (
                    <button
                      onClick={() => handleDeleteCommitment(selectedEvent.id)}
                      className="px-4 py-2.5 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors border border-red-200 flex items-center justify-center space-x-1.5"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Delete</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};