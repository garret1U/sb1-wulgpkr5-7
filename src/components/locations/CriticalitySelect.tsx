import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateLocation } from '../../lib/api';
import { CRITICALITY_OPTIONS } from '../../constants/criticality';
import { CriticalityBadge } from '../ui/CriticalityBadge';
import { stopPropagation } from '../../lib/events';
import type { Location } from '../../types';

export interface CriticalitySelectProps {
  location?: Location;
  value?: string;
  onChange?: (value: string) => void;
  required?: boolean;
}

export function CriticalitySelect({ location, value, onChange, required }: CriticalitySelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const queryClient = useQueryClient();

  const { mutate } = useMutation({
    mutationFn: (criticality: string) => updateLocation(location!.id, { criticality }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['locations'] });
      setIsOpen(false);
    }
  });

  // If used as a form input
  if (value !== undefined && onChange) {
    return (
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Criticality {required && '*'}
        </label>
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={required}
          className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 
                   bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-gray-100
                   focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        >
          <option value="">Select criticality</option>
          {CRITICALITY_OPTIONS.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    );
  }

  // Original dropdown behavior for location cards
  if (!location) return null;

  const selectedOption = CRITICALITY_OPTIONS.find(opt => opt.value === location.criticality);

  return (
    <div className="relative">
      <button
        onClick={(e) => {
          stopPropagation(e);
          setIsOpen(!isOpen);
        }}
        className="flex items-center space-x-2 hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-primary rounded p-1"
      >
        <CriticalityBadge criticality={location.criticality} />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute z-20 mt-2 w-32 rounded-md shadow-lg bg-white dark:bg-gray-700 ring-1 ring-black ring-opacity-5">
            <div className="py-1" role="menu">
              {CRITICALITY_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={(e) => {
                    stopPropagation(e);
                    mutate(option.value);
                  }}
                  className="flex items-center justify-between w-full px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-600"
                  role="menuitem"
                >
                  <CriticalityBadge criticality={option.value} />
                  {location.criticality === option.value && (
                    <svg className="h-4 w-4 text-primary" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}