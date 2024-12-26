export const PURPOSE_OPTIONS = [
  { value: 'Primary', label: 'Primary', style: 'bg-primary/10 text-primary' },
  { value: 'Secondary', label: 'Secondary', style: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-200' },
  { value: 'Backup', label: 'Backup', style: 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-200' }
] as const;

export type CircuitPurpose = typeof PURPOSE_OPTIONS[number]['value'];

export function getPurposeStyle(purpose: string): string {
  return PURPOSE_OPTIONS.find(p => p.value === purpose)?.style || 
         'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-200';
}