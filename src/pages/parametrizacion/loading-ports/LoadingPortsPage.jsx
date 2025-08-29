import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Anchor, PlusCircle, FilterIcon } from 'lucide-react';
import AppliedFilters from '@/components/AppliedFilters';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import DataTable from '@/components/DataTable';
import DynamicFormModal from '@/components/DynamicFormModal';
import { useToast } from '@/components/ui/use-toast';
import { loadingPortsColumns, columnsExcel } from './utils/loadingPortsColumns';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { fetchLoadingPorts, createLoadingPort, updateLoadingPort, deleteLoadingPort, exportLoadingPorts } from './Services/loading-ports.services';
import FilterDrawer from '@/components/FilterDrawer';
import ExportExcelButton from '@/components/ExportExcelButton';

const DEFAULT_FILTERS = {};

const LoadingPortsPage = () => {
  const { toast } = useToast();
  const [displayedData, setDisplayedData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedTerm, setDebouncedTerm] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState(null);
  const [modalMode, setModalMode] = useState('create');

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  // Debounce search term
  useEffect(() => {
    const id = setTimeout(() => setDebouncedTerm(searchTerm.trim()), 300);
    return () => clearTimeout(id);
  }, [searchTerm]);

  // Build query with $or for quick search (new fields)
  useEffect(() => {
    const base = { ...filters };
    // Remove previous $or before applying a new one
    delete base.$or;
    if (debouncedTerm) {
      base.$or = [
        { nombre: { $regex: debouncedTerm, $options: 'i' } },
        { ciudad: { $regex: debouncedTerm, $options: 'i' } },
        { pais: { $regex: debouncedTerm, $options: 'i' } },
        { tipo: { $regex: debouncedTerm, $options: 'i' } },
        { iata: { $regex: debouncedTerm, $options: 'i' } },
        { icao: { $regex: debouncedTerm, $options: 'i' } },
        { unlocode: { $regex: debouncedTerm, $options: 'i' } },
      ];
    }
    setFilters(base);
    setCurrentPage(1);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedTerm]);

  const fetchAndSet = useCallback(async () => {
    setIsLoading(true);
    try {
      const offset = currentPage;
      const { data, totalRecords } = await fetchLoadingPorts({ limit: itemsPerPage, offset, query: filters });
      setDisplayedData(data);
      setTotalItems(totalRecords);
    } catch (error) {
      toast({ title: 'Error', description: error.message || 'No se pudieron obtener los puertos de carga.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, filters, toast, itemsPerPage]);

  useEffect(() => { fetchAndSet(); }, [fetchAndSet]);

  const handlePageChange = (page) => setCurrentPage(page);
  const handleLimitChange = (newLimit) => { setItemsPerPage(newLimit); setCurrentPage(1); };
  const handleOpenModal = (mode, item = null) => { setModalMode(mode); setCurrentItem(item); setIsModalOpen(true); };
  const handleCloseModal = () => { setIsModalOpen(false); setCurrentItem(null); };

  const handleSaveItem = async (itemData) => {
    try {
      // Normalizar/generar ID si no viene
      let payload = { ...itemData };
      const tipo = (payload.tipo || '').toString().trim().toLowerCase();
      const iata = (payload.iata || '').toString().trim().toUpperCase() || null;
      const icao = (payload.icao || '').toString().trim().toUpperCase() || null;
      const unlocode = (payload.unlocode || '').toString().trim().toUpperCase() || null;
      const code = iata || icao || unlocode || null;
      if (!payload.id && tipo && code) {
        payload.id = `${tipo}:${code}`;
      }
      // Asegurar tipos numéricos para lat/lng
      if (payload.lat !== undefined && payload.lat !== null) payload.lat = Number(payload.lat);
      if (payload.lng !== undefined && payload.lng !== null) payload.lng = Number(payload.lng);

      if (modalMode === 'create') {
        const response = await createLoadingPort(payload);
        if (response.code === 201) toast({ title: 'Creado', description: 'Puerto de carga creado.' }); else throw new Error(response.message);
      } else {
        const response = await updateLoadingPort(currentItem._id, payload);
        if (response.code === 200) toast({ title: 'Actualizado', description: 'Puerto de carga actualizado.' }); else throw new Error(response.message);
      }
    } catch (error) {
      toast({ title: 'Error', description: error.message || 'Problema al guardar.', variant: 'destructive' });
    } finally {
      handleCloseModal();
      fetchAndSet();
    }
  };

  const handleDeleteConfirmation = (item) => { setItemToDelete(item); setIsDeleteDialogOpen(true); };
  const handleDeleteItem = async () => {
    try {
      const response = await deleteLoadingPort(itemToDelete._id);
      if (response.code === 200) { toast({ title: 'Eliminado', description: 'Registro eliminado.' }); fetchAndSet(); }
      else throw new Error(response.message);
    } catch (error) {
      toast({ title: 'Error', description: error.message || 'Problema al eliminar.', variant: 'destructive' });
    } finally {
      setIsDeleteDialogOpen(false);
      setItemToDelete(null);
    }
  };

  const handleAction = (actionType, row) => { if (actionType === 'edit') handleOpenModal('edit', row); else if (actionType === 'delete') handleDeleteConfirmation(row); };
  const handleFilterChange = (newFilters) => { setCurrentPage(1); setFilters(newFilters); };
  const handleRemoveFilter = (key) => { const nf = { ...filters }; delete nf[key]; setFilters(nf); setCurrentPage(1); };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }} className="p-4 md:p-6">
      <Card>
        <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="bg-primary/10 p-3 rounded-lg"><Anchor className="h-8 w-8 text-primary" /></div>
            <div>
              <CardTitle className="text-2xl">Parametrización: Puertos de Carga</CardTitle>
              <CardDescription>Gestiona los puertos de carga.</CardDescription>
            </div>
          </div>
          <div className="w-full md:w-auto flex flex-col md:flex-row gap-3">
            <div className="flex flex-wrap gap-2 justify-end">
              <ExportExcelButton title="Puertos de Carga" columns={columnsExcel} getData={() => exportLoadingPorts({ query: filters })} />
              <Button onClick={() => handleOpenModal('create')}><PlusCircle className="mr-2 h-4 w-4" /> Crear</Button>
              <Button onClick={() => setIsDrawerOpen(true)} className="flex items-center font-semibold bg-black hover:bg-white/20 "><FilterIcon className="mr-2 h-4 w-4" />Filtros</Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="w-full mb-3">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por nombre, ciudad, país, tipo, IATA, ICAO, UN/LOCODE..."
              className="w-full md:w-1/2 border rounded px-3 py-2"
            />
          </div>
          <div className="w-full">
            <AppliedFilters 
              filters={filters}
              fields={[{ id: 'createdAt', label: 'Rango de fechas', type: 'daterange' }]}
              onRemoveFilter={handleRemoveFilter}
            />
          </div>
          <DataTable data={displayedData} columns={loadingPortsColumns} isLoading={isLoading} onAction={handleAction} page={currentPage} limit={itemsPerPage} totalRecords={totalItems} onPageChange={handlePageChange} onLimitChange={handleLimitChange} />
          <FilterDrawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} fields={[{ id: 'createdAt', label: 'Rango de fechas', type: 'daterange', defaultToday: true }]} initialFilters={filters} onChange={handleFilterChange} onApply={handleFilterChange} initialDay={true} />
        </CardContent>
      </Card>
      <AnimatePresence>
        {isModalOpen && (
          <DynamicFormModal isOpen={isModalOpen} onClose={handleCloseModal} onSave={handleSaveItem} item={currentItem} fields={loadingPortsColumns} title={currentItem ? 'Editar Puerto de Carga' : 'Crear Puerto de Carga'} />
        )}
      </AnimatePresence>
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar registro?</AlertDialogTitle>
            <AlertDialogDescription>Esta acción no se puede deshacer.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteItem} className="bg-destructive hover:bg-destructive/90">Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
};

export default LoadingPortsPage;
