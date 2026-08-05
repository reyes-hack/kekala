import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';

export function useNeoFilters({ initialPageSize = 10, defaultSort = { column: 'id', ascending: false } } = {}) {
  const [searchParams, setSearchParams] = useSearchParams();

  // Parse state from URL or use defaults
  const page = parseInt(searchParams.get('page')) || 1;
  const pageSize = parseInt(searchParams.get('pageSize')) || initialPageSize;
  const globalSearch = searchParams.get('q') || '';
  
  // Advanced filters (Dynamic) -> ?f_status=APPROVED&f_category=COCO
  const [advancedFilters, setAdvancedFilters] = useState(() => {
    const filters = {};
    searchParams.forEach((val, key) => {
      if (key.startsWith('f_')) {
        filters[key.replace('f_', '')] = val;
      }
    });
    return filters;
  });

  // Sorting -> ?sort=created_at.desc
  const sortParam = searchParams.get('sort');
  let sortConfig = defaultSort;
  if (sortParam) {
    const [col, order] = sortParam.split('.');
    sortConfig = { column: col, ascending: order === 'asc' };
  }

  // --- Actions ---
  const updateUrlParams = useCallback((newParams) => {
    setSearchParams(prev => {
      const updated = new URLSearchParams(prev);
      Object.entries(newParams).forEach(([key, val]) => {
        if (val === null || val === undefined || val === '') {
          updated.delete(key);
        } else {
          updated.set(key, val);
        }
      });
      return updated;
    });
  }, [setSearchParams]);

  const setPage = (newPage) => updateUrlParams({ page: newPage });
  const setPageSize = (newSize) => updateUrlParams({ pageSize: newSize, page: 1 }); // reset to page 1
  const setGlobalSearch = (query) => updateUrlParams({ q: query, page: 1 });
  
  const setSort = (column, ascending) => {
    updateUrlParams({ sort: `${column}.${ascending ? 'asc' : 'desc'}` });
  };

  const applyAdvancedFilter = (key, value) => {
    const newState = { ...advancedFilters, [key]: value };
    if (!value) delete newState[key];
    setAdvancedFilters(newState);

    // Sync to URL
    const urlKey = `f_${key}`;
    updateUrlParams({ [urlKey]: value, page: 1 });
  };

  const clearFilters = () => {
    const toDelete = { q: null, page: 1 };
    Object.keys(advancedFilters).forEach(k => {
      toDelete[`f_${k}`] = null;
    });
    setAdvancedFilters({});
    updateUrlParams(toDelete);
  };

  return {
    page,
    pageSize,
    globalSearch,
    advancedFilters,
    sortConfig,
    setPage,
    setPageSize,
    setGlobalSearch,
    setSort,
    applyAdvancedFilter,
    clearFilters
  };
}
