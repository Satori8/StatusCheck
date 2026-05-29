import React, { createContext, useContext, useState, ReactNode } from 'react';

interface FilterContextType {
  selectedProject: string | null;
  selectedCheckerId: string | null;
  searchQuery: string;
  setSelectedProject: (project: string | null) => void;
  setSelectedCheckerId: (checkerId: string | null) => void;
  setSearchQuery: (query: string) => void;
}

const FilterContext = createContext<FilterContextType | undefined>(undefined);

export const FilterProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [selectedCheckerId, setSelectedCheckerId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');

  return (
    <FilterContext.Provider
      value={
        {
          selectedProject,
          selectedCheckerId,
          searchQuery,
          setSelectedProject,
          setSelectedCheckerId,
          setSearchQuery,
        }
      }
    >
      {children}
    </FilterContext.Provider>
  );
};

export const useFilter = (): FilterContextType => {
  const context = useContext(FilterContext);
  if (context === undefined) {
    throw new Error('useFilter must be used within a FilterProvider');
  }
  return context;
};