'use client';

import React, { useState } from 'react';
import { useFilter } from './FilterContext';
import { logout } from '@/app/actions/auth';
import { createProject, deleteProject, updateProject } from '@/app/actions/projects';
import { useRouter } from 'next/navigation';
import { Plus, Trash, X, PencilSimple, Info, SignOut, List } from '@phosphor-icons/react';
import { motion, AnimatePresence } from 'framer-motion';

interface SidebarProps {
  currentUserProfile: {
    email: string;
    role: 'manager' | 'member';
    name?: string | null;
  };
  projects: { name: string; description?: string | null }[];
  checkers: { id: string; email: string; name?: string | null }[];
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
  
  // Project creation states
  const [showAddForm, setShowAddForm] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDesc, setNewProjectDesc] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Project details / editing modal states
  const [selectedDetailProject, setSelectedDetailProject] = useState<{ name: string; description?: string | null } | null>(null);
  const [isEditingProject, setIsEditingProject] = useState(false);
  const [editProjectName, setEditProjectName] = useState('');
  const [editProjectDesc, setEditProjectDesc] = useState('');
  const [editProjectError, setEditProjectError] = useState<string | null>(null);

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

  const handleDeleteProject = async (name: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!confirm(`Are you sure you want to delete project "${name}"? All tasks assigned to this project will remain but the project categorization will be removed.`)) return;
    
    const result = await deleteProject(name);
    if (result.error) {
      alert(result.error);
    } else {
      if (selectedProject === name) {
        setSelectedProject(null);
      }
      setSelectedDetailProject(null);
      router.refresh();
    }
  };

  const handleSaveProjectEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDetailProject || !editProjectName.trim()) return;

    setIsSubmitting(true);
    setEditProjectError(null);

    const result = await updateProject(
      selectedDetailProject.name,
      editProjectName.trim(),
      editProjectDesc.trim() || undefined
    );

    setIsSubmitting(false);
    if (result.error) {
      setEditProjectError(result.error);
    } else {
      if (selectedProject === selectedDetailProject.name) {
        setSelectedProject(editProjectName.trim());
      }
      setSelectedDetailProject(null);
      setIsEditingProject(false);
      router.refresh();
    }
  };

  const openProjectDetails = (project: { name: string; description?: string | null }, editMode = false) => {
    setSelectedDetailProject(project);
    setEditProjectName(project.name);
    setEditProjectDesc(project.description || '');
    setIsEditingProject(editMode && currentUserProfile.role === 'manager');
  };

  return (
    <>
      {/* Mobile Menu Toggle */}
      <button
        onClick={onToggleMobile}
        className="fixed top-4 left-4 z-40 md:hidden p-2.5 bg-[#161726] border border-[#24263b] text-[#f1f5f9] rounded-xl shadow-lg hover:bg-[#1b1d30] hover:text-white transition-all active:scale-95 duration-200"
        aria-label="Toggle menu"
      >
        <List size={20} weight="bold" />
      </button>

      {/* Sidebar Container */}
      <aside
        className={`fixed inset-y-0 left-0 z-30 w-72 bg-[#11121d] border-r border-[#24263b] transform transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] md:translate-x-0 ${
          isMobile ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="p-6 border-b border-[#24263b] bg-[#0d0e15]/40">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 font-bold text-sm shadow-inner">
              SC
            </div>
            <div>
              <h2 className="font-bold text-[#f1f5f9] text-sm tracking-wide leading-tight">Status Check</h2>
              <p className="text-[10px] text-[#64748b] font-mono tracking-wider">MVP v1.0.0</p>
            </div>
          </div>
        </div>

        {/* User Profile */}
        <div className="p-6 border-b border-[#24263b] bg-[#0d0e15]/20">
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              {/* Concentric Squircle Avatar Wrapper */}
              <div className="p-0.5 bg-gradient-to-tr from-[#24263b] to-blue-500/30 rounded-xl">
                <div className="w-10 h-10 rounded-[calc(0.75rem-2px)] bg-[#161726] border border-[#24263b] flex items-center justify-center text-xs font-mono font-bold text-[#f1f5f9]">
                  {currentUserProfile.name ? currentUserProfile.name.slice(0, 2).toUpperCase() : currentUserProfile.email.slice(0, 2).toUpperCase()}
                </div>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-[#64748b] tracking-wider uppercase">Account</p>
                <p className="text-sm text-[#f1f5f9] font-medium truncate leading-tight">
                  {currentUserProfile.name || currentUserProfile.email}
                </p>
              </div>
            </div>

            <div
              className={`inline-flex items-center px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-widest rounded-full border ${
                currentUserProfile.role === 'manager'
                  ? 'border-amber-500/20 text-amber-400 bg-amber-500/5'
                  : 'border-emerald-500/20 text-emerald-400 bg-emerald-500/5'
              }`}
            >
              <div className={`w-1 h-1 rounded-full mr-1.5 ${currentUserProfile.role === 'manager' ? 'bg-amber-400' : 'bg-emerald-400'}`} />
              {currentUserProfile.role}
            </div>
          </div>
        </div>

        {/* Navigation / Filters Area */}
        <div className="flex-1 py-4 overflow-y-auto max-h-[calc(100vh-270px)] space-y-6">
          {/* Projects Filter */}
          <div className="px-4">
            <div className="flex items-center justify-between px-2 mb-2">
              <h3 className="text-[10px] font-bold text-[#64748b] tracking-widest uppercase">Projects</h3>
              {currentUserProfile.role === 'manager' && (
                <button
                  onClick={() => {
                    setNewProjectName('');
                    setNewProjectDesc('');
                    setFormError(null);
                    setShowAddForm(true);
                  }}
                  className="p-1 text-[#64748b] hover:text-[#f1f5f9] hover:bg-[#161726] rounded-md transition-colors border-0 bg-transparent"
                  title="Create Project"
                >
                  <Plus size={14} weight="bold" />
                </button>
              )}
            </div>

            <div className="space-y-1">
              <button
                onClick={() => setSelectedProject(null)}
                className={`w-full flex items-center px-3 py-2 rounded-xl text-xs font-medium tracking-wide transition-all border-0 ${
                  selectedProject === null
                    ? 'bg-blue-500/10 border border-blue-500/20 text-blue-400 font-semibold shadow-sm'
                    : 'bg-transparent text-[#64748b] hover:text-[#f1f5f9] hover:bg-[#161726]/50'
                }`}
              >
                All Projects
              </button>
              {projects.map((project) => (
                <div
                  key={project.name}
                  className={`group flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                    selectedProject === project.name
                      ? 'bg-blue-500/10 border border-blue-500/20 text-blue-400 font-semibold'
                      : 'text-[#64748b] hover:text-[#f1f5f9] hover:bg-[#161726]/50'
                  }`}
                  onClick={() => {
                    if (selectedProject === project.name) {
                      openProjectDetails(project);
                    } else {
                      setSelectedProject(project.name);
                    }
                  }}
                  onDoubleClick={() => openProjectDetails(project)}
                  style={{ cursor: 'pointer' }}
                >
                  <span className="truncate flex-1 mr-2">{project.name}</span>
                  
                  <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openProjectDetails(project, currentUserProfile.role === 'manager');
                      }}
                      className={`p-1 rounded border-0 bg-transparent transition-colors ${
                        selectedProject === project.name
                          ? 'text-blue-400/80 hover:text-blue-300 hover:bg-[#161726]'
                          : 'text-[#64748b] hover:text-[#f1f5f9] hover:bg-[#161726]'
                      }`}
                      title={currentUserProfile.role === 'manager' ? 'Edit Project' : 'Project Details'}
                    >
                      {currentUserProfile.role === 'manager' ? <PencilSimple size={12} weight="bold" /> : <Info size={12} weight="bold" />}
                    </button>
                    {currentUserProfile.role === 'manager' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteProject(project.name, e);
                        }}
                        className={`p-1 rounded border-0 bg-transparent transition-colors ${
                          selectedProject === project.name
                            ? 'text-red-400 hover:text-red-300 hover:bg-[#161726]'
                            : 'text-[#64748b] hover:text-red-500 hover:bg-[#161726]'
                        }`}
                        title="Delete Project"
                      >
                        <Trash size={12} weight="bold" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Checkers Filter */}
          <div className="px-4">
            <h3 className="text-[10px] font-bold text-[#64748b] tracking-widest uppercase px-2 mb-2">Checkers</h3>
            <div className="space-y-1">
              <button
                onClick={() => setSelectedCheckerId(null)}
                className={`w-full flex items-center px-3 py-2 rounded-xl text-xs font-medium tracking-wide transition-all border-0 ${
                  selectedCheckerId === null
                    ? 'bg-blue-500/10 border border-blue-500/20 text-blue-400 font-semibold shadow-sm'
                    : 'bg-transparent text-[#64748b] hover:text-[#f1f5f9] hover:bg-[#161726]/50'
                }`}
              >
                All Checkers
              </button>
              {checkers.map((checker) => (
                <button
                  key={checker.id}
                  onClick={() => setSelectedCheckerId(checker.id)}
                  className={`w-full flex items-center px-3 py-2 rounded-xl text-xs font-medium transition-all border-0 ${
                    selectedCheckerId === checker.id
                      ? 'bg-blue-500/10 border border-blue-500/20 text-blue-400 font-semibold'
                      : 'bg-transparent text-[#64748b] hover:text-[#f1f5f9] hover:bg-[#161726]/50'
                  }`}
                >
                  <span className="truncate">{checker.name || checker.email}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-[#24263b] bg-[#0d0e15]/40 absolute bottom-0 w-full">
          <button
            className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl hover:bg-red-500 hover:text-white transition-all active:scale-[0.98] duration-200 text-xs font-bold uppercase tracking-wider shadow-sm"
            onClick={async () => {
              await logout();
            }}
          >
            <SignOut size={14} weight="bold" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Floating Project View/Edit Modal Overlay */}
      <AnimatePresence>
        {selectedDetailProject && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-[#050508]/60 backdrop-blur-md p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="w-full max-w-md bg-[#11121d] border border-[#24263b] rounded-2xl shadow-2xl overflow-hidden"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-[#24263b] bg-[#0d0e15]/40">
                <h3 className="font-bold text-[#f1f5f9] text-xs uppercase tracking-widest">
                  {isEditingProject ? 'Edit Project' : 'Project Details'}
                </h3>
                <button
                  onClick={() => setSelectedDetailProject(null)}
                  className="text-[#64748b] hover:text-[#f1f5f9] transition-colors p-1.5 hover:bg-[#161726] rounded-full border border-[#24263b] flex items-center justify-center bg-transparent active:scale-95 duration-200"
                >
                  <X size={14} weight="bold" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 space-y-4">
                {isEditingProject ? (
                  <form onSubmit={handleSaveProjectEdit} className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-bold text-[#64748b] tracking-wider uppercase mb-1.5">
                        Project Name
                      </label>
                      <input
                        type="text"
                        value={editProjectName}
                        onChange={(e) => setEditProjectName(e.target.value)}
                        disabled={isSubmitting}
                        required
                        className="w-full bg-[#161726] border border-[#24263b] text-[#f1f5f9] rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-[#64748b] tracking-wider uppercase mb-1.5">
                        Description
                      </label>
                      <textarea
                        value={editProjectDesc}
                        onChange={(e) => setEditProjectDesc(e.target.value)}
                        disabled={isSubmitting}
                        rows={3}
                        className="w-full bg-[#161726] border border-[#24263b] text-[#f1f5f9] rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 resize-none"
                      />
                    </div>

                    {editProjectError && (
                      <p className="text-xs text-red-400 bg-red-500/5 border border-red-500/10 p-2.5 rounded-xl">
                        {editProjectError}
                      </p>
                    )}

                    <div className="flex space-x-3 pt-2">
                      <button
                        type="button"
                        onClick={() => setIsEditingProject(false)}
                        className="flex-1 px-4 py-2.5 bg-[#161726] border border-[#24263b] text-[#64748b] hover:text-[#f1f5f9] hover:bg-[#1b1d30] rounded-xl transition-colors text-xs font-bold uppercase tracking-wider"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="flex-1 px-4 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-xl transition-all active:scale-[0.98] duration-200 text-xs font-bold uppercase tracking-wider shadow-sm"
                      >
                        {isSubmitting ? 'Saving...' : 'Save Changes'}
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-[10px] font-bold text-[#64748b] tracking-wider uppercase mb-1">
                        Project Name
                      </h4>
                      <p className="text-sm font-semibold text-[#f1f5f9]">{selectedDetailProject.name}</p>
                    </div>
                    <div>
                      <h4 className="text-[10px] font-bold text-[#64748b] tracking-wider uppercase mb-1">
                        Description
                      </h4>
                      <p className="text-sm text-[#f1f5f9] leading-relaxed break-words whitespace-pre-wrap bg-[#161726]/40 p-3 rounded-xl border border-[#24263b]">
                        {selectedDetailProject.description || (
                          <span className="text-[#64748b] italic">No description provided</span>
                        )}
                      </p>
                    </div>

                    <div className="flex space-x-3 pt-2">
                      {currentUserProfile.role === 'manager' && (
                        <>
                          <button
                            onClick={() => setIsEditingProject(true)}
                            className="flex-1 px-4 py-2.5 bg-[#161726] border border-[#24263b] text-[#f1f5f9] hover:bg-[#1b1d30] rounded-xl transition-colors text-xs font-bold uppercase tracking-wider"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteProject(selectedDetailProject.name)}
                            className="px-4 py-2.5 bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500 hover:text-white rounded-xl transition-all text-xs font-bold uppercase tracking-wider"
                          >
                            Delete
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => setSelectedDetailProject(null)}
                        className={`px-4 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-xl transition-all text-xs font-bold uppercase tracking-wider ${
                          currentUserProfile.role === 'manager' ? 'w-auto' : 'w-full'
                        }`}
                      >
                        Close
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Project Add Modal Overlay */}
      <AnimatePresence>
        {showAddForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-[#050508]/60 backdrop-blur-md p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="w-full max-w-md bg-[#11121d] border border-[#24263b] rounded-2xl shadow-2xl overflow-hidden"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-[#24263b] bg-[#0d0e15]/40">
                <h3 className="font-bold text-[#f1f5f9] text-xs uppercase tracking-widest">
                  Create New Project
                </h3>
                <button
                  onClick={() => setShowAddForm(false)}
                  className="text-[#64748b] hover:text-[#f1f5f9] transition-colors p-1.5 hover:bg-[#161726] rounded-full border border-[#24263b] flex items-center justify-center bg-transparent active:scale-95 duration-200"
                >
                  <X size={14} weight="bold" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6">
                <form onSubmit={handleAddProject} className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold text-[#64748b] tracking-wider uppercase mb-1.5">
                      Project Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={newProjectName}
                      onChange={(e) => setNewProjectName(e.target.value)}
                      disabled={isSubmitting}
                      required
                      placeholder="e.g. Q4 Growth"
                      className="w-full bg-[#161726] border border-[#24263b] text-[#f1f5f9] rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-[#64748b] tracking-wider uppercase mb-1.5">
                      Description
                    </label>
                    <textarea
                      value={newProjectDesc}
                      onChange={(e) => setNewProjectDesc(e.target.value)}
                      disabled={isSubmitting}
                      rows={3}
                      placeholder="e.g. Commitment tracking for our quarterly OKRs"
                      className="w-full bg-[#161726] border border-[#24263b] text-[#f1f5f9] rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 resize-none"
                    />
                  </div>

                  {formError && (
                    <p className="text-xs text-red-400 bg-red-500/5 border border-red-500/10 p-2.5 rounded-xl">
                      {formError}
                    </p>
                  )}

                  <div className="flex space-x-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowAddForm(false)}
                      className="flex-1 px-4 py-2.5 bg-[#161726] border border-[#24263b] text-[#64748b] hover:text-[#f1f5f9] hover:bg-[#1b1d30] rounded-xl transition-colors text-xs font-bold uppercase tracking-wider"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex-1 px-4 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-xl transition-all active:scale-[0.98] duration-200 text-xs font-bold uppercase tracking-wider shadow-sm"
                    >
                      {isSubmitting ? 'Creating...' : 'Create Project'}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
