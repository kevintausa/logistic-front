import React, { useCallback, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ClipboardList, PlusCircle, FilterIcon } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import DataTable from '@/components/DataTable';
import AppliedFilters from '@/components/AppliedFilters';
import FilterDrawer from '@/components/FilterDrawer';
import { useToast } from '@/components/ui/use-toast';
import { operationsColumns, columnsExcel } from './utils/operationsColumns';
import ExportExcelButton from '@/components/ExportExcelButton';
import { createOperation, deleteOperation, exportOperations, fetchOperations, updateOperation } from './Services/operations.services';
import OperationModal from './components/OperationModal';
import OperationDetailsModal from './components/OperationDetailsModal';
import QuoteModal from './components/QuoteModal';

const DEFAULT_FILTERS = {};

const OperationsPage = () => {
  const { toast } = useToast();
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState(null);
  const [modalMode, setModalMode] = useState('create');
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [detailsItem, setDetailsItem] = useState(null);
  const [isQuoteOpen, setIsQuoteOpen] = useState(false);
  const [quoteOperation, setQuoteOperation] = useState(null);

  const fetchAndSet = useCallback(async () => {
    setIsLoading(true);
    try {
      const offset = currentPage;
      const { data, totalRecords } = await fetchOperations({ limit: itemsPerPage, offset, query: filters });
      const normalized = (data || []).map((row) => ({
        ...row,
        clienteNombre: row?.cliente?.nombre,
      }));
      setData(normalized);
      setTotalItems(totalRecords);
    } catch (error) {
      toast({ title: 'Error', description: error.message || 'No se pudieron obtener las operaciones.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, itemsPerPage, filters, toast]);

  useEffect(() => { fetchAndSet(); }, [fetchAndSet]);

  const handlePageChange = (page) => setCurrentPage(page);
  const handleLimitChange = (newLimit) => { setItemsPerPage(newLimit); setCurrentPage(1); };
  const handleFilterChange = (newFilters) => { setCurrentPage(1); setFilters(newFilters); };
  const handleRemoveFilter = (key) => { const nf = { ...filters }; delete nf[key]; setFilters(nf); setCurrentPage(1); };

  const handleOpenModal = (mode, item = null) => { setModalMode(mode); setCurrentItem(item); setIsModalOpen(true); };
  const handleCloseModal = () => { setIsModalOpen(false); setCurrentItem(null); };
  const handleSaveItem = async (itemData) => {
    try {
      if (modalMode === 'create') {
        const response = await createOperation(itemData);
        if (response.code === 201) toast({ title: 'Creada', description: 'Operación creada.' }); else throw new Error(response.message);
      } else {
        const response = await updateOperation(currentItem._id, itemData);
        if (response.code === 200) toast({ title: 'Actualizada', description: 'Operación actualizada.' }); else throw new Error(response.message);
      }
    } catch (error) {
      toast({ title: 'Error', description: error.message || 'Problema al guardar.', variant: 'destructive' });
    } finally {
      handleCloseModal();
      fetchAndSet();
    }
  };

  const handleSaveQuote = async (quoteData) => {
    // TODO: Integrar con endpoint de cotizaciones cuando esté disponible
    setIsQuoteOpen(false);
    setQuoteOperation(null);
    toast({ title: 'Cotización', description: 'Cotización guardada (temporal).', duration: 2500 });
  };

  const handleAction = async (actionType, row) => {
    switch (actionType) {
      case 'view':
        setDetailsItem(row);
        setIsDetailsOpen(true);
        break;
      case 'addQuote':
        setQuoteOperation(row);
        setIsQuoteOpen(true);
        break;
      case 'edit':
        handleOpenModal('edit', row);
        break;
      case 'delete':
        try {
          const resp = await deleteOperation(row._id);
          if (resp.code === 200) {
            toast({ title: 'Eliminada', description: 'Operación eliminada.' });
            fetchAndSet();
          } else throw new Error(resp.message);
        } catch (err) {
          toast({ title: 'Error', description: err.message || 'Error al eliminar.', variant: 'destructive' });
        }
        break;
      case 'quotes':
        toast({ title: 'Cotizaciones', description: 'Próximamente: gestión de cotizaciones.' });
        break;
      case 'offer':
        toast({ title: 'Oferta', description: 'Próximamente: generación de oferta y PDF.' });
        break;
      case 'status':
        toast({ title: 'Estatus', description: 'Próximamente: línea de tiempo de estatus.' });
        break;
      case 'close':
        toast({ title: 'Cerrar', description: 'Próximamente: cierre de operación.' });
        break;
      case 'cancel':
        toast({ title: 'Cancelar', description: 'Próximamente: cancelación de operación.' });
        break;
      default:
        break;
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="p-4 md:p-6">
      <Card>
        <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="bg-primary/10 p-3 rounded-lg"><ClipboardList className="h-8 w-8 text-primary" /></div>
            <div>
              <CardTitle className="text-2xl">Operaciones</CardTitle>
              <CardDescription>Gestiona las operaciones.</CardDescription>
            </div>
          </div>
          <div className="w-full md:w-auto flex flex-col md:flex-row gap-3">
            <div className="flex flex-wrap gap-2 justify-end">
              <ExportExcelButton title="Operaciones" columns={columnsExcel} getData={() => exportOperations({ query: filters })} />
              <Button onClick={() => handleOpenModal('create')}><PlusCircle className="mr-2 h-4 w-4" /> Crear</Button>
              <Button onClick={() => setIsDrawerOpen(true)} className="flex items-center font-semibold bg-black hover:bg-white/20 "><FilterIcon className="mr-2 h-4 w-4" />Filtros</Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <AppliedFilters 
            filters={filters}
            fields={[{ id: 'estado', label: 'Estado', type: 'select', options: ['Pendiente', 'Tarifa Seleccionada', 'Pendiente de Aprobación', 'En curso', 'Finalizada', 'Cancelada'] }]}
            onRemoveFilter={handleRemoveFilter}
          />
          <DataTable data={data} columns={operationsColumns} isLoading={isLoading} onAction={handleAction} page={currentPage} limit={itemsPerPage} totalRecords={totalItems} onPageChange={handlePageChange} onLimitChange={handleLimitChange} />
          <FilterDrawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} fields={[{ id: 'estado', label: 'Estado', type: 'select', options: ['Pendiente', 'Tarifa Seleccionada', 'Pendiente de Aprobación', 'En curso', 'Finalizada', 'Cancelada'] }]} initialFilters={filters} onChange={handleFilterChange} onApply={handleFilterChange} />
        </CardContent>
      </Card>
      <AnimatePresence>
        {isModalOpen && (
          <OperationModal
            isOpen={isModalOpen}
            onClose={handleCloseModal}
            onSave={handleSaveItem}
            item={currentItem}
            title={currentItem ? 'Editar Operación' : 'Crear Operación'}
          />
        )}
        {isDetailsOpen && (
          <OperationDetailsModal
            isOpen={isDetailsOpen}
            onClose={() => { setIsDetailsOpen(false); setDetailsItem(null); }}
            item={detailsItem}
          />
        )}
        {isQuoteOpen && (
          <QuoteModal
            isOpen={isQuoteOpen}
            onClose={() => { setIsQuoteOpen(false); setQuoteOperation(null); }}
            onSave={handleSaveQuote}
            operation={quoteOperation}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default OperationsPage;
