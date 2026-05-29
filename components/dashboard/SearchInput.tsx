'use client';

import React from 'react';
import { useFilter } from './FilterContext';
import { MagnifyingGlass } from '@phosphor-icons/react';

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
        className="pl-10 pr-4 py-2.5 bg-[#161726] border border-[#24263b] text-[#f1f5f9] placeholder-[#64748b] rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/40 text-sm w-full transition-all"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
      />
      <MagnifyingGlass
        size={18}
        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#64748b]"
      />
    </div>
  );
};
