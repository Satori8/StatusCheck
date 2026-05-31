'use client';

import React, { useState, useEffect } from 'react';
import { FormShell } from './FormShell';
import { 
  CalendarBlank, 
  Clock, 
  CaretDown, 
  CaretLeft, 
  CaretRight, 
  Check
} from '@phosphor-icons/react';
import { createProject } from '@/app/actions/projects';
import { useRouter } from 'next/navigation';

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
  defaultProject?: string | null;
  defaultStatus?: CommitmentStatus;
  defaultDeadline?: string | null;
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
  defaultProject = null,
  defaultStatus = 'to_check',
  defaultDeadline = null,
}) => {
  const router = useRouter();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    project: defaultProject || '',
    assignee: currentUserProfile.id,
    checker: currentUserProfile.role === 'manager' ? currentUserProfile.id : (checkers[0]?.id || ''),
    deadline: defaultDeadline || '',
    time: '',
    status: defaultStatus || ('to_check' as CommitmentStatus),
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [backendError, setBackendError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [showNewProjectInput, setShowNewProjectInput] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDesc, setNewProjectDesc] = useState('');

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
      setNewProjectDesc('');
      
      if (editingCommitment) {
        // Edit mode - populate form with existing commitment data
        const deadlineVal = editingCommitment.deadline || '';
        let datePart = '';
        let timePart = '';
        
        if (deadlineVal) {
          const localDate = new Date(deadlineVal);
          const year = localDate.getFullYear();
          const month = String(localDate.getMonth() + 1).padStart(2, '0');
          const day = String(localDate.getDate()).padStart(2, '0');
          datePart = `${year}-${month}-${day}`;
          
          const hours = String(localDate.getHours()).padStart(2, '0');
          const minutes = String(localDate.getMinutes()).padStart(2, '0');
          timePart = `${hours}:${minutes}`;
        }

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
        // Create mode - reset to defaults (incorporating auto-sets)
        setFormData({
          title: '',
          description: '',
          project: defaultProject || '',
          assignee: currentUserProfile.id,
          checker: currentUserProfile.role === 'manager' ? currentUserProfile.id : (checkers[0]?.id || ''),
          deadline: defaultDeadline || '',
          time: '',
          status: defaultStatus || 'to_check',
        });
      }
      setErrors({});
      setBackendError(null);
    }
  }, [isOpen, editingCommitment, currentUserProfile.id, checkers, currentUserProfile.role, defaultProject, defaultStatus, defaultDeadline]);

  const handleProjectSelect = (val: string) => {
    if (val === '__new__') {
      setShowNewProjectInput(true);
      setFormData(prev => ({ ...prev, project: '' }));
    } else {
      setShowNewProjectInput(false);
      setFormData(prev => ({ ...prev, project: val }));
    }
  };

  const handleCreateProjectRealtime = async () => {
    if (!newProjectName.trim()) return;
    setIsSubmitting(true);
    setBackendError(null);
    
    const result = await createProject(newProjectName.trim(), newProjectDesc.trim() || undefined);
    setIsSubmitting(false);
    
    if (result.error) {
      setBackendError(result.error);
    } else {
      setFormData(prev => ({ ...prev, project: newProjectName.trim() }));
      setShowNewProjectInput(false);
      setNewProjectName('');
      setNewProjectDesc('');
      router.refresh();
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
      // Convert local selected date and time into a UTC ISO string
      let deadlineISO = null;
      if (formData.status !== 'ideas_backlog' && formData.deadline) {
        const [year, month, day] = formData.deadline.split('-').map(Number);
        const [hours, minutes] = (formData.time || '00:00').split(':').map(Number);
        const localDate = new Date(year, month - 1, day, hours, minutes, 0);
        deadlineISO = localDate.toISOString();
      }

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

  return (
    <FormShell
      isOpen={isOpen}
      onClose={onClose}
      title={editingCommitment ? 'Edit Commitment' : 'Add New Commitment'}
    >
      <form onSubmit={handleSubmit} className="space-y-5 text-[#f1f5f9] pb-36">
        {/* Title */}
        <div className="space-y-1.5">
          <label htmlFor="title" className="block text-[10px] font-bold text-[#64748b] tracking-wider uppercase">
            Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            disabled={isSubmitting}
            className={`w-full px-3 py-2.5 bg-[#161726] border text-[#f1f5f9] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all ${
              errors.title ? 'border-red-500/55 focus:ring-red-500/30' : 'border-[#24263b] focus:border-blue-500/40'
            }`}
            placeholder="Enter a clear, concise title"
          />
          {errors.title && <p className="text-xs text-red-400 mt-1">{errors.title}</p>}
        </div>

        {/* Description */}
        <div className="space-y-1.5">
          <label htmlFor="description" className="block text-[10px] font-bold text-[#64748b] tracking-wider uppercase">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            disabled={isSubmitting}
            rows={4}
            className="w-full px-3 py-2.5 bg-[#161726] border border-[#24263b] text-[#f1f5f9] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 resize-none transition-all"
            placeholder="Provide additional details about this commitment"
          />
        </div>

        {/* Project Selection / Realtime Creation Box */}
        <div className="space-y-1.5">
          <label htmlFor="project" className="block text-[10px] font-bold text-[#64748b] tracking-wider uppercase">
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
            /* Nested Double Bezel Project Creation Box matching Left Sidebar */
            <div className="p-1 bg-[#161726]/40 border border-[#24263b] rounded-[1.5rem] shadow-xl animate-in fade-in zoom-in-95 duration-200">
              <div className="bg-[#11121d] border border-[#24263b]/50 p-4 rounded-[calc(1.5rem-4px)] space-y-3.5">
                <h4 className="text-[10px] font-bold text-white uppercase tracking-widest mb-1">Create New Project</h4>
                
                <div className="space-y-1">
                  <label className="block text-[9px] font-bold text-[#64748b] tracking-wider uppercase">Project Name *</label>
                  <input
                    type="text"
                    value={newProjectName}
                    onChange={(e) => {
                      setNewProjectName(e.target.value);
                    }}
                    placeholder="e.g. Q4 Launch"
                    className="w-full px-3 py-2 bg-[#161726] border border-[#24263b] text-[#f1f5f9] rounded-xl text-xs focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[9px] font-bold text-[#64748b] tracking-wider uppercase">Description</label>
                  <textarea
                    value={newProjectDesc}
                    onChange={(e) => setNewProjectDesc(e.target.value)}
                    placeholder="e.g. Deliverable timeline"
                    rows={2}
                    className="w-full px-3 py-2 bg-[#161726] border border-[#24263b] text-[#f1f5f9] rounded-xl text-xs focus:outline-none resize-none"
                  />
                </div>

                <div className="flex space-x-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setShowNewProjectInput(false);
                      setNewProjectName('');
                      setNewProjectDesc('');
                      setFormData(prev => ({ ...prev, project: projects[0]?.name || '' }));
                    }}
                    className="flex-1 py-1.5 bg-[#161726] hover:bg-[#1e2035] text-[#64748b] hover:text-[#f1f5f9] border border-[#24263b] rounded-xl text-[10px] font-bold uppercase tracking-wider"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleCreateProjectRealtime}
                    className="flex-1 py-1.5 bg-[#143c90] hover:bg-[#1e4fb8] text-white rounded-xl text-[10px] font-bold uppercase tracking-wider border-none shadow-md"
                  >
                    Create
                  </button>
                </div>
              </div>
            </div>
          )}
          {!showNewProjectInput && projects.find(p => p.name === formData.project)?.description && (
            <p className="text-xs text-[#64748b] italic bg-[#161726]/40 border border-[#24263b]/60 p-3 rounded-xl">
              Description: {projects.find(p => p.name === formData.project)?.description}
            </p>
          )}
          {errors.project && <p className="text-xs text-red-400 mt-1">{errors.project}</p>}
        </div>

        {/* Assignee */}
        <div className="space-y-1.5">
          <label htmlFor="assignee" className="block text-[10px] font-bold text-[#64748b] tracking-wider uppercase">
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
          {errors.assignee && <p className="text-xs text-red-400 mt-1">{errors.assignee}</p>}
        </div>

        {/* Checker */}
        <div className="space-y-1.5">
          <label htmlFor="checker" className="block text-[10px] font-bold text-[#64748b] tracking-wider uppercase">
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
          {errors.checker && <p className="text-xs text-red-400 mt-1">{errors.checker}</p>}
        </div>

        {/* Deadline (Fully Bypassed/Hidden for Backlog Ideas) */}
        {formData.status !== 'ideas_backlog' && (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="deadline" className="block text-[10px] font-bold text-[#64748b] tracking-wider uppercase">
                Deadline <span className="text-red-500">*</span>
              </label>
              <CustomDatePicker
                value={formData.deadline}
                onChange={(val) => setFormData(prev => ({ ...prev, deadline: val }))}
                disabled={isSubmitting}
                error={!!errors.deadline}
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="time" className="block text-[10px] font-bold text-[#64748b] tracking-wider uppercase">
                Time (optional)
              </label>
              <CustomTimePicker
                value={formData.time}
                onChange={(val) => setFormData(prev => ({ ...prev, time: val }))}
                disabled={isSubmitting}
              />
            </div>
            {errors.deadline && <p className="text-xs text-red-400 mt-1">{errors.deadline}</p>}
          </div>
        )}

        {/* Status */}
        <div className="space-y-1.5">
          <label htmlFor="status" className="block text-[10px] font-bold text-[#64748b] tracking-wider uppercase">
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
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
            <p className="text-xs text-red-400 leading-relaxed">{backendError}</p>
          </div>
        )}

        {/* Form actions */}
        <div className="flex justify-end space-x-3 pt-4 border-t border-[#24263b]/60">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-5 py-3 bg-[#161726] hover:bg-[#1e2035] text-[#64748b] hover:text-[#f1f5f9] border border-[#24263b] rounded-xl text-xs font-bold uppercase tracking-wider transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className={`px-5 py-3 text-white rounded-xl transition-all active:scale-[0.98] duration-200 text-xs font-bold uppercase tracking-wider border-none shadow-lg shadow-blue-500/10 ${
              isSubmitting 
                ? 'bg-[#24263b] text-[#64748b] cursor-not-allowed'
                : 'bg-[#143c90] hover:bg-[#1e4fb8]'
            }`}
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center">
                <div className="loader mr-2 h-3 w-3" />
                <span>{editingCommitment ? 'Updating...' : 'Submitting...'}</span>
              </span>
            ) : (
              editingCommitment ? 'Update Commitment' : 'Add Commitment'
            )}
          </button>
        </div>
      </form>
    </FormShell>
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
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between px-3 py-2.5 border rounded-xl bg-[#161726] text-[#f1f5f9] focus:outline-none focus:ring-2 focus:ring-blue-500/40 text-left text-sm select-none transition-all ${
          disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'
        } ${
          error ? 'border-red-500/55 focus:ring-red-500/30' : 'border-[#24263b] focus:border-blue-500/40'
        }`}
      >
        <span className="truncate">{selectedOption ? selectedOption.label : placeholder}</span>
        <CaretDown size={14} weight="bold" className={`text-[#64748b] transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </div>
      
      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <ul className="absolute z-50 w-full mt-1.5 bg-[#11121d] border border-[#24263b] rounded-xl shadow-2xl max-h-60 overflow-y-auto py-1.5 text-sm">
            {options.map(opt => (
              <li key={opt.value} className="px-1">
                <div
                  role="button"
                  onClick={() => {
                    onChange(opt.value);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 transition-colors rounded-lg cursor-pointer select-none text-xs font-semibold flex items-center justify-between ${
                    opt.value === value
                      ? 'bg-[#143c90] text-white font-bold'
                      : 'text-[#64748b] hover:text-[#f1f5f9] hover:bg-[#161726]'
                  }`}
                >
                  <span className="truncate">{opt.label}</span>
                  {opt.value === value && <Check size={12} weight="bold" />}
                </div>
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
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between px-3 py-2.5 border rounded-xl bg-[#161726] text-[#f1f5f9] focus:outline-none focus:ring-2 focus:ring-blue-500/40 text-left text-sm select-none transition-all ${
          disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'
        } ${
          error ? 'border-red-500/55 focus:ring-red-500/30' : 'border-[#24263b] focus:border-blue-500/40'
        }`}
      >
        <span>{displayValue}</span>
        <CalendarBlank size={16} className="text-[#64748b]" />
      </div>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          {/* Opens upward (bottom-full) and aligned to the right edge (right-0) of the input */}
          <div className="absolute z-50 bottom-full mb-1.5 bg-[#11121d] border border-[#24263b] rounded-xl shadow-2xl p-4 w-72 right-0">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <button
                type="button"
                onClick={handlePrevMonth}
                className="p-1 bg-[#161726] hover:bg-[#1e2035] border border-[#24263b] rounded-lg text-[#64748b] hover:text-[#f1f5f9] transition-all"
              >
                <CaretLeft size={14} weight="bold" />
              </button>
              <span className="font-bold text-[#f1f5f9] text-xs uppercase tracking-wider select-none">
                {monthNames[month]} {year}
              </span>
              <button
                type="button"
                onClick={handleNextMonth}
                className="p-1 bg-[#161726] hover:bg-[#1e2035] border border-[#24263b] rounded-lg text-[#64748b] hover:text-[#f1f5f9] transition-all"
              >
                <CaretRight size={14} weight="bold" />
              </button>
            </div>

            {/* Weekdays */}
            <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-[#64748b] mb-2 select-none uppercase tracking-widest">
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
                    className={`h-7 w-7 text-xs font-semibold rounded-full flex items-center justify-center transition-all select-none border-none ${
                      selected
                        ? 'bg-[#143c90] text-white font-bold shadow-md cursor-pointer'
                        : past
                          ? 'bg-transparent text-[#24263b] cursor-not-allowed'
                          : today
                            ? 'bg-[#143c90]/10 text-blue-400 font-bold border border-[#143c90]/20 hover:bg-[#143c90]/20 cursor-pointer'
                            : 'bg-transparent hover:bg-[#161726] text-[#64748b] hover:text-[#f1f5f9] cursor-pointer'
                    }`}
                  >
                    {day}
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
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between px-3 py-2.5 border rounded-xl bg-[#161726] text-[#f1f5f9] focus:outline-none focus:ring-2 focus:ring-blue-500/40 text-left text-sm select-none transition-all border-[#24263b] ${
          disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'
        }`}
      >
        <span>{displayValue}</span>
        <Clock size={16} className="text-[#64748b]" />
      </div>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          {/* Opens upward (bottom-full) and aligned to the right edge (right-0) of the input */}
          <div className="absolute z-50 bottom-full mb-1.5 bg-[#11121d] border border-[#24263b] rounded-xl shadow-2xl p-4 w-60 right-0 flex flex-col">
            <style dangerouslySetInnerHTML={{ __html: `
              .custom-scrollbar::-webkit-scrollbar {
                width: 4px;
              }
              .custom-scrollbar::-webkit-scrollbar-track {
                background: transparent;
              }
              .custom-scrollbar::-webkit-scrollbar-thumb {
                background: #24263b;
                border-radius: 9999px;
              }
              .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                background: #313552;
              }
              .custom-scrollbar {
                scrollbar-width: thin;
                scrollbar-color: #24263b transparent;
                outline: none !important;
              }
              .custom-scrollbar * {
                outline: none !important;
              }
            `}} />
            <div className="flex gap-2 max-h-40 overflow-hidden mb-3 select-none">
              {/* Hours Column */}
              <div className="flex-1 overflow-y-auto border border-[#24263b] rounded-lg max-h-36 custom-scrollbar outline-none focus:outline-none bg-[#161726]">
                <div className="text-center text-[9px] font-bold text-[#64748b] py-1 bg-[#11121d] border-b border-[#24263b] sticky top-0 uppercase tracking-wider">Hour</div>
                {hours.map(h => (
                  <button
                    key={`h-${h}`}
                    type="button"
                    onClick={() => handleHourSelect(h)}
                    className={`w-full text-center py-1 text-xs font-semibold cursor-pointer border-none select-none transition-colors ${
                      hour === h
                        ? 'bg-[#143c90] text-white font-bold'
                        : 'text-[#64748b] hover:text-[#f1f5f9] hover:bg-[#11121d]'
                    }`}
                  >
                    {h}
                  </button>
                ))}
              </div>

              {/* Minutes Column */}
              <div className="flex-1 overflow-y-auto border border-[#24263b] rounded-lg max-h-36 custom-scrollbar outline-none focus:outline-none bg-[#161726]">
                <div className="text-center text-[9px] font-bold text-[#64748b] py-1 bg-[#11121d] border-b border-[#24263b] sticky top-0 uppercase tracking-wider">Min</div>
                {minutes.map(m => (
                  <button
                    key={`m-${m}`}
                    type="button"
                    onClick={() => handleMinuteSelect(m)}
                    className={`w-full text-center py-1 text-xs font-semibold cursor-pointer border-none select-none transition-colors ${
                      minute === m
                        ? 'bg-[#143c90] text-white font-bold'
                        : 'text-[#64748b] hover:text-[#f1f5f9] hover:bg-[#11121d]'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-between items-center border-t border-[#24263b] pt-3 select-none">
              <button
                type="button"
                onClick={handleClear}
                className="text-[10px] font-bold uppercase tracking-wider text-red-400 bg-red-500/10 hover:bg-red-500 hover:text-white border border-red-500/20 px-3 py-1.5 rounded-lg transition-all"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-[10px] font-bold uppercase tracking-wider text-[#f1f5f9] bg-[#161726] hover:bg-[#1e2035] border border-[#24263b] px-3.5 py-1.5 rounded-lg transition-all"
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
