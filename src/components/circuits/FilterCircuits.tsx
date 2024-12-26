import React from 'react';
import { Filter } from 'lucide-react';
import { PurposeSelect } from './PurposeSelect';
import type { CircuitFilter } from '../../types/filters';

interface FilterCircuitsProps {
  filter: CircuitFilter;
  onChange: (filter: CircuitFilter) => void;
  onClear: () => void;
}

export function FilterCircuits({ filter, onChange, onClear }: FilterCircuitsProps) {
  const handlePurposeChange = (purpose: string) => {
    onChange({ ...filter, purpose });
  };

  return (
    <div className="flex items-center space-x-4">
      <div className="flex items-center space-x-2">
        <Filter className="h-4 w-4 text-gray-400" />
        <PurposeSelect
          value={filter.purpose}
          onChange={handlePurposeChange}
          placeholder="Filter by Purpose"
          required={false}
        />
      </div>
      
      <select
        value={filter.type}
        onChange={(e) => onChange({ ...filter, type: e.target.value as CircuitFilter['type'] })}
        className="rounded-md border border-gray-300 dark:border-gray-600 
                 bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-gray-100
                 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
      >
        <option value="all">All Changes</option>
        <option value="added">Added Only</option>
        <option value="removed">Removed Only</option>
        <option value="modified">Modified Only</option>
      </select>

      {(filter.purpose || filter.type !== 'all') && (
        <button
          onClick={onClear}
          className="px-2 py-1 text-sm text-gray-500 hover:text-gray-700 
                   dark:text-gray-400 dark:hover:text-gray-200"
        >
          Clear Filters
        </button>
      )}
    </div>
  );
}