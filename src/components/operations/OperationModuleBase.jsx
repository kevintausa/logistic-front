import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { FilterIcon } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import AppliedFilters from '@/components/AppliedFilters';
import DataTable from '@/components/DataTable';
import Pagination from '@/components/Pagination';
import FilterDrawer from '@/components/FilterDrawer';
import ExportExcelButton from '@/components/ExportExcelButton';

const DEFAULT_ITEMS_PER_PAGE = 10;

export default function OperationModuleBase({
  title,
  description,
  columns,
  filterFields = [],
  fetchService,
  exportService,
  columnsExcel = [],
  itemsPerPage = DEFAULT_ITEMS_PER_PAGE,
  fileName = 'operaciones',
  renderHeaderActions, // optional render prop for extra header buttons
  onAction, // optional: forward actions from DataTable
  refreshToken, // optional: when changes, refetch
  defaultFilters = {}, // optional: initial filters
  resetOnDefaultChange = false, // if true, when defaultFilters changes, reset filters to default
  enforcedFilters = {}, // filters that are always applied and cannot be removed here
  hiddenFilterKeys = [], // keys to hide from AppliedFilters UI
}) {
  const [displayedData, setDisplayedData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [filters, setFilters] = useState({ ...(enforcedFilters || {}), ...(defaultFilters || {}) });
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const effectiveFilterFields = useMemo(() => filterFields.filter(Boolean), [filterFields]);

  // Make filter values render-safe for AppliedFilters (avoid passing raw objects like {$in: [...]})
  const displayFilters = useMemo(() => {
    const out = {};
    const hidden = new Set([...(hiddenFilterKeys || []), ...Object.keys(enforcedFilters || {})]);
    Object.entries(filters || {}).forEach(([key, val]) => {
      if (hidden.has(key)) return; // do not show enforced/hidden filters in the UI
      if (val && typeof val === 'object' && !Array.isArray(val)) {
        if (Object.prototype.hasOwnProperty.call(val, '$in')) {
          const arr = Array.isArray(val.$in) ? val.$in : [val.$in];
          out[key] = arr.join(', ');
        } else {
          try { out[key] = JSON.stringify(val); } catch { out[key] = String(val); }
        }
      } else if (Array.isArray(val)) {
        out[key] = val.join(', ');
      } else {
        out[key] = val;
      }
    });
    return out;
  }, [filters, enforcedFilters, hiddenFilterKeys]);

  const fetchAndSet = useCallback(async () => {
    if (typeof fetchService !== 'function') return;
    setIsLoading(true);
    try {
      const offset = currentPage; // 1-based page expected by other pages
      const { data, totalRecords } = await fetchService({ limit: itemsPerPage, offset, query: filters });
      setDisplayedData(Array.isArray(data) ? data : []);
      setTotalItems(Number(totalRecords) || 0);
    } catch (err) {
      console.error('Error fetching data:', err);
      setDisplayedData([]);
      setTotalItems(0);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, filters, itemsPerPage, fetchService]);

  useEffect(() => {
    fetchAndSet();
  }, [fetchAndSet, refreshToken]);

  // Keep filters in sync with defaults if requested
  useEffect(() => {
    if (resetOnDefaultChange) {
      setFilters({ ...(enforcedFilters || {}), ...(defaultFilters || {}) });
      setCurrentPage(1);
    }
  }, [defaultFilters, resetOnDefaultChange, enforcedFilters]);

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle className="text-2xl font-bold">{title}</CardTitle>
            {description && <CardDescription>{description}</CardDescription>}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setIsDrawerOpen(true)}>
              <FilterIcon className="mr-2 h-4 w-4" /> Filtros
            </Button>
            {typeof exportService === 'function' && columnsExcel?.length > 0 && (
              <ExportExcelButton
                service={exportService}
                filters={filters}
                columns={columnsExcel}
                fileName={`${fileName}_${new Date().toISOString().slice(0, 10)}`}
              />
            )}
            {typeof renderHeaderActions === 'function' && renderHeaderActions()}
          </div>
        </CardHeader>
        <CardContent>
          <AppliedFilters
            filters={displayFilters}
            fields={effectiveFilterFields}
            onRemoveFilter={(key) => setFilters((prev) => {
              const base = { ...(enforcedFilters || {}) };
              const updated = { ...prev };
              delete updated[key];
              // Re-apply enforced filters to ensure they remain
              return { ...base, ...updated };
            })}
          />

          <DataTable
            columns={columns}
            data={displayedData}
            isLoading={isLoading}
            onAction={onAction}
          />

          <div className="mt-4">
            <Pagination
              currentPage={currentPage}
              totalItems={totalItems}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
            />
          </div>
        </CardContent>
      </Card>

      <FilterDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        fields={effectiveFilterFields}
        onApply={(applied) => {
          // Merge applied filters with enforced filters so enforced cannot be removed
          const base = { ...(enforcedFilters || {}) };
          setFilters({ ...base, ...(applied || {}) });
          setCurrentPage(1);
        }}
      />
    </motion.div>
  );
}
