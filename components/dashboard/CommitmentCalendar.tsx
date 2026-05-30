'use client';

import React, { useState, useRef, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Check, 
  Trash, 
  CalendarBlank, 
  Clock, 
  User, 
  FileText 
} from '@phosphor-icons/react';
import { updateCommitment, deleteCommitment } from '@/app/actions/commitments';
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

interface CommitmentCalendarProps {
  commitments: Commitment[];
  onEditCommitment: (commitment: Commitment) => void;
  currentUserProfile: {
    email: string;
    role: 'manager' | 'member';
  };
  onAddCommitmentWithDate?: (dateStr: string) => void;
}

const statusColors = {
  to_check: 'bg-amber-500',
  done: 'bg-emerald-500',
  expired: 'bg-red-500',
  not_actual: 'bg-slate-500',
  ideas_backlog: 'bg-indigo-500'
};

export const CommitmentCalendar: React.FC<CommitmentCalendarProps> = ({
  commitments,
  onEditCommitment,
  currentUserProfile,
  onAddCommitmentWithDate
}) => {
  const router = useRouter();
  const [selectedEvent, setSelectedEvent] = useState<Commitment | null>(null);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const calendarRef = useRef<FullCalendar | null>(null);
  const popoverRef = useRef<HTMLDivElement | null>(null);

  const [calendarKey, setCalendarKey] = useState(0);

  const lastClickRef = useRef<{ dateStr: string; time: number } | null>(null);

  const handleDateClick = (info: { dateStr: string }) => {
    const now = Date.now();
    if (
      lastClickRef.current &&
      lastClickRef.current.dateStr === info.dateStr &&
      now - lastClickRef.current.time < 300
    ) {
      if (onAddCommitmentWithDate) {
        onAddCommitmentWithDate(info.dateStr);
      }
    }
    lastClickRef.current = { dateStr: info.dateStr, time: now };
  };

  // Handle event drag & drop (moving commitment to another day)
  const handleEventDrop = async (dropInfo: { 
    event: { id: string; start: Date | null }; 
    oldEvent?: { start: Date | null }; 
    revert: () => void; 
  }) => {
    const { event, oldEvent } = dropInfo;
    const commitment = commitments.find(c => c.id === event.id);
    
    if (commitment && event.start) {
      // Prevent database round-trips and UI hangs when dropping on the same day
      const oldTime = oldEvent?.start?.getTime();
      const newTime = event?.start?.getTime();
      if (oldTime === newTime) {
        dropInfo.revert();
        setTimeout(() => {
          setCalendarKey(prev => prev + 1);
        }, 0);
        return;
      }

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
      <div className="flex flex-col p-1.5 relative group/event w-full overflow-hidden">
        {currentUserProfile.role === 'manager' && commitment && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDeleteCommitment(commitment.id);
            }}
            className="absolute top-1 right-1 p-1 text-[#64748b] hover:text-red-400 hover:bg-red-500/10 rounded-md border border-[#24263b] bg-[#11121d] opacity-0 group-hover/event:opacity-100 transition-all duration-200 z-20 active:scale-95"
            title="Delete Commitment"
          >
            <X size={10} weight="bold" />
          </button>
        )}
        <div className="flex items-center space-x-1.5 min-w-0">
          <div className={`w-1.5 h-1.5 rounded-full ${statusColor} flex-shrink-0`} />
          <span className="text-[10px] font-bold text-[#64748b] truncate max-w-[80%] uppercase tracking-wider">
            {commitment?.project}
          </span>
        </div>
        <div className="text-xs font-semibold text-[#f1f5f9] truncate mt-1">
          {eventInfo.event.title}
        </div>
      </div>
    );
  };

  return (
    <div>
      {/* FullCalendar Component */}
      <div className="bg-[#0d0e15] rounded-xl shadow-2xl border border-[#24263b] overflow-hidden">
        <FullCalendar
          key={calendarKey}
          ref={calendarRef}
          plugins={[dayGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,dayGridWeek'
          }}
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
          dateClick={handleDateClick}
          editable={true}
          eventDrop={handleEventDrop}
          height="auto"
          contentHeight={600}
          aspectRatio={1.5}
          
          // Custom styling classes
          eventClassNames={(arg) => {
            const status = arg.event.extendedProps.status;
            return `status-event-${status} rounded-xl transition-colors duration-200 p-1`;
          }}
          dayCellClassNames="hover:bg-white/[0.01] transition-colors"
          
          // Theme system
          themeSystem="standard"
          
          // Custom button text
          buttonText={{
            today: 'Today',
            month: 'Month',
            week: 'Week',
            day: 'Day'
          }}
        />
      </div>

      {/* Event Detail Modal Overlay */}
      <AnimatePresence>
        {isPopoverOpen && selectedEvent && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-[#050508]/60 backdrop-blur-md p-4"
          >
            <motion.div
              ref={popoverRef}
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="w-[500px] max-w-full bg-[#11121d] border border-[#24263b] rounded-2xl shadow-2xl overflow-hidden"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-[#24263b] bg-[#0d0e15]/40">
                <h3 className="font-bold text-white text-sm truncate pr-4 leading-normal font-sans">
                  {selectedEvent.title}
                </h3>
                <button
                  onClick={() => setIsPopoverOpen(false)}
                  className="text-[#64748b] hover:text-[#f1f5f9] transition-colors p-1.5 hover:bg-[#161726] rounded-full border border-[#24263b] flex items-center justify-center bg-transparent active:scale-95 duration-200"
                  aria-label="Close"
                >
                  <X size={14} weight="bold" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="px-6 py-5 space-y-5">
                {/* Description */}
                {selectedEvent.description && (
                  <div className="border-b border-[#24263b]/60 pb-3">
                    <p className="text-sm text-[#f1f5f9] leading-relaxed break-words whitespace-pre-wrap max-h-48 overflow-y-auto pr-1 bg-[#161726]/30 border border-[#24263b]/45 p-3 rounded-xl">
                      {selectedEvent.description}
                    </p>
                  </div>
                )}

                {/* Metadata Stack */}
                <div className="space-y-3.5 text-xs font-semibold">
                  {/* Project */}
                  <div className="flex items-center space-x-3 py-1 border-b border-[#24263b]/40">
                    <div className={`w-3.5 h-3.5 rounded-full ${statusColors[selectedEvent.status as keyof typeof statusColors] || 'bg-slate-500'} flex-shrink-0`} />
                    <span className="text-[#64748b] uppercase tracking-widest text-[9px] w-24">Project</span>
                    <span className="text-[#f1f5f9] truncate flex-1 font-bold">
                      {selectedEvent.project}
                    </span>
                  </div>

                  {/* Assignee */}
                  <div className="flex items-center space-x-3 py-1 border-b border-[#24263b]/40">
                    <User size={14} className="text-[#64748b] flex-shrink-0" />
                    <span className="text-[#64748b] uppercase tracking-widest text-[9px] w-24">Assignee</span>
                    <span className="text-[#f1f5f9] truncate flex-1 font-medium">
                      {selectedEvent.assignee?.name || selectedEvent.assignee?.email || 'Unassigned'}
                    </span>
                  </div>

                  {/* Checker */}
                  <div className="flex items-center space-x-3 py-1 border-b border-[#24263b]/40">
                    <User size={14} className="text-[#64748b] flex-shrink-0" />
                    <span className="text-[#64748b] uppercase tracking-widest text-[9px] w-24">Checker</span>
                    <span className="text-[#f1f5f9] truncate flex-1 font-medium">
                      {selectedEvent.checker?.name || selectedEvent.checker?.email || 'Unassigned'}
                    </span>
                  </div>

                  {/* Deadline */}
                  <div className="flex items-center space-x-3 py-1 border-b border-[#24263b]/40">
                    <CalendarBlank size={14} className="text-[#64748b] flex-shrink-0" />
                    <span className="text-[#64748b] uppercase tracking-widest text-[9px] w-24">Deadline</span>
                    <span className="text-[#f1f5f9] flex-1 font-medium font-mono">
                      {selectedEvent.deadline ? (
                        new Date(selectedEvent.deadline).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })
                      ) : (
                        <span className="text-[#64748b] italic">No deadline configured</span>
                      )}
                    </span>
                  </div>

                  {/* Created At */}
                  <div className="flex items-center space-x-3 py-1 border-b border-[#24263b]/40">
                    <Clock size={14} className="text-[#64748b] flex-shrink-0" />
                    <span className="text-[#64748b] uppercase tracking-widest text-[9px] w-24">Created</span>
                    <span className="text-[#f1f5f9] flex-1 font-medium font-mono">
                      {new Date(selectedEvent.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </span>
                  </div>

                  {/* Status */}
                  <div className="flex items-center space-x-3 py-1">
                    <FileText size={14} className="text-[#64748b] flex-shrink-0" />
                    <span className="text-[#64748b] uppercase tracking-widest text-[9px] w-24">Status</span>
                    <div className="flex-1">
                      <StatusBadge status={selectedEvent.status} />
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex space-x-2 pt-4 border-t border-[#24263b]/60">
                  {canEditCommitment(selectedEvent) && (
                    <>
                      <button
                        onClick={handleMarkAsDone}
                        disabled={selectedEvent.status === 'done'}
                        className={`flex-1 px-4 py-2.5 text-xs font-bold uppercase tracking-wider rounded-xl transition-all flex items-center justify-center space-x-1.5 border-none ${
                          selectedEvent.status === 'done'
                            ? 'bg-[#161726] text-[#64748b] cursor-not-allowed border border-[#24263b]'
                            : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-white'
                        }`}
                      >
                        <Check size={14} weight="bold" />
                        <span>Mark as Done</span>
                      </button>
                      <button
                        onClick={() => {
                          onEditCommitment(selectedEvent);
                          setIsPopoverOpen(false);
                        }}
                        className="flex-1 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white bg-[#24263b] hover:bg-[#313552] rounded-xl border border-[#24263b] transition-all"
                      >
                        Edit Details
                      </button>
                    </>
                  )}
                  {currentUserProfile.role === 'manager' && (
                    <button
                      onClick={() => handleDeleteCommitment(selectedEvent.id)}
                      className="px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-red-400 bg-red-500/10 hover:bg-red-500 hover:text-white rounded-xl border border-red-500/20 flex items-center justify-center space-x-1.5 transition-all"
                    >
                      <Trash size={14} weight="bold" />
                      <span>Delete</span>
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
