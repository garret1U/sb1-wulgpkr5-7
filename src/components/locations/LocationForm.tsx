import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createLocation, updateLocation, getCompanies } from '../../lib/api';
import { geocodeAddress } from '../../lib/maps';
import { AddressForm } from '../address/AddressForm';
import { CriticalitySelect } from './CriticalitySelect';
import type { Location } from '../../types';

interface LocationFormProps {
  location?: Location; // If provided, we're in edit mode
  onClose: () => void;
}

interface LocationFormData {
  name: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  country: string;
  criticality: string;
  site_description: string;
  critical_processes: string;
  active_users: number;
  num_servers: number;
  num_devices: number;
  hosted_applications: string;
  company_id: string;
}

export function LocationForm({ location, onClose }: LocationFormProps) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<LocationFormData>({
    name: location?.name || '',
    address: location?.address || '',
    city: location?.city || '',
    state: location?.state || '',
    zip_code: location?.zip_code || '',
    country: location?.country || '',
    criticality: location?.criticality || 'Low',
    site_description: location?.site_description || '',
    critical_processes: location?.critical_processes || '',
    active_users: location?.active_users || 0,
    num_servers: location?.num_servers || 0,
    num_devices: location?.num_devices || 0,
    hosted_applications: location?.hosted_applications || '',
    company_id: location?.company_id || ''
  });

  const isEditMode = !!location;

  const { data: companies } = useQuery({
    queryKey: ['companies'],
    queryFn: getCompanies
  });

  const { mutate, isPending } = useMutation({
    mutationFn: () => {
      // Geocode the address before creating/updating
      const fullAddress = `${formData.address}, ${formData.city}, ${formData.state} ${formData.zip_code}`;
      return geocodeAddress(fullAddress).then(coords => {
        const locationData = {
          ...formData,
          longitude: coords?.longitude,
          latitude: coords?.latitude
        };
        return isEditMode
          ? updateLocation(location.id, locationData)
          : createLocation(locationData);
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['locations'] });
      onClose();
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutate();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'active_users' || name === 'num_servers' || name === 'num_devices'
        ? parseInt(value) || 0
        : value
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Company *
        </label>
        <select
          name="company_id"
          required
          value={formData.company_id}
          onChange={handleChange}
          className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 
                   bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-gray-100
                   focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        >
          <option value="">Select a company</option>
          {companies?.map(company => (
            <option key={company.id} value={company.id}>
              {company.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Location Name *
        </label>
        <input
          type="text"
          name="name"
          required
          value={formData.name}
          onChange={handleChange}
          className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 
                   bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-gray-100
                   focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>

      <div>
        <AddressForm
          value={{
            street: formData.address,
            city: formData.city,
            state: formData.state,
            zip_code: formData.zip_code,
            country: formData.country
          }}
          onChange={(address) => {
            setFormData(prev => ({
              ...prev,
              address: address.street,
              city: address.city,
              state: address.state,
              zip_code: address.zip_code,
              country: address.country
            }));
          }}
        />
      </div>

      <CriticalitySelect
        value={formData.criticality}
        onChange={(value) => setFormData(prev => ({ ...prev, criticality: value }))}
        required
      />

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Site Description
        </label>
        <textarea
          name="site_description"
          value={formData.site_description}
          onChange={handleChange}
          rows={3}
          className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 
                   bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-gray-100
                   focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          placeholder="Enter site description"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Critical On-site Business Processes
        </label>
        <textarea
          name="critical_processes"
          value={formData.critical_processes}
          onChange={handleChange}
          rows={3}
          className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 
                   bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-gray-100
                   focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          placeholder="List critical business processes"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Active Users
        </label>
        <input
          type="number"
          name="active_users"
          min="0"
          value={formData.active_users}
          onChange={handleChange}
          className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 
                   bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-gray-100
                   focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          placeholder="Enter number of active users"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Number of Servers
          </label>
          <input
            type="number"
            name="num_servers"
            min="0"
            value={formData.num_servers}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 
                     bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-gray-100
                     focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Number of Devices
          </label>
          <input
            type="number"
            name="num_devices"
            min="0"
            value={formData.num_devices}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 
                     bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-gray-100
                     focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Hosted Applications
        </label>
        <textarea
          name="hosted_applications"
          value={formData.hosted_applications}
          onChange={handleChange}
          rows={3}
          className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 
                   bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-gray-100
                   focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          placeholder="List critical business applications hosted at this location"
        />
      </div>

      <div className="flex justify-end space-x-3 mt-6">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 
                   hover:text-gray-900 dark:hover:text-gray-100"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isPending}
          className="bg-primary text-primary-foreground px-4 py-2 rounded-md 
                   hover:bg-primary/90 disabled:opacity-50"
        >
          {isPending ? (isEditMode ? 'Saving...' : 'Creating...') : (isEditMode ? 'Save Changes' : 'Create Location')}
        </button>
      </div>
    </form>
  );
}