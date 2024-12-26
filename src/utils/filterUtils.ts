import type { Circuit, CircuitComparison } from '../types';
import type { CircuitFilter, CircuitSort } from '../types/filters';

// Helper function to check if a circuit matches search criteria
function matchesSearch(circuit: Circuit, search: string) {
  if (!search) return true;
  const searchLower = search.toLowerCase();
  return (
    circuit.carrier.toLowerCase().includes(searchLower) ||
    circuit.type.toLowerCase().includes(searchLower) ||
    circuit.bandwidth.toLowerCase().includes(searchLower)
  );
}

export function filterCircuits(
  comparison: CircuitComparison,
  filter: CircuitFilter
): CircuitComparison {
  const filtered: CircuitComparison = {
    added: [],
    removed: [],
    modified: []
  };

  // Helper function to check if a circuit matches carrier filter
  const matchesCarrier = (circuit: Circuit) => {
    if (!filter.carrier) return true;
    return circuit.carrier === filter.carrier;
  };

  // Helper function to check if a circuit matches purpose filter
  const matchesPurpose = (circuit: Circuit) => {
    if (!filter.purpose) return true;
    return circuit.purpose === filter.purpose;
  };

  // Apply filters based on type
  if (filter.type === 'all' || filter.type === 'added') {
    filtered.added = comparison.added.filter(circuit => 
      matchesSearch(circuit, filter.search) && 
      matchesCarrier(circuit) &&
      matchesPurpose(circuit)
    );
  }

  if (filter.type === 'all' || filter.type === 'removed') {
    filtered.removed = comparison.removed.filter(circuit => 
      matchesSearch(circuit, filter.search) && 
      matchesCarrier(circuit) &&
      matchesPurpose(circuit)
    );
  }

  if (filter.type === 'all' || filter.type === 'modified') {
    filtered.modified = comparison.modified.filter(({ circuit }) => 
      matchesSearch(circuit, filter.search) && 
      matchesCarrier(circuit) &&
      matchesPurpose(circuit)
    );
  }

  return filtered;
}

export function sortCircuits(
  comparison: CircuitComparison,
  sort: CircuitSort
): CircuitComparison {
  const sortFn = (a: Circuit, b: Circuit) => {
    let valueA = a[sort.field];
    let valueB = b[sort.field];

    // Handle numeric values
    if (typeof valueA === 'number' && typeof valueB === 'number') {
      return sort.direction === 'asc' ? valueA - valueB : valueB - valueA;
    }

    // Handle string values
    valueA = String(valueA).toLowerCase();
    valueB = String(valueB).toLowerCase();
    return sort.direction === 'asc'
      ? valueA.localeCompare(valueB)
      : valueB.localeCompare(valueA);
  };

  return {
    added: [...comparison.added].sort(sortFn),
    removed: [...comparison.removed].sort(sortFn),
    modified: [...comparison.modified].sort((a, b) => sortFn(a.circuit, b.circuit))
  };
}