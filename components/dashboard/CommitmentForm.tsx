'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

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
  checkers: { id: string; email: string }[];
  editingCommitment: Commitment | null;
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
}) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    project: '',
    assignee: currentUserProfile.id,
    checker: currentUserProfile.role === 'manager' ? currentUserProfile.id : (checkers[0]?.id || ''),
    deadline: '',
    status: 'to_check' as CommitmentStatus,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [backendError, setBackendError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset form when opened or when editing commitment changes
  useEffect(() => {
    if (isOpen) {
      if (editingCommitment) {
        // Edit mode - populate form with existing commitment data
        setFormData({
          title: editingCommitment.title,
          description: editingCommitment.description || '',
          project: editingCommitment.project,
          assignee: editingCommitment.assignee_id || currentUserProfile.id,
          checker: editingCommitment.checker_id || (currentUserProfile.role === 'manager' ? currentUserProfile.id : (checkers[0]?.id || '')),
          deadline: editingCommitment.deadline.split('T')[0],
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
          status: 'to_check',
        });
      }
      setErrors({});
      setBackendError(null);
    }
  }, [isOpen, editingCommitment, currentUserProfile.id, checkers, currentUserProfile.role]);

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

    if (!formData.deadline) {
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
      // Prepare data for submission
      const submissionData = {
        title: formData.title,
        description: formData.description,
        project: formData.project,
        assignee_id: formData.assignee,
        checker_id: formData.checker,
        deadline: formData.deadline,
        status: formData.status,
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
          <div className="bg-white rounded-xl shadow-2xl overflow-hidden">
            {/* Header with close button */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
              <h2 className="text-lg font-semibold text-slate-800">
                {editingCommitment ? 'Edit Commitment' : 'Add New Commitment'}
              </h2>
              <button
                onClick={onClose}
                disabled={isSubmitting}
                className="text-slate-400 hover:text-slate-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Close form"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
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
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-slate-500 ${
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
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 resize-none"
                  placeholder="Provide additional details about this commitment"
                />
              </div>

              {/* Project */}
              <div>
                <label htmlFor="project" className="block text-sm font-medium text-slate-700 mb-1">
                  Project <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="project"
                  name="project"
                  value={formData.project}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-slate-500 ${
                    errors.project ? 'border-red-300 focus:ring-red-500' : 'border-slate-300 focus:border-slate-500'
                  }`}
                  placeholder="Enter project name"
                />
                {errors.project && <p className="mt-1 text-sm text-red-600">{errors.project}</p>}
              </div>

              {/* Assignee */}
              <div>
                <label htmlFor="assignee" className="block text-sm font-medium text-slate-700 mb-1">
                  Assignee <span className="text-red-500">*</span>
                </label>
                <select
                  id="assignee"
                  name="assignee"
                  value={formData.assignee}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-slate-500 ${
                    errors.assignee ? 'border-red-300 focus:ring-red-500' : 'border-slate-300 focus:border-slate-500'
                  }`}
                >
                  <option value="">Select Assignee</option>
                  {checkers.map(profile => (
                    <option key={profile.id} value={profile.id}>
                      {profile.email}
                    </option>
                  ))}
                </select>
                {errors.assignee && <p className="mt-1 text-sm text-red-600">{errors.assignee}</p>}
              </div>

              {/* Checker */}
              <div>
                <label htmlFor="checker" className="block text-sm font-medium text-slate-700 mb-1">
                  Checker <span className="text-red-500">*</span>
                </label>
                <select
                  id="checker"
                  name="checker"
                  value={formData.checker}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-slate-500 ${
                    errors.checker ? 'border-red-300 focus:ring-red-500' : 'border-slate-300 focus:border-slate-500'
                  }`}
                >
                  <option value="">Select Checker</option>
                  {checkers.map(checker => (
                    <option key={checker.id} value={checker.id}>
                      {checker.email}
                    </option>
                  ))}
                </select>
                {errors.checker && <p className="mt-1 text-sm text-red-600">{errors.checker}</p>}
              </div>

              {/* Deadline */}
              <div>
                <label htmlFor="deadline" className="block text-sm font-medium text-slate-700 mb-1">
                  Deadline <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  id="deadline"
                  name="deadline"
                  value={formData.deadline}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  min={new Date().toISOString().split('T')[0]}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-slate-500 ${
                    errors.deadline ? 'border-red-300 focus:ring-red-500' : 'border-slate-300 focus:border-slate-500'
                  }`}
                />
                {errors.deadline && <p className="mt-1 text-sm text-red-600">{errors.deadline}</p>}
              </div>

              {/* Status */}
              <div>
                <label htmlFor="status" className="block text-sm font-medium text-slate-700 mb-1">
                  Status
                </label>
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
                >
                  {statusOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Backend error display */}
              {backendError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm text-red-600">{backendError}</p>
                </div>
              )}

              {/* Form actions */}
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="px-4 py-2 text-slate-600 hover:text-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`px-4 py-2 text-white rounded-md transition-colors ${
                    isSubmitting 
                      ? 'bg-slate-400 cursor-not-allowed'
                      : 'bg-slate-700 hover:bg-slate-800'
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