import React from 'react';
import { useFilter } from './FilterContext';
import { logout } from '@/app/actions/auth';

interface SidebarProps {
  currentUserProfile: {
    email: string;
    role: 'manager' | 'member';
  };
  projects: string[];
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
  const {
    selectedProject,
    selectedCheckerId,
    setSelectedProject,
    setSelectedCheckerId,
  } = useFilter();

  return (
    <>
      {/* Mobile Hamburger Menu */}
      {isMobile && (
        <button
          onClick={onToggleMobile}
          className="fixed top-4 left-4 z-40 md:hidden bg-slate-200 hover:bg-slate-300 p-2 rounded-md transition-colors"
          aria-label="Toggle menu"
        >
          <div className="w-5 h-0.5 bg-slate-700 mb-1"></div>
          <div className="w-5 h-0.5 bg-slate-700 mb-1"></div>
          <div className="w-5 h-0.5 bg-slate-700"></div>
        </button>
      )}

      {/* Sidebar Container */}
      <div
        className={`fixed inset-y-0 left-0 z-30 w-72 bg-slate-100 border-r border-slate-200 transform transition-transform duration-200 ease-in-out ${
          isMobile ? '-translate-x-full md:translate-x-0' : 'translate-x-0'
        }`}
      >
        {/* Header */}
        <div className="p-6 border-b border-slate-200">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-slate-700 rounded transform rotate-45"></div>
            <span className="text-xl font-semibold text-slate-800">StatusCheck</span>
          </div>
        </div>

        {/* User Section */}
        <div className="p-6 border-b border-slate-200">
          <div className="space-y-2">
            <p className="text-sm font-medium text-slate-600">Signed in as</p>
            <p className="text-slate-800 truncate">{currentUserProfile.email}</p>
            <div
              className={`inline-block px-2 py-1 text-xs font-medium rounded-full border ${
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
        <div className="p-6 border-b border-slate-200">
          <h3 className="text-sm font-medium text-slate-600 mb-3">PROJECTS</h3>
          <div className="space-y-1">
            <button
              onClick={() => setSelectedProject(null)}
              className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                selectedProject === null
                  ? 'bg-slate-700 text-white'
                  : 'text-slate-700 hover:bg-slate-200'
              }`}
            >
              All Projects
            </button>
            {projects.map((project) => (
              <button
                key={project}
                onClick={() => setSelectedProject(project)}
                className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                  selectedProject === project
                    ? 'bg-slate-700 text-white'
                    : 'text-slate-700 hover:bg-slate-200'
                }`}
              >
                {project}
              </button>
            ))}
          </div>
        </div>

        {/* Checkers Filter */}
        <div className="p-6 border-b border-slate-200">
          <h3 className="text-sm font-medium text-slate-600 mb-3">CHECKERS</h3>
          <div className="space-y-1">
            <button
              onClick={() => setSelectedCheckerId(null)}
              className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                selectedCheckerId === null
                  ? 'bg-slate-700 text-white'
                  : 'text-slate-700 hover:bg-slate-200'
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
                    ? 'bg-slate-700 text-white'
                    : 'text-slate-700 hover:bg-slate-200'
                }`}
              >
                {checker.email}
              </button>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 absolute bottom-0 w-full">
          <button
            className="w-full px-4 py-2 bg-slate-700 text-white rounded-md hover:bg-slate-800 transition-colors text-sm font-medium"
            onClick={async () => {
              await logout();
            }}
          >
            Sign Out
          </button>
        </div>
      </div>

      {/* Overlay for mobile */}
      {isMobile && (
        <div
          className="fixed inset-0 z-20 bg-black bg-opacity-50 md:hidden"
          onClick={onToggleMobile}
        ></div>
      )}
    </>
  );
};