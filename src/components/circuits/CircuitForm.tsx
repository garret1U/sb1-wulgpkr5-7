import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createCircuit, updateCircuit, getLocations } from '../../lib/api';
import { PurposeSelect } from './PurposeSelect';
import type { Circuit } from '../../types';

interface CircuitFormProps {
  circuit?: Circuit; // If provided, we're in edit mode
  onClose: () => void;
}

export function CircuitForm({ circuit, onClose }: CircuitFormProps) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    carrier: circuit?.carrier || '',
    type: circuit?.type || '',
    purpose: circuit?.purpose || '',
    status: circuit?.status || 'Active',
    bandwidth: circuit?.bandwidth || '',
    monthlycost: circuit?.monthlycost || 0,
    static_ips: circuit?.static_ips || 0,
    upload_bandwidth: circuit?.upload_bandwidth || '',
    contract_start_date: circuit?.contract_start_date || '',
    contract_term: circuit?.contract_term || 12,
    contract_end_date: circuit?.contract_end_date || '',
    billing: circuit?.billing || 'Monthly',
    usage_charges: circuit?.usage_charges || false,
    installation_cost: circuit?.installation_cost || 0,
    notes: circuit?.notes || '',
    location_id: circuit?.location_id || ''
  });

  const isEditMode = !!circuit;

  // Calculate contract end date based on start date and term
  const calculateEndDate = (startDate: string, termMonths: number): string => {
    if (!startDate) return '';
    try {
      const date = new Date(startDate);
      date.setMonth(date.getMonth() + termMonths);
      return date.toISOString().split('T')[0];
    } catch (error) {
      console.error('Error calculating end date:', error);
      return '';
    }
  };

  // Calculate term months between two dates
  const calculateTermMonths = (startDate: string, endDate: string): number => {
    if (!startDate || !endDate) return 12;
    try {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const months = (end.getFullYear() - start.getFullYear()) * 12 + 
                    (end.getMonth() - start.getMonth());
      return Math.max(1, months); // Ensure minimum 1 month term
    } catch (error) {
      console.error('Error calculating term months:', error);
      return 12;
    }
  };

  const { data: locations } = useQuery({
    queryKey: ['locations'],
    queryFn: () => getLocations()
  });

  const { mutate, isPending } = useMutation({
    mutationFn: () => isEditMode 
      ? updateCircuit(circuit.id, formData)
      : createCircuit(formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['circuits'] });
      onClose();
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutate();
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    const newValue = type === 'number' ? Number(value) :
                     type === 'checkbox' ? (e.target as HTMLInputElement).checked :
                     value;

    let updates: Partial<typeof formData> = { [name]: newValue };

    // Synchronize contract dates
    if (name === 'contract_start_date') {
      if (formData.contract_term) {
        const endDate = calculateEndDate(value as string, formData.contract_term);
        updates.contract_end_date = endDate;
      }
    } else if (name === 'contract_term') {
      if (formData.contract_start_date) {
        const endDate = calculateEndDate(formData.contract_start_date, newValue as number);
        updates.contract_end_date = endDate;
      }
    } else if (name === 'contract_end_date') {
      if (formData.contract_start_date) {
        const termMonths = calculateTermMonths(formData.contract_start_date, value as string);
        updates.contract_term = termMonths;
      }
    }

    setFormData(prev => ({ ...prev, ...updates }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Location *
        </label>
        <select
          name="location_id"
          required
          value={formData.location_id}
          onChange={handleChange}
          className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 
                   bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-gray-100
                   focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        >
          <option value="">Select a location</option>
          {locations?.map(location => (
            <option key={location.id} value={location.id}>
              {location.name} ({location.company?.name})
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Carrier *
          </label>
          <input
            type="text"
            name="carrier"
            required
            value={formData.carrier}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 
                     bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-gray-100
                     focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Type *
          </label>
          <select
            name="type"
            required
            value={formData.type}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 
                     bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-gray-100
                     focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="">Select type</option>
            <option value="MPLS">MPLS</option>
            <option value="DIA">DIA</option>
            <option value="Broadband">Broadband</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <PurposeSelect
          value={formData.purpose}
          onChange={(value) => setFormData(prev => ({ ...prev, purpose: value }))}
          required
        />

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Status *
          </label>
          <select
            name="status"
            required
            value={formData.status}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 
                     bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-gray-100
                     focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
            <option value="Quoted">Quoted</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Bandwidth *
          </label>
          <input
            type="text"
            name="bandwidth"
            required
            value={formData.bandwidth}
            onChange={handleChange}
            placeholder="e.g., 100 Mbps"
            className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 
                     bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-gray-100
                     focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Upload Bandwidth
          </label>
          <input
            type="text"
            name="upload_bandwidth"
            value={formData.upload_bandwidth}
            onChange={handleChange}
            placeholder="e.g., 50 Mbps"
            className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 
                     bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-gray-100
                     focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Monthly Cost *
          </label>
          <input
            type="number"
            name="monthlycost"
            required
            min="0"
            step="0.01"
            value={formData.monthlycost}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 
                     bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-gray-100
                     focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Installation Cost
          </label>
          <input
            type="number"
            name="installation_cost"
            min="0"
            step="0.01"
            value={formData.installation_cost}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 
                     bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-gray-100
                     focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Contract Start Date
          </label>
          <input
            type="date"
            name="contract_start_date"
            value={formData.contract_start_date}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 
                     bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-gray-100
                     focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Contract Term (months)
          </label>
          <input
            type="number"
            name="contract_term"
            min="1"
            value={formData.contract_term}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 
                     bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-gray-100
                     focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Contract End Date
          </label>
          <input
            type="date"
            name="contract_end_date"
            value={formData.contract_end_date}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 
                     bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-gray-100
                     focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Static IPs
          </label>
          <input
            type="number"
            name="static_ips"
            min="0"
            value={formData.static_ips}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 
                     bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-gray-100
                     focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Billing Frequency *
          </label>
          <select
            name="billing"
            required
            value={formData.billing}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 
                     bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-gray-100
                     focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="Monthly">Monthly</option>
            <option value="Quarterly">Quarterly</option>
            <option value="Annually">Annually</option>
          </select>
        </div>
      </div>

      <div>
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            name="usage_charges"
            checked={formData.usage_charges}
            onChange={handleChange}
            className="rounded border-gray-300 dark:border-gray-600 
                     text-primary focus:ring-primary"
          />
          <span className="text-sm text-gray-700 dark:text-gray-300">
            Has usage-based charges
          </span>
        </label>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Notes
        </label>
        <textarea
          name="notes"
          value={formData.notes}
          onChange={handleChange}
          rows={3}
          className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 
                   bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-gray-100
                   focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
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
          {isPending ? (isEditMode ? 'Saving...' : 'Creating...') : (isEditMode ? 'Save Changes' : 'Create Circuit')}
        </button>
      </div>
    </form>
  );
}