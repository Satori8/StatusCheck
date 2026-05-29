'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

type CommitmentStatus = 'to_check' | 'done' | 'expired' | 'not_actual' | 'ideas_backlog';

interface Commitment {
  id: string;
  title: string;
  description?: string | null;
  project: string;
  assignee_id: string;
  checker_id: string;
  deadline: string;
  status: CommitmentStatus;
}

interface CommitmentFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitSuccess: () => void;
  currentUserProfile: {
    email: string;
    role: 'manager' | 'member';
    id: string;
  };
  checkers: { id: string; email: string; name?: string | null }[];
  editingCommitment: Commitment | null;
  projects: { name: string; description?: string | null }[];
}

const statusOptions: { value: CommitmentStatus; label: string }[] = [
  { value: 'to_check', label: 'Pending Review' },
  { value: 'done', label: 'Verified Done' },
  { value: 'expired', label: 'Expired' },
  { value: 'not_actual', label: 'Not Actual' },
  { value: 'ideas_backlog', label: 'Ideas Backlog' },
];

export const CommitmentForm: React.FC<CommitmentFormProps> = ({
  isOpen,
  onClose,
  onSubmitSuccess,
  currentUserProfile,
  checkers,
  editingCommitment,
  projects,
}) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    project: '',
    assignee: currentUserProfile.id,
    checker: currentUserProfile.role === 'manager' ? currentUserProfile.id : (checkers[0]?.id || ''),
    deadline: '',
    time: '',
    status: 'to_check' as CommitmentStatus,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [backendError, setBackendError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [showNewProjectInput, setShowNewProjectInput] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');

  const projectOptions = [
    { value: '', label: 'Select Project' },
    ...projects.map(p => ({ value: p.name, label: p.name })),
    ...(currentUserProfile.role === 'manager' ? [{ value: '__new__', label: '+ Create New Project...' }] : [])
  ];

  const assigneeOptions = [
    { value: '', label: 'Select Assignee' },
    ...checkers.map(c => ({ value: c.id, label: c.name || c.email }))
  ];

  const checkerOptions = [
    { value: '', label: 'Select Checker' },
    ...checkers.map(c => ({ value: c.id, label: c.name || c.email }))
  ];

  const statusOptionsMapped = statusOptions.map(opt => ({
    value: opt.value,
    label: opt.label
  }));

  // Reset form when opened or when editing commitment changes
  useEffect(() => {
    if (isOpen) {
      setShowNewProjectInput(false);
      setNewProjectName('');
      
      if (editingCommitment) {
        // Edit mode - populate form with existing commitment data
        const deadlineVal = editingCommitment.deadline || '';
        const parts = deadlineVal.split('T');
        const datePart = parts[0] || '';
        const timePart = parts[1] ? parts[1].slice(0, 5) : '';

        setFormData({
          title: editingCommitment.title,
          description: editingCommitment.description || '',
          project: editingCommitment.project,
          assignee: editingCommitment.assignee_id || currentUserProfile.id,
          checker: editingCommitment.checker_id || (currentUserProfile.role === 'manager' ? currentUserProfile.id : (checkers[0]?.id || '')),
          deadline: datePart,
          time: timePart,
          status: editingCommitment.status,
        });
      } else {
        // Create mode - reset to defaults
        setFormData({
          title: '',
          description: '',
          project: '',
          assignee: currentUserProfile.id,
          checker: currentUserProfile.role === 'manager' ? currentUserProfile.id : (checkers[0]?.id || ''),
          deadline: '',
          time: '',
          status: 'to_check',
        });
      }
      setErrors({});
      setBackendError(null);
    }
  }, [isOpen, editingCommitment, currentUserProfile.id, checkers, currentUserProfile.role]);

  const handleProjectSelect = (val: string) => {
    if (val === '__new__') {
      setShowNewProjectInput(true);
      setFormData(prev => ({ ...prev, project: '' }));
    } else {
      setShowNewProjectInput(false);
      setFormData(prev => ({ ...prev, project: val }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    } else if (formData.title.length < 3) {
      newErrors.title = 'Title must be at least 3 characters';
    }

    if (!formData.project.trim()) {
      newErrors.project = 'Project is required';
    }

    if (!formData.assignee.trim()) {
      newErrors.assignee = 'Assignee is required';
    }

    if (!formData.checker.trim()) {
      newErrors.checker = 'Checker is required';
    }

    if (formData.status !== 'ideas_backlog' && !formData.deadline) {
      newErrors.deadline = 'Deadline is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setBackendError(null);

    try {
      // Combine date + time into ISO string: ${date}T${time || '00:00'}:00
      const deadlineISO = formData.deadline
        ? `${formData.deadline}T${formData.time || '00:00'}:00`
        : null;

      // Auto-transition: if deadline is shifted from past to future, restore 'expired' status to 'to_check' (actual)
      let finalStatus = formData.status;
      if (deadlineISO) {
        const deadlineDate = new Date(deadlineISO);
        const isFuture = deadlineDate > new Date();
        if (isFuture && formData.status === 'expired') {
          finalStatus = 'to_check';
        }
      }

      // Prepare data for submission
      const submissionData = {
        title: formData.title,
        description: formData.description,
        project: formData.project,
        assignee_id: formData.assignee,
        checker_id: formData.checker,
        deadline: deadlineISO,
        status: finalStatus,
      };

      let result;
      if (editingCommitment) {
        // Update existing commitment
        const response = await fetch('/api/commitments', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            id: editingCommitment.id,
            ...submissionData,
          }),
        });
        result = await response.json();
      } else {
        // Create new commitment
        const response = await fetch('/api/commitments', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(submissionData),
        });
        result = await response.json();
      }

      if (result.error) {
        throw new Error(result.error);
      }

      // Call success handler
      onSubmitSuccess();
      onClose();
    } catch (error) {
      console.error('Failed to submit commitment:', error);
      setBackendError(error instanceof Error ? error.message : 'Failed to submit commitment. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="w-full max-w-md mx-4 md:mx-0"
        >
          <div className="bg-white rounded-xl shadow-2xl">
            {/* Header with close button */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
              <h2 className="text-lg font-semibold text-slate-800">
                {editingCommitment ? 'Edit Commitment' : 'Add New Commitment'}
              </h2>
              <button
                onClick={onClose}
                disabled={isSubmitting}
                className="text-slate-400 hover:text-slate-600 transition-colors p-1 hover:bg-slate-200/50 rounded-md border-0 bg-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Close form"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form content */}
            <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
              {/* Title */}
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-slate-700 mb-1">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 bg-white text-slate-800 ${
                    errors.title ? 'border-red-300 focus:ring-red-500' : 'border-slate-300 focus:border-slate-500'
                  }`}
                  placeholder="Enter a clear, concise title"
                />
                {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title}</p>}
              </div>

              {/* Description */}
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-slate-700 mb-1">
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  rows={3}
                  className="w-full px-3 py-2 border border-slate-300 bg-white text-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 resize-none"
                  placeholder="Provide additional details about this commitment"
                />
              </div>

              {/* Project Selection */}
              <div>
                <label htmlFor="project" className="block text-sm font-medium text-slate-700 mb-1">
                  Project <span className="text-red-500">*</span>
                </label>
                {!showNewProjectInput ? (
                  <CustomDropdown
                    id="project-select"
                    value={formData.project}
                    onChange={handleProjectSelect}
                    options={projectOptions}
                    placeholder="Select Project"
                    disabled={isSubmitting}
                    error={!!errors.project}
                  />
                ) : (
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={newProjectName}
                      onChange={(e) => {
                        setNewProjectName(e.target.value);
                        setFormData(prev => ({ ...prev, project: e.target.value }));
                      }}
                      placeholder="Enter new project name"
                      className="flex-1 px-3 py-2 border border-slate-300 bg-white text-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setShowNewProjectInput(false);
                        setNewProjectName('');
                        setFormData(prev => ({ ...prev, project: projects[0]?.name || '' }));
                      }}
                      className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg border border-slate-200 text-sm font-medium"
                    >
                      Cancel
                    </button>
                  </div>
                )}
                {!showNewProjectInput && projects.find(p => p.name === formData.project)?.description && (
                  <p className="mt-1 text-xs text-slate-500 italic leading-relaxed">
                    Description: {projects.find(p => p.name === formData.project)?.description}
                  </p>
                )}
                {errors.project && <p className="mt-1 text-sm text-red-600">{errors.project}</p>}
              </div>

              {/* Assignee */}
              <div>
                <label htmlFor="assignee" className="block text-sm font-medium text-slate-700 mb-1">
                  Assignee <span className="text-red-500">*</span>
                </label>
                <CustomDropdown
                  id="assignee"
                  value={formData.assignee}
                  onChange={(val) => setFormData(prev => ({ ...prev, assignee: val }))}
                  options={assigneeOptions}
                  placeholder="Select Assignee"
                  disabled={isSubmitting}
                  error={!!errors.assignee}
                />
                {errors.assignee && <p className="mt-1 text-sm text-red-600">{errors.assignee}</p>}
              </div>

              {/* Checker */}
              <div>
                <label htmlFor="checker" className="block text-sm font-medium text-slate-700 mb-1">
                  Checker <span className="text-red-500">*</span>
                </label>
                <CustomDropdown
                  id="checker"
                  value={formData.checker}
                  onChange={(val) => setFormData(prev => ({ ...prev, checker: val }))}
                  options={checkerOptions}
                  placeholder="Select Checker"
                  disabled={isSubmitting}
                  error={!!errors.checker}
                />
                {errors.checker && <p className="mt-1 text-sm text-red-600">{errors.checker}</p>}
              </div>

              {/* Deadline */}
              <div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="deadline" className="block text-sm font-medium text-slate-700 mb-1">
                      Deadline <span className="text-red-500">*</span>
                    </label>
                    <CustomDatePicker
                      value={formData.deadline}
                      onChange={(val) => setFormData(prev => ({ ...prev, deadline: val }))}
                      disabled={isSubmitting}
                      error={!!errors.deadline}
                    />
                  </div>
                  <div>
                    <label htmlFor="time" className="block text-sm font-medium text-slate-700 mb-1">
                      Time (optional)
                    </label>
                    <CustomTimePicker
                      value={formData.time}
                      onChange={(val) => setFormData(prev => ({ ...prev, time: val }))}
                      disabled={isSubmitting}
                    />
                  </div>
                </div>
                {errors.deadline && <p className="mt-1 text-sm text-red-600">{errors.deadline}</p>}
              </div>

              {/* Status */}
              <div>
                <label htmlFor="status" className="block text-sm font-medium text-slate-700 mb-1">
                  Status
                </label>
                <CustomDropdown
                  id="status"
                  value={formData.status}
                  onChange={(val) => setFormData(prev => ({ ...prev, status: val as CommitmentStatus }))}
                  options={statusOptionsMapped}
                  disabled={isSubmitting}
                />
              </div>

              {/* Backend error display */}
              {backendError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600">{backendError}</p>
                </div>
              )}

              {/* Form actions */}
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-sm border border-slate-200/60 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`px-4 py-2 text-white rounded-lg transition-colors font-semibold ${
                    isSubmitting 
                      ? 'bg-slate-400 cursor-not-allowed'
                      : 'bg-slate-600 hover:bg-slate-700 shadow-sm'
                  }`}
                >
                  {isSubmitting ? (
                    <span className="flex items-center justify-center">
                      <LoadingSpinner size="sm" className="mr-2" />
                      {editingCommitment ? 'Updating...' : 'Submitting...'}
                    </span>
                  ) : (
                    editingCommitment ? 'Update Commitment' : 'Add Commitment'
                  )}
                </button>
              </div>
            </form>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

// LoadingSpinner component (copied from existing implementation)
const LoadingSpinner: React.FC<{ size?: 'sm' | 'md' | 'lg'; className?: string }> = ({ 
  size = 'md', 
  className = '' 
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4 border-2',
    md: 'h-6 w-6 border-2',
    lg: 'h-8 w-8 border-3',
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

// Custom Dropdown Selection Component
interface DropdownProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
  disabled?: boolean;
  error?: boolean;
}

const CustomDropdown: React.FC<DropdownProps> = ({
  value,
  onChange,
  options,
  placeholder = 'Select option',
  disabled = false,
  error = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectedOption = options.find(opt => opt.value === value);

  return (
    <div className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between px-3 py-2 border rounded-lg bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-500 text-left disabled:opacity-50 text-sm ${
          error ? 'border-red-300 focus:ring-red-500' : 'border-slate-300 focus:border-slate-500'
        }`}
      >
        <span className="truncate">{selectedOption ? selectedOption.label : placeholder}</span>
        <svg className={`w-4 h-4 ml-2 text-slate-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      
      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <ul className="absolute z-20 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 overflow-y-auto py-1 text-sm">
            {options.map(opt => (
              <li key={opt.value}>
                <button
                  type="button"
                  onClick={() => {
                    onChange(opt.value);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 transition-colors ${
                    opt.value === value
                      ? 'bg-slate-800 text-white font-semibold'
                      : 'bg-slate-50/80 text-slate-700 hover:bg-slate-200/70'
                  }`}
                >
                  {opt.label}
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
};

// Custom Interactive Calendar Date Picker
interface DatePickerProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  error?: boolean;
}

const CustomDatePicker: React.FC<DatePickerProps> = ({
  value,
  onChange,
  disabled = false,
  error = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());

  // value is in YYYY-MM-DD format
  const selectedDate = value ? new Date(value) : null;

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Get first day of the month and number of days in the month
  const firstDayIndex = new Date(year, month, 1).getDay();
  const totalDays = new Date(year, month + 1, 0).getDate();

  // Month names
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleDayClick = (day: number) => {
    const formattedMonth = String(month + 1).padStart(2, '0');
    const formattedDay = String(day).padStart(2, '0');
    const dateStr = `${year}-${formattedMonth}-${formattedDay}`;
    onChange(dateStr);
    setIsOpen(false);
  };

  const isToday = (day: number) => {
    const today = new Date();
    return today.getDate() === day && today.getMonth() === month && today.getFullYear() === year;
  };

  const isSelected = (day: number) => {
    if (!selectedDate) return false;
    return selectedDate.getDate() === day && selectedDate.getMonth() === month && selectedDate.getFullYear() === year;
  };

  const isPast = (day: number) => {
    const d = new Date(year, month, day);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return d < today;
  };

  // Generate days array
  const days = [];
  for (let i = 0; i < firstDayIndex; i++) {
    days.push(null);
  }
  for (let i = 1; i <= totalDays; i++) {
    days.push(i);
  }

  // Format selected date for display
  const displayValue = selectedDate 
    ? selectedDate.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
    : 'Select date';

  return (
    <div className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between px-3 py-2 border rounded-lg bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-500 text-left disabled:opacity-50 text-sm ${
          error ? 'border-red-300 focus:ring-red-500' : 'border-slate-300 focus:border-slate-500'
        }`}
      >
        <span>{displayValue}</span>
        <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div className="absolute z-20 bottom-full mb-1 bg-white border border-slate-200 rounded-xl shadow-xl p-3 w-80 left-0 md:left-auto md:right-0">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <button
                type="button"
                onClick={handlePrevMonth}
                className="p-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200/80 rounded-lg text-slate-600 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <span className="font-semibold text-slate-800 text-sm">
                {monthNames[month]} {year}
              </span>
              <button
                type="button"
                onClick={handleNextMonth}
                className="p-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200/80 rounded-lg text-slate-600 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            {/* Weekdays */}
            <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-slate-500 mb-2">
              <div>Su</div>
              <div>Mo</div>
              <div>Tu</div>
              <div>We</div>
              <div>Th</div>
              <div>Fr</div>
              <div>Sa</div>
            </div>

            {/* Days */}
            <div className="grid grid-cols-7 gap-1 justify-items-center">
              {days.map((day, idx) => {
                if (day === null) {
                  return <div key={`empty-${idx}`} />;
                }

                const past = isPast(day);
                const selected = isSelected(day);
                const today = isToday(day);

                return (
                  <button
                    key={`day-${day}`}
                    type="button"
                    disabled={past}
                    onClick={() => handleDayClick(day)}
                    className="h-8 w-8 flex items-center justify-center focus:outline-none relative mx-auto"
                  >
                    <span
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium transition-colors ${
                        selected
                          ? 'bg-slate-800 text-white font-semibold shadow-sm'
                          : past
                            ? 'bg-transparent text-slate-300 cursor-not-allowed'
                            : today
                              ? 'bg-slate-100 text-slate-800 font-bold border border-slate-300 hover:bg-slate-200/50'
                              : 'bg-transparent hover:bg-slate-100 text-slate-700'
                      }`}
                    >
                      {day}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

// Custom Interactive Time Picker Component
interface TimePickerProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

const CustomTimePicker: React.FC<TimePickerProps> = ({
  value,
  onChange,
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  
  // value is in HH:MM format
  const [hour, setHour] = useState(value ? value.split(':')[0] : '12');
  const [minute, setMinute] = useState(value ? value.split(':')[1] : '00');

  useEffect(() => {
    if (value) {
      const parts = value.split(':');
      setHour(parts[0] || '12');
      setMinute(parts[1] || '00');
    } else {
      setHour('');
      setMinute('');
    }
  }, [value]);

  const handleHourSelect = (h: string) => {
    const m = minute || '00';
    setHour(h);
    onChange(`${h}:${m}`);
  };

  const handleMinuteSelect = (m: string) => {
    const h = hour || '12';
    setMinute(m);
    onChange(`${h}:${m}`);
  };

  const handleClear = () => {
    setHour('');
    setMinute('');
    onChange('');
    setIsOpen(false);
  };

  const displayValue = value ? value : 'Select time';

  // Hours: 00 to 23
  const hours = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
  // Minutes: 00, 05, 10, ... 55
  const minutes = Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, '0'));

  return (
    <div className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-500 text-left disabled:opacity-50 text-sm"
      >
        <span>{displayValue}</span>
        <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div className="absolute z-20 bottom-full mb-1 bg-white border border-slate-200 rounded-xl shadow-xl p-3 w-64 right-0 flex flex-col">
            <style dangerouslySetInnerHTML={{ __html: `
              .custom-scrollbar::-webkit-scrollbar {
                width: 5px;
              }
              .custom-scrollbar::-webkit-scrollbar-track {
                background: transparent;
              }
              .custom-scrollbar::-webkit-scrollbar-thumb {
                background: #e2e8f0; /* slate-200 */
                border-radius: 10px;
              }
              .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                background: #cbd5e1; /* slate-300 */
              }
              .custom-scrollbar {
                scrollbar-width: thin;
                scrollbar-color: #e2e8f0 transparent;
                outline: none !important;
              }
              .custom-scrollbar * {
                outline: none !important;
              }
            `}} />
            <div className="flex gap-2 max-h-48 overflow-hidden mb-2">
              {/* Hours Column */}
              <div className="flex-1 overflow-y-auto border border-slate-100 rounded-lg max-h-40 custom-scrollbar outline-none focus:outline-none">
                <div className="text-center text-[10px] font-bold text-slate-500 py-1 bg-slate-50 border-b border-slate-100 sticky top-0 uppercase tracking-wider">Hour</div>
                {hours.map(h => (
                  <button
                    key={`h-${h}`}
                    type="button"
                    onClick={() => handleHourSelect(h)}
                    className={`w-full text-center py-1 text-xs font-semibold outline-none focus:outline-none ${
                      hour === h
                        ? 'bg-slate-800 text-white hover:bg-slate-800 font-bold'
                        : 'bg-slate-50/80 text-slate-700 hover:bg-slate-200/70'
                    }`}
                  >
                    {h}
                  </button>
                ))}
              </div>

              {/* Minutes Column */}
              <div className="flex-1 overflow-y-auto border border-slate-100 rounded-lg max-h-40 custom-scrollbar outline-none focus:outline-none">
                <div className="text-center text-[10px] font-bold text-slate-500 py-1 bg-slate-50 border-b border-slate-100 sticky top-0 uppercase tracking-wider">Min</div>
                {minutes.map(m => (
                  <button
                    key={`m-${m}`}
                    type="button"
                    onClick={() => handleMinuteSelect(m)}
                    className={`w-full text-center py-1 text-xs font-semibold outline-none focus:outline-none ${
                      minute === m
                        ? 'bg-slate-800 text-white hover:bg-slate-800 font-bold'
                        : 'bg-slate-50/80 text-slate-700 hover:bg-slate-200/70'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-between items-center border-t border-slate-100 pt-2">
              <button
                type="button"
                onClick={handleClear}
                className="text-xs text-red-600 bg-red-50 hover:bg-red-100 border border-red-200/80 font-medium px-2.5 py-1.5 rounded-lg transition-colors"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-xs text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 font-semibold px-3 py-1.5 rounded-lg transition-colors"
              >
                OK
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};