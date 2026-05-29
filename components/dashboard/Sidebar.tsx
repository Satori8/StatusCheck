'use client';

import React, { useState } from 'react';
import { useFilter } from './FilterContext';
import { logout } from '@/app/actions/auth';
import { createProject, deleteProject } from '@/app/actions/projects';
import { useRouter } from 'next/navigation';
import { Plus, Trash2, HelpCircle, Check, X } from 'lucide-react';

interface SidebarProps {
  currentUserProfile: {
    email: string;
    role: 'manager' | 'member';
  };
  projects: { name: string; description?: string | null }[];
  checkers: { id: string; email: string }[];
  isMobile: boolean;
  onToggleMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentUserProfile,
  projects,
  checkers,
  isMobile,
  onToggleMobile,
}) => {
  const router = useRouter();
  const { selectedProject, setSelectedProject, selectedCheckerId, setSelectedCheckerId } = useFilter();
  
  // Project creation form states
  const [showAddForm, setShowAddForm] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDesc, setNewProjectDesc] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const handleAddProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;
    
    setIsSubmitting(true);
    setFormError(null);
    
    const result = await createProject(newProjectName.trim(), newProjectDesc.trim() || undefined);
    
    setIsSubmitting(false);
    if (result.error) {
      setFormError(result.error);
    } else {
      setNewProjectName('');
      setNewProjectDesc('');
      setShowAddForm(false);
      router.refresh();
    }
  };

  const handleDeleteProject = async (name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(`Are you sure you want to delete project "${name}"?`)) return;
    
    const result = await deleteProject(name);
    if (result.error) {
      alert(result.error);
    } else {
      if (selectedProject === name) {
        setSelectedProject(null);
      }
      router.refresh();
    }
  };

  return (
    <>
      {/* Mobile Menu Toggle */}
      <button
        onClick={onToggleMobile}
        className="fixed top-4 left-4 z-40 md:hidden p-2 bg-slate-800 text-white rounded-md shadow-md hover:bg-slate-700 transition-colors"
        aria-label="Toggle menu"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Sidebar Container */}
      <aside
        className={`fixed inset-y-0 left-0 z-30 w-72 bg-slate-100 border-r border-slate-200 transform transition-transform duration-200 ease-in-out md:translate-x-0 ${
          isMobile ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="p-6 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-white font-bold text-lg">
              S
            </div>
            <div>
              <h2 className="font-bold text-slate-800 text-lg leading-tight">Status Check</h2>
              <p className="text-xs text-slate-500 font-mono">MVP v1.0.0</p>
            </div>
          </div>
        </div>

        {/* User Profile */}
        <div className="p-6 border-b border-slate-200">
          <div className="space-y-2">
            <p className="text-sm font-medium text-slate-600">Signed in as</p>
            <p className="text-slate-800 truncate font-semibold">{currentUserProfile.email}</p>
            <div
              className={`inline-block px-2.5 py-0.5 text-xs font-semibold rounded-full border ${
                currentUserProfile.role === 'manager'
                  ? 'border-amber-300 text-amber-700 bg-amber-50'
                  : 'border-emerald-300 text-emerald-700 bg-emerald-50'
              }`}
            >
              {currentUserProfile.role.charAt(0).toUpperCase() + currentUserProfile.role.slice(1)}
            </div>
          </div>
        </div>

        {/* Projects Filter */}
        <div className="p-6 border-b border-slate-200 max-h-[40vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold text-slate-500 tracking-wider uppercase">Projects</h3>
            {currentUserProfile.role === 'manager' && (
              <button
                onClick={() => setShowAddForm(!showAddForm)}
                className="p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-200 rounded-md transition-colors border-0 bg-transparent"
                title="Create Project"
              >
                {showAddForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              </button>
            )}
          </div>

          {/* Project creation inline form */}
          {showAddForm && (
            <form onSubmit={handleAddProject} className="mb-4 p-3 bg-white border border-slate-200 rounded-lg space-y-2 fade-in">
              <input
                type="text"
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                placeholder="Project Name"
                disabled={isSubmitting}
                className="w-full text-xs px-2 py-1.5 border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-slate-500"
                required
              />
              <input
                type="text"
                value={newProjectDesc}
                onChange={(e) => setNewProjectDesc(e.target.value)}
                placeholder="Description (Optional)"
                disabled={isSubmitting}
                className="w-full text-xs px-2 py-1.5 border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-slate-500"
              />
              {formError && <p className="text-[10px] text-red-600">{formError}</p>}
              <div className="flex justify-end space-x-1.5">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-2 py-1 text-[10px] text-slate-500 hover:bg-slate-100 rounded border border-slate-200 bg-transparent"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-2 py-1 text-[10px] bg-slate-700 hover:bg-slate-800 text-white rounded border border-slate-700 flex items-center space-x-1"
                >
                  <Check className="w-3 h-3" />
                  <span>Save</span>
                </button>
              </div>
            </form>
          )}

          <div className="space-y-1">
            <button
              onClick={() => setSelectedProject(null)}
              className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                selectedProject === null
                  ? 'bg-slate-700 text-white font-medium shadow-sm'
                  : 'bg-transparent text-slate-700 hover:bg-slate-200'
              }`}
            >
              All Projects
            </button>
            {projects.map((project) => (
              <div
                key={project.name}
                className={`group flex items-center justify-between px-3 py-2 rounded-md text-sm transition-colors ${
                  selectedProject === project.name
                    ? 'bg-slate-700 text-white font-medium shadow-sm'
                    : 'hover:bg-slate-200'
                }`}
                onClick={() => setSelectedProject(project.name)}
                style={{ cursor: 'pointer' }}
              >
                <span className={`truncate flex-1 ${selectedProject === project.name ? 'text-white' : 'text-slate-700'}`}>
                  {project.name}
                </span>
                
                <div className="flex items-center space-x-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  {project.description && (
                    <div className="relative inline-block" title={project.description}>
                      <HelpCircle className={`w-3.5 h-3.5 ${selectedProject === project.name ? 'text-slate-300 hover:text-white' : 'text-slate-400 hover:text-slate-600'}`} />
                    </div>
                  )}
                  {currentUserProfile.role === 'manager' && (
                    <button
                      onClick={(e) => handleDeleteProject(project.name, e)}
                      className={`p-0.5 rounded border-0 bg-transparent transition-colors ${
                        selectedProject === project.name
                          ? 'text-slate-300 hover:text-red-300 hover:bg-slate-600'
                          : 'text-slate-400 hover:text-red-600 hover:bg-slate-300'
                      }`}
                      title="Delete Project"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Checkers Filter */}
        <div className="p-6 border-b border-slate-200 max-h-[30vh] overflow-y-auto">
          <h3 className="text-xs font-bold text-slate-500 tracking-wider uppercase mb-3">Checkers</h3>
          <div className="space-y-1">
            <button
              onClick={() => setSelectedCheckerId(null)}
              className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                selectedCheckerId === null
                  ? 'bg-slate-700 text-white font-medium shadow-sm'
                  : 'bg-transparent text-slate-700 hover:bg-slate-200'
              }`}
            >
              All Checkers
            </button>
            {checkers.map((checker) => (
              <button
                key={checker.id}
                onClick={() => setSelectedCheckerId(checker.id)}
                className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                  selectedCheckerId === checker.id
                    ? 'bg-slate-700 text-white font-medium shadow-sm'
                    : 'bg-transparent text-slate-700 hover:bg-slate-200'
                }`}
              >
                {checker.email}
              </button>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 absolute bottom-0 w-full bg-slate-100 border-t border-slate-200/55">
          <button
            className="w-full px-4 py-2.5 bg-slate-700 text-white rounded-lg hover:bg-slate-800 transition-colors text-sm font-medium shadow-sm"
            onClick={async () => {
              await logout();
            }}
          >
            Sign Out
          </button>
        </div>
      </aside>
    </>
  );
};
