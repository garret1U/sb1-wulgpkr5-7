import React from 'react';
import { Plus, Minus, RefreshCw, DollarSign } from 'lucide-react';
import { debounce } from 'lodash';
import { exportDifferencesAsCSV, exportDifferencesAsExcel } from '../../utils/exportUtils';
import { useLocationCircuits } from '../../hooks/useCircuits';
import { useNotification } from '../../contexts/NotificationContext';
import { usePermissions } from '../../contexts/PermissionsContext';
import { FilterCircuits } from './FilterCircuits';
import type { CircuitFilter } from '../../types/filters';
import { useCircuitComparison, calculateCostImpact, formatDifference } from '../../utils/circuitUtils';
import { filterCircuits, sortCircuits } from '../../utils/filterUtils';
import type { Circuit } from '../../types';

interface CircuitDifferencesProps {
  proposalId: string;
  locationId: string;
}

export function CircuitDifferences({ proposalId, locationId }: CircuitDifferencesProps) {
  const { canModifyCircuits } = usePermissions();
  const { showNotification } = useNotification();
  const { activeCircuits, proposedCircuits, isLoading, isError } = useLocationCircuits(proposalId, locationId);
  const [filter, setFilter] = React.useState<CircuitFilter>({
    search: '',
    type: 'all',
    purpose: ''
  });
  const [sort, setSort] = React.useState({
    field: 'carrier' as const,
    direction: 'asc' as const
  });

  // Get comparison data
  const comparison = useCircuitComparison(activeCircuits, proposedCircuits);

  const filteredComparison = React.useMemo(() => {
    let result = filterCircuits(comparison, filter);
    return sortCircuits(result, sort);
  }, [comparison, filter, sort]);

  // Calculate cost impact
  const { monthlyImpact, oneTimeImpact } = React.useMemo(() => 
    calculateCostImpact(filteredComparison),
    [filteredComparison]
  );

  // Debounced search handler
  const handleSearch = React.useMemo(
    () => debounce((value: string) => {
      setFilter(prev => ({ ...prev, search: value }));
    }, 300),
    []
  );

  if (isLoading) {
    return (
      <div className="flex justify-center p-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-red-500 dark:text-red-400 p-4 text-center">
        Error loading circuit data
      </div>
    );
  }
  const handleExport = (format: 'csv' | 'excel') => {
    try {
      if (format === 'csv') {
        exportDifferencesAsCSV(filteredComparison);
      } else {
        exportDifferencesAsExcel(filteredComparison);
      }
      showNotification({
        type: 'success',
        message: `Differences exported as ${format.toUpperCase()}`
      });
    } catch (error) {
      showNotification({
        type: 'error',
        message: `Failed to export differences as ${format.toUpperCase()}`
      });
    }
  };

  return (
    <div className="space-y-4">
      {/* Search and Export Controls */}
      <div className="flex justify-between items-center">
        <FilterCircuits
          filter={filter}
          onChange={setFilter}
          onClear={() => setFilter({ type: 'all', search: '', purpose: '' })}
        />
        <div className="relative flex-grow mr-4">
          <input
            type="text"
            placeholder="Search circuits..."
            className="w-full pl-8 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            onChange={(e) => handleSearch(e.target.value)}
          />
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => handleExport('csv')}
            className="flex items-center space-x-1 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm"
          >
            <span>Export CSV</span>
          </button>
          <button
            onClick={() => handleExport('excel')}
            className="flex items-center space-x-1 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm"
          >
            <DollarSign className="h-4 w-4" />
            <span>Export Excel</span>
          </button>
        </div>
      </div>

      {/* Changes List */}
      <div className="space-y-6">
        {/* Added Circuits */}
        {filteredComparison.added?.length > 0 && (
          <div>
            <h4 className="flex items-center space-x-2 text-green-600 dark:text-green-400 font-medium mb-2">
              <Plus className="h-4 w-4" />
              <span>Added Circuits</span>
            </h4>
            <div className="space-y-2">
              {filteredComparison.added.map(circuit => (
                <div
                  key={circuit.id}
                  className="p-3 rounded-lg border border-green-200 dark:border-green-900/50 
                             bg-green-50 dark:bg-green-900/20"
                >
                  <div className="font-medium text-gray-900 dark:text-gray-100">
                    {circuit.carrier} - {circuit.type}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-300">
                    {circuit.bandwidth} - ${circuit.monthlycost.toLocaleString()}/mo
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Removed Circuits */}
        {filteredComparison.removed?.length > 0 && (
          <div>
            <h4 className="flex items-center space-x-2 text-red-600 dark:text-red-400 font-medium mb-2">
              <Minus className="h-4 w-4" />
              <span>Removed Circuits</span>
            </h4>
            <div className="space-y-2">
              {filteredComparison.removed.map(circuit => (
                <div
                  key={circuit.id}
                  className="p-3 rounded-lg border border-red-200 dark:border-red-900/50 
                             bg-red-50 dark:bg-red-900/20"
                >
                  <div className="font-medium text-gray-900 dark:text-gray-100">
                    {circuit.carrier} - {circuit.type}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-300">
                    {circuit.bandwidth} - ${circuit.monthlycost.toLocaleString()}/mo
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Modified Circuits */}
        {filteredComparison.modified?.length > 0 && (
          <div>
            <h4 className="flex items-center space-x-2 text-yellow-600 dark:text-yellow-400 font-medium mb-2">
              <RefreshCw className="h-4 w-4" />
              <span>Modified Circuits</span>
            </h4>
            <div className="space-y-2">
              {filteredComparison.modified.map(({ circuit, differences }) => (
                <div
                  key={circuit.id}
                  className="p-3 rounded-lg border border-yellow-200 dark:border-yellow-900/50 
                             bg-yellow-50 dark:bg-yellow-900/20"
                >
                  <div className="font-medium text-gray-900 dark:text-gray-100">
                    {circuit.carrier} - {circuit.type}
                  </div>
                  <div className="mt-2 space-y-1">
                    {differences.map((diff, index) => (
                      <div key={index} className="text-sm text-gray-600 dark:text-gray-300">
                        {formatDifference(diff)}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}