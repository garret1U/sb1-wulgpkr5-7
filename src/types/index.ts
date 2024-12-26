import React, { useState, useMemo } from 'react';
import { MapPin, Plus, Edit2, X, Trash2 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Table } from '../components/ui/Table';
import { GridView } from '../components/ui/GridView';
import { ViewToggle } from '../components/ui/ViewToggle';
import { SearchBar } from '../components/ui/SearchBar';
import { FilterDropdown } from '../components/ui/FilterDropdown';
import { Modal } from '../components/ui/Modal';
import { DeleteConfirmationDialog } from '../components/ui/DeleteConfirmationDialog';
import { LocationForm } from '../components/locations/LocationForm';
import { CriticalitySelect } from '../components/locations/CriticalitySelect';
import { LocationEditForm } from '../components/locations/LocationEditForm';
import { LocationCard } from '../components/locations/LocationCard';
import { getLocations, getCompanies, deleteLocation, getLocationDependencies } from '../lib/api';
import type { Location } from '../types';

export interface Proposal {
  id: string;
  name: string;
  company_id: string;
  status: 'Draft' | 'Pending' | 'Approved' | 'Rejected';
  created_at: string;
  updated_at: string;
  valid_until: string | null;
  notes: string | null;
  created_by: string;
}

export interface ProposalItem {
  id: string;
  proposal_id: string;
  circuit_id: string;
  location_id: string;
  created_at: string;
  updated_at: string;
  monthly_cost: number;
  installation_cost: number;
  term_months: number;
  notes: string | null;
}

// Circuit comparison types
export interface CircuitDifference {
  field: keyof Circuit;
  oldValue: any;
  newValue: any;
}

export interface CircuitComparison {
  added: Circuit[];
  removed: Circuit[];
  modified: Array<{
    circuit: Circuit;
    differences: CircuitDifference[];
  }>;
}

const getColumns = (onEdit: (location: Location) => void, onDelete: (location: Location) => void) => [
  { header: 'Name', accessorKey: 'name' },
  { header: 'Address', accessorKey: 'address' },
  { header: 'City', accessorKey: 'city' },
  { header: 'State', accessorKey: 'state' },
  { header: 'Country', accessorKey: 'country' },
  {
    header: 'Criticality',
    accessorKey: 'criticality',
    cell: (_: string, row: Location) => <CriticalitySelect location={row} />
  },
  { 
    header: 'Company',
    accessorKey: 'company',
    cell: (value: any) => value?.name || 'N/A',
  },
  {
    header: '',
    accessorKey: 'id',
    cell: (_: string, row: Location) => (
      <div className="flex items-center space-x-2">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEdit(row);
          }}
          className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          <Edit2 className="h-4 w-4 text-gray-400 hover:text-primary" />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(row);
          }}
          className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          <Trash2 className="h-4 w-4 text-gray-400 hover:text-red-500" />
        </button>
      </div>
    )
  }
];

export function Locations() {
  const queryClient = useQueryClient();
  const [view, setView] = useState<'grid' | 'table'>('table');
  const [search, setSearch] = useState('');
  const [stateFilter, setStateFilter] = useState('');
  const [cityFilter, setCityFilter] = useState('');
  const [criticalityFilter, setCriticalityFilter] = useState('');
  const [companyFilter, setCompanyFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  const [deletingLocation, setDeletingLocation] = useState<Location | null>(null);
  const [dependencies, setDependencies] = useState<{ id: string; carrier: string; type: string; purpose: string; }[]>([]);

  const hasFilters = search || stateFilter || cityFilter || criticalityFilter || companyFilter;

  const clearFilters = () => {
    setSearch('');
    setStateFilter('');
    setCityFilter('');
    setCriticalityFilter('');
    setCompanyFilter('');
  };
  
  const { data: locations, isLoading } = useQuery({
    queryKey: ['locations', search, stateFilter, cityFilter, criticalityFilter, companyFilter],
    queryFn: () => getLocations({
      search: search ? search.trim() : undefined,
      state: stateFilter,
      city: cityFilter,
      criticality: criticalityFilter,
      company_id: companyFilter
    }),
    keepPreviousData: true
  });

  const { mutate: deleteLocationMutation } = useMutation({
    mutationFn: (id: string) => deleteLocation(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['locations'] });
      setDeletingLocation(null);
    }
  });

  const handleDeleteClick = async (location: Location) => {
    const deps = await getLocationDependencies(location.id);
    setDependencies(deps);
    setDeletingLocation(location);
  };

  const { data: companies } = useQuery({
    queryKey: ['companies'],
    queryFn: getCompanies
  });

  const filters = React.useMemo(() => {
    if (!locations) return { states: [], cities: [] };

    const states = [...new Set(locations.map(l => l.state))].sort().map(state => ({
      value: state,
      label: state
    }));

    const cities = [...new Set(locations.map(l => l.city))].sort().map(city => ({
      value: city,
      label: city
    }));

    return { states, cities };
  }, [locations]);

  const companyOptions = React.useMemo(() => {
    return (companies || []).sort((a, b) => a.name.localeCompare(b.name)).map(company => ({
      value: company.id,
      label: company.name
    })) || [];
  }, [companies]);

  const criticalityOptions = [
    { value: 'High', label: 'High' },
    { value: 'Medium', label: 'Medium' },
    { value: 'Low', label: 'Low' }
  ];
  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <MapPin className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Locations</h1>
            {hasFilters && (
              <button
                onClick={clearFilters}
                className="ml-4 flex items-center space-x-1 px-2 py-1 text-sm text-gray-500 
                         hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 
                         bg-gray-100 dark:bg-gray-700 rounded-md"
              >
                <X className="h-4 w-4" />
                <span>Clear Filters</span>
              </button>
            )}
          </div>
          <div className="flex items-center space-x-4">
            <ViewToggle view={view} onViewChange={setView} />
            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90
                       flex items-center space-x-2"
            >
              <Plus className="h-5 w-5" />
              <span>Add Location</span>
            </button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
          <div className="flex-1">
            <SearchBar
              value={search}
              onChange={setSearch}
              placeholder="Search locations..."
            />
          </div>
          <div className="flex space-x-4">
            <FilterDropdown
              value={stateFilter}
              onChange={setStateFilter}
              options={filters.states}
              label="All States"
            />
            <FilterDropdown
              value={cityFilter}
              onChange={setCityFilter}
              options={filters.cities}
              label="All Cities"
            />
            <FilterDropdown
              value={criticalityFilter}
              onChange={setCriticalityFilter}
              options={criticalityOptions}
              label="All Criticality"
            />
            <FilterDropdown
              value={companyFilter}
              onChange={setCompanyFilter}
              options={companyOptions}
              label="All Companies"
            />
          </div>
        </div>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add New Location"
      >
        <LocationForm onClose={() => setIsModalOpen(false)} />
      </Modal>

      <Modal
        isOpen={!!editingLocation}
        onClose={() => setEditingLocation(null)}
        title="Edit Location"
      >
        {editingLocation && (
          <LocationEditForm
            location={editingLocation}
            onClose={() => setEditingLocation(null)}
          />
        )}
      </Modal>

      <DeleteConfirmationDialog
        isOpen={!!deletingLocation}
        onClose={() => setDeletingLocation(null)}
        onConfirm={() => deletingLocation && deleteLocationMutation(deletingLocation.id)}
        title={`Delete ${deletingLocation?.name}`}
        description={`Are you sure you want to delete ${deletingLocation?.name}? This will also delete all associated circuits.`}
      />

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        {isLoading ? (
          <div className="flex justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          view === 'table' ? (
            <Table
              data={locations || []}
              columns={getColumns(setEditingLocation, handleDeleteClick)}
              onRowClick={setEditingLocation}
            />
          ) : (
            <GridView
              data={locations || []}
              renderCard={(location) => (
                <div
                  onClick={() => setEditingLocation(location)}
                  className="cursor-pointer"
                >
                  <LocationCard location={location} />
                </div>
              )}
            />
          )
        )}
        {dependencies.length > 0 && (
          <div className="space-y-2">
            <p className="font-medium">The following circuits will also be deleted:</p>
            <ul className="list-disc list-inside space-y-1 text-gray-600 dark:text-gray-400">
              {dependencies.map(circuit => (
                <li key={circuit.id}>
                  {circuit.carrier} ({circuit.type}) - {circuit.purpose}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}