'use client';

import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { FilterProvider } from './FilterContext';

interface DashboardClientWrapperProps {
  children: React.ReactNode;
  currentUserProfile: {
    email: string;
    role: 'manager' | 'member';
    name?: string | null;
  };
  projects: { name: string; description?: string | null }[];
  checkers: { id: string; email: string; name?: string | null }[];
}

export const DashboardClientWrapper: React.FC<DashboardClientWrapperProps> = ({
  children,
  currentUserProfile,
  projects,
  checkers,
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <FilterProvider>
      <div className="flex min-h-[100dvh]">
        <Sidebar
          currentUserProfile={currentUserProfile}
          projects={projects}
          checkers={checkers}
          isMobile={isMobileMenuOpen}
          onToggleMobile={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        />
        <main className="flex-1 p-4 md:p-8 bg-[#0d0e15] min-h-[100dvh] overflow-x-hidden">
          {children}
        </main>
      </div>
    </FilterProvider>
  );
};