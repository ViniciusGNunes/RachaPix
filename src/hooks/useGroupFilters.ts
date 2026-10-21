import { useState } from 'react';
import { toast } from '@/components/ui/Toast';

export function useGroupFilters() {
  const [filterFrom, setFilterFrom] = useState('');
  const [filterTo, setFilterTo] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterMemberId, setFilterMemberId] = useState('');

  const handleFilterFromChange = (val: string) => {
    if (val && filterTo && val > filterTo) {
      toast.error('A data inicial deve ser anterior ou igual à data final.');
      return;
    }
    setFilterFrom(val);
  };

  const handleFilterToChange = (val: string) => {
    if (filterFrom && val && filterFrom > val) {
      toast.error('A data inicial deve ser anterior ou igual à data final.');
      return;
    }
    setFilterTo(val);
  };

  const clearFilters = () => {
    setFilterFrom('');
    setFilterTo('');
    setFilterCategory('');
    setFilterMemberId('');
  };

  return {
    filterFrom,
    filterTo,
    filterCategory,
    filterMemberId,
    setFilterCategory,
    setFilterMemberId,
    handleFilterFromChange,
    handleFilterToChange,
    clearFilters,
  };
}
