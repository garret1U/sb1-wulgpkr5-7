export const CRITICALITY_OPTIONS = [
  { value: 'High', label: 'High', style: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-200' },
  { value: 'Medium', label: 'Medium', style: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-200' },
  { value: 'Low', label: 'Low', style: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-200' }
] as const;

export type LocationCriticality = typeof CRITICALITY_OPTIONS[number]['value'];

export function getCriticalityStyle(criticality: string): string {
  return CRITICALITY_OPTIONS.find(c => c.value === criticality)?.style || 
         'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-200';
}