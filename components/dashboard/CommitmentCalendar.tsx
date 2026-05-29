'use client';

import React, { useState, useRef, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check } from 'lucide-react';

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
  const [selectedEvent, setSelectedEvent] = useState<Commitment | null>(null);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [popoverPosition, setPopoverPosition] = useState({ top: 0, left: 0 });
  const calendarRef = useRef<FullCalendar | null>(null);
  const popoverRef = useRef<HTMLDivElement | null>(null);

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
      // Calculate popover position
      const calendarEl = (calendarRef.current as unknown as { getApi: () => { el: HTMLElement } })?.getApi().el;
      
      if (calendarEl) {
        const rect = calendarEl.getBoundingClientRect();
        setPopoverPosition({
          top: rect.top + window.scrollY + 50,
          left: rect.left + window.scrollX + 100
        });
      }
      
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
      <div className="flex flex-col p-1">
        <div className="flex items-center space-x-1">
          <div className={`w-2 h-2 rounded-full ${statusColor}`} />
          <span className="text-xs font-medium text-slate-800 truncate">
            {commitment?.project}
          </span>
        </div>
        <div className="text-xs text-slate-600 truncate">
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
          events={commitments.map(commitment => ({
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

      {/* Event Detail Popover */}
      <AnimatePresence>
        {isPopoverOpen && selectedEvent && (
          <motion.div
            ref={popoverRef}
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed z-50"
            style={{ top: popoverPosition.top, left: popoverPosition.left }}
          >
            <div className="w-80 bg-white rounded-lg shadow-2xl border border-slate-200 overflow-hidden">
              {/* Popover Header */}
              <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 bg-slate-50">
                <h3 className="font-semibold text-slate-800 truncate">
                  {selectedEvent.title}
                </h3>
                <button
                  onClick={() => setIsPopoverOpen(false)}
                  className="text-slate-400 hover:text-slate-600 transition-colors"
                  aria-label="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Popover Content */}
              <div className="px-5 py-4 space-y-4">
                {/* Description */}
                {selectedEvent.description && (
                  <div>
                    <p className="text-sm text-slate-600 leading-relaxed">
                      {selectedEvent.description}
                    </p>
                  </div>
                )}

                {/* Metadata Grid */}
                <div className="grid grid-cols-2 gap-3 text-sm">
                  {/* Project */}
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full mt-1 ${statusColors[selectedEvent.status as keyof typeof statusColors]}`} />
                    <span className="text-slate-500">Project:</span>
                    <span className="text-slate-700 font-medium truncate">
                      {selectedEvent.project}
                    </span>
                  </div>

                  {/* Assignee */}
                  <div className="flex items-center space-x-2">
                    <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span className="text-slate-500">Assignee:</span>
                    <span className="text-slate-700 font-medium truncate">
                      {selectedEvent.assignee?.email || 'Unassigned'}
                    </span>
                  </div>

                  {/* Checker */}
                  <div className="flex items-center space-x-2">
                    <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span className="text-slate-500">Checker:</span>
                    <span className="text-slate-700 font-medium truncate">
                      {selectedEvent.checker?.email || 'Unassigned'}
                    </span>
                  </div>

                  {/* Deadline */}
                  <div className="flex items-center space-x-2">
                    <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="text-slate-500">Deadline:</span>
                    <span className="text-slate-700 font-medium">
                      {new Date(selectedEvent.deadline).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </span>
                  </div>

                  {/* Status */}
                  <div className="flex items-center space-x-2 col-span-2">
                    <div className={`w-2 h-2 rounded-full mt-1 ${statusColors[selectedEvent.status as keyof typeof statusColors]}`} />
                    <span className="text-slate-500">Status:</span>
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${
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
                {canEditCommitment(selectedEvent) && (
                  <div className="flex space-x-2 pt-3 border-t border-slate-100">
                    <button
                      onClick={handleMarkAsDone}
                      disabled={selectedEvent.status === 'done'}
                      className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                        selectedEvent.status === 'done'
                          ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                          : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                      }`}
                    >
                      <Check className="w-4 h-4 inline-block mr-1" />
                      Mark as Done
                    </button>
                    <button
                      onClick={() => {
                        onEditCommitment(selectedEvent);
                        setIsPopoverOpen(false);
                      }}
                      className="flex-1 px-3 py-2 text-sm font-medium text-white bg-slate-700 rounded-md hover:bg-slate-800 transition-colors"
                    >
                      Edit Details
                    </button>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};