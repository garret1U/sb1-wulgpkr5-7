import React from 'react';
import { Network, X } from 'lucide-react';
import { PurposeSelect } from '../circuits/PurposeSelect';
import type { Circuit } from '../../types';

interface ProposedCircuitCardProps {
  circuit: Circuit;
  onRemove: () => void;
  onPurposeChange?: (purpose: string) => void;
}

export function ProposedCircuitCard({ circuit, onRemove, onPurposeChange }: ProposedCircuitCardProps) {
  return (
    <div className="p-4 rounded-lg border border-primary bg-primary/5 dark:bg-primary/10">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Network className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h4 className="font-medium text-gray-900 dark:text-gray-100">
              {circuit.carrier}
            </h4>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {circuit.type} - {circuit.bandwidth}
            </p>
          </div>
        </div>

        <button
          onClick={onRemove}
          className="p-1 text-gray-400 hover:text-red-500 rounded-full 
                   hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-3 flex items-center justify-between">
        <PurposeSelect
          circuit={circuit}
          onChange={onPurposeChange}
        />
        <span className="text-sm text-gray-500 dark:text-gray-400">
          ${circuit.monthlycost.toLocaleString()}/mo
        </span>
      </div>
    </div>
  );
}