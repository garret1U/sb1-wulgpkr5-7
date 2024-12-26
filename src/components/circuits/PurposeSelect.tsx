import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateCircuit } from '../../lib/api';
import { PURPOSE_OPTIONS } from '../../constants/purposes';
import type { Circuit } from '../../types';
import { stopPropagation } from '../../lib/events';

export interface PurposeSelectProps {
  circuit: Circuit;
  value?: string;
  onChange?: (value: string) => void;
  required?: boolean;
}

export function PurposeSelect({ circuit, value, onChange, required }: PurposeSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const queryClient = useQueryClient();

  const { mutate } = useMutation({
    mutationFn: (purpose: string) => updateCircuit(circuit.id, { purpose }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['circuits'] });
      setIsOpen(false);
    }
  });

  // If used as a form input
  if (value !== undefined && onChange) {
    return (
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Purpose {required && '*'}
        </label>
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={required}
          className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 
                   bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-gray-100
                   focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        >
          <option value="">Select purpose</option>
          {PURPOSE_OPTIONS.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    );
  }

  // Original dropdown behavior for circuit cards
  return (
    <div className="relative">
      <button
        onClick={(e) => {
          stopPropagation(e);
          setIsOpen(!isOpen);
        }}
        className="text-gray-900 dark:text-gray-100 hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary rounded"
      >
        {circuit.purpose}
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute z-20 mt-2 w-32 rounded-md shadow-lg bg-white dark:bg-gray-700 ring-1 ring-black ring-opacity-5">
            <div className="py-1" role="menu">
              {PURPOSE_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={(e) => {
                    stopPropagation(e);
                    mutate(option.value);
                  }}
                  className={`
                    ${circuit.purpose === option.value ? 'bg-gray-100 dark:bg-gray-600' : ''}
                    block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200
                    hover:bg-gray-100 dark:hover:bg-gray-600
                  `}
                  role="menuitem"
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}