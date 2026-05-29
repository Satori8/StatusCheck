import React from 'react';
import { useFilter } from './FilterContext';

interface SearchInputProps {
  placeholder?: string;
  className?: string;
}

export const SearchInput: React.FC<SearchInputProps> = ({
  placeholder = 'Search...',
  className = '',
}) => {
  const { searchQuery, setSearchQuery } = useFilter();

  return (
    <div className={`relative ${className}`}>
      <input
        type="text"
        placeholder={placeholder}
        className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent w-full"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
      />
      <svg
        className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    </div>
  );
};