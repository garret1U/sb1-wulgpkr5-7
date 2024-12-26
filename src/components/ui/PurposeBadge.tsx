import React from 'react';
import { getPurposeStyle } from '../../constants/purposes';

interface PurposeBadgeProps {
  purpose: string;
}

export function PurposeBadge({ purpose }: PurposeBadgeProps) {
  const style = getPurposeStyle(purpose);

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${style}`}>
      {purpose}
    </span>
  );
}