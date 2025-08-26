import React, { useCallback, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import DataTable from '@/components/DataTable';
import Pagination from '@/components/Pagination';
import DynamicFormModal from '@/components/DynamicFormModal';
import { useToast } from '@/components/ui/use-toast';
import AppliedFilters from '@/components/AppliedFilters';
import FilterDrawer from '@/components/FilterDrawer';
import ExportExcelButton from '@/components/ExportExcelButton';
import { providersColumns, columnsExcel } from '@/pages/parametrizacion/providers/utils/providersColumns';
import { fetchProviders, createProvider, updateProvider, deleteProvider, exportProviders } from '@/pages/parametrizacion/providers/Services/providers.services';

const ITEMS_PER_PAGE = 10;
const DEFAULT_FILTERS = { estado: 'Activo' };

const ProvidersPage = () => {
  const { toast } = useToast();
  const [displayedData, setDisplayedData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState(null);
  const [modalMode, setModalMode] = useState('create');

  const fetchAndSet = useCallback(async () => {
    setIsLoading(true);
    try {
      const offset = currentPage;
      const { data, totalRecords } = await fetchProviders({ limit: ITEMS_PER_PAGE, offset, query: filters });
      setDisplayedData(data);
      setTotalItems(totalRecords);
    } catch (error) {
      toast({ title: 'Error', description: error.message || 'No se pudieron obtener los proveedores.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, filters, toast]);

  useEffect(() => { fetchAndSet(); }, [fetchAndSet]);

  const handlePageChange = (page) => setCurrentPage(page);

  const handleOpenModal = (mode, item = null) => {
    setModalMode(mode);
    setCurrentItem(item);
    setIsModalOpen(true);
  };
  const handleCloseModal = () => { setIsModalOpen(false); setCurrentItem(null); };

  const handleSaveItem = async (formData) => {
    try {
      if (modalMode === 'create') {
        await createProvider(formData);
        toast({ title: 'Éxito', description: 'Proveedor creado correctamente.' });
      } else {
        await updateProvider(currentItem._id, formData);
        toast({ title: 'Éxito', description: 'Proveedor actualizado correctamente.' });
      }
      handleCloseModal();
      fetchAndSet();
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Ocurrió un problema al guardar el proveedor.';
      toast({ title: 'Error', description: errorMessage, variant: 'destructive' });
    }
  };

  const handleDeleteItem = async (row) => {
    if (!row?._id) return;
    if (!window.confirm(`¿Eliminar al proveedor "${row?.nombre}"?`)) return;
    try {
      await deleteProvider(row._id);
      toast({ title: 'Eliminado', description: 'Proveedor eliminado.' });
      fetchAndSet();
    } catch (error) {
      toast({ title: 'Error', description: error.message || 'No se pudo eliminar.', variant: 'destructive' });
    }
  };

  const handleAction = (actionType, row) => {
    if (actionType === 'edit') handleOpenModal('edit', row);
    if (actionType === 'delete') handleDeleteItem(row);
  };

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    setCurrentPage(1);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-4 space-y-4">
      <Card>
        <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
          <div>
            <CardTitle>Proveedores</CardTitle>
            <CardDescription>Administra los proveedores de tu operación</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setIsDrawerOpen(true)} variant="outline">Filtros</Button>
            <ExportExcelButton fetchData={exportProviders} filters={filters} filenamePrefix="proveedores" columns={columnsExcel} />
            <Button onClick={() => handleOpenModal('create')}>Nuevo</Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-2">
            <AppliedFilters
              filters={filters}
              fields={[
                { id: 'estado', label: 'Estado', type: 'select', options: [ { value: 'Activo', label: 'Activo' }, { value: 'Inactivo', label: 'Inactivo' } ] },
                { id: 'nombre', label: 'Nombre', type: 'text' },
                { id: 'nit', label: 'NIT', type: 'text' },
                { id: 'correo', label: 'Correo', type: 'text' },
                { id: 'createdAt', label: 'Rango de fechas', type: 'daterange' },
              ]}
              onRemoveFilter={(key) => handleFilterChange(Object.fromEntries(Object.entries(filters).filter(([k]) => k !== key)))}
            />
          </div>

          <DataTable data={displayedData} columns={providersColumns} isLoading={isLoading} onAction={handleAction} />

          <Pagination currentPage={currentPage} totalItems={totalItems} itemsPerPage={ITEMS_PER_PAGE} onPageChange={handlePageChange} />

          <FilterDrawer
            isOpen={isDrawerOpen}
            onClose={() => setIsDrawerOpen(false)}
            fields={[
              { id: 'estado', label: 'Estado', type: 'select', options: [ { value: 'Activo', label: 'Activo' }, { value: 'Inactivo', label: 'Inactivo' } ] },
              { id: 'nombre', label: 'Nombre', type: 'text' },
              { id: 'nit', label: 'NIT', type: 'text' },
              { id: 'correo', label: 'Correo', type: 'text' },
              { id: 'createdAt', label: 'Rango de fechas', type: 'daterange', defaultToday: true },
            ]}
            initialFilters={filters}
            onChange={handleFilterChange}
            onApply={handleFilterChange}
            initialDay={true}
          />
        </CardContent>
      </Card>

      <AnimatePresence>
        {isModalOpen && (
          <DynamicFormModal
            isOpen={isModalOpen}
            onClose={handleCloseModal}
            onSave={handleSaveItem}
            item={currentItem}
            fields={providersColumns}
            title={modalMode === 'create' ? 'Crear Proveedor' : 'Editar Proveedor'}
            mode={modalMode}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default ProvidersPage;
