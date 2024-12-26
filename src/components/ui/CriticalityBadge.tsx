import React from 'react';
import { getCriticalityStyle } from '../../constants/criticality';

interface CriticalityBadgeProps {
  criticality: string;
}

export function CriticalityBadge({ criticality }: CriticalityBadgeProps) {
  const style = getCriticalityStyle(criticality);

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${style}`}>
      {criticality}
    </span>
  );
}