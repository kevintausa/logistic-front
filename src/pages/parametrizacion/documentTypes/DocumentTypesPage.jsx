import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileCog, PlusCircle, FilterIcon } from 'lucide-react';
import AppliedFilters from '@/components/AppliedFilters';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import DataTable from '@/components/DataTable';
import Pagination from '@/components/Pagination';
import DynamicFormModal from '@/components/DynamicFormModal';
import { useToast } from '@/components/ui/use-toast';
import { documentTypesColumns, columnsExcel } from '@/pages/parametrizacion/documentTypes/utils/documentTypesColumns';
import {
  fetchDocumentTypes,
  createDocumentType,
  updateDocumentType,
  deleteDocumentType,
  exportDocumentTypes,
} from '@/pages/parametrizacion/documentTypes/Services/documentTypes.services';
import FilterDrawer from '@/components/FilterDrawer';
import ExportExcelButton from '@/components/ExportExcelButton';

const ITEMS_PER_PAGE = 10;
const DEFAULT_FILTERS = { estado: 'Activo' };

const DocumentTypesPage = () => {
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

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  const fetchAndSet = useCallback(async () => {
    setIsLoading(true);
    try {
      const offset = currentPage;
      const { data = [], totalRecords = data.length } = await fetchDocumentTypes({ limit: ITEMS_PER_PAGE, offset, query: filters });
      setDisplayedData(data);
      setTotalItems(totalRecords);
    } catch (error) {
      toast({ title: 'Error', description: error.message || 'No se pudieron obtener los tipos de archivo.', variant: 'destructive' });
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

  const handleSaveItem = async (itemData) => {
    try {
      if (modalMode === 'create') {
        await createDocumentType(itemData);
        toast({ title: 'Éxito', description: 'Tipo de archivo creado correctamente.' });
      } else if (modalMode === 'edit') {
        await updateDocumentType(currentItem._id, itemData);
        toast({ title: 'Éxito', description: 'Tipo de archivo actualizado correctamente.' });
      }
      handleCloseModal();
      fetchAndSet();
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Ocurrió un problema al guardar el tipo de archivo.';
      toast({ title: 'Error', description: errorMessage, variant: 'destructive' });
    }
  };

  const handleDeleteConfirmation = (item) => { setItemToDelete(item); setIsDeleteDialogOpen(true); };
  const handleDeleteItem = async () => {
    try {
      if (itemToDelete) {
        const response = await deleteDocumentType(itemToDelete._id);
        if (response.code === 200) {
          toast({ title: 'Tipo eliminado', description: 'El tipo de archivo fue eliminado correctamente.' });
        } else {
          throw new Error(response.message || 'Error al eliminar tipo de archivo');
        }
      }
    } catch (error) {
      toast({ title: 'Error', description: error.message || 'Ocurrió un problema al eliminar el tipo.', variant: 'destructive' });
    } finally {
      setIsDeleteDialogOpen(false);
      setItemToDelete(null);
      fetchAndSet();
    }
  };

  const handleAction = (actionType, row) => {
    if (actionType === 'edit') handleOpenModal('edit', row);
    else if (actionType === 'delete') handleDeleteConfirmation(row);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
      <Card>
        <CardHeader className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
          <div className="w-full md:w-auto">
            <div className="flex items-center space-x-3 mb-2">
              <FileCog className="h-8 w-8 text-primary" />
              <CardTitle className="text-2xl">Tipos de Archivo</CardTitle>
            </div>
            <CardDescription>Gestiona los tipos de archivo permitidos para documentos.</CardDescription>
          </div>

          <div className="w-full flex flex-col gap-3">
            <div className="flex flex-wrap gap-2 justify-end">
              <ExportExcelButton title="Tipos de Archivo" columns={columnsExcel} getData={() => exportDocumentTypes({ query: filters })} />
              <Button onClick={() => handleOpenModal('create')}>
                <PlusCircle className="mr-2 h-4 w-4" /> Crear Tipo
              </Button>
              <Button onClick={() => setIsDrawerOpen(true)} className="flex items-center font-semibold bg-black hover:bg-white/20 ">
                <FilterIcon className="mr-2 h-4 w-4" variant="outline" size={20} />
                Filtros
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="w-full">
            <AppliedFilters
              filters={filters}
              fields={[
                { id: 'estado', label: 'Estado', type: 'select', options: [ { value: 'Activo', label: 'Activo' }, { value: 'Inactivo', label: 'Inactivo' } ] },
                { id: 'aplicaA', label: 'Aplica a', type: 'select', options: [ { value: 'empleado', label: 'Empleado' }, { value: 'centro', label: 'Centro' }, { value: 'ambos', label: 'Ambos' } ] },
                { id: 'createdAt', label: 'Rango de fechas', type: 'daterange' },
              ]}
              onRemoveFilter={(key) => { const nf = { ...filters }; delete nf[key]; setFilters(nf); }}
            />
          </div>

          <DataTable
            data={displayedData}
            columns={documentTypesColumns}
            isLoading={isLoading}
            onAction={handleAction}
            showCreateButton={false}
          />
          <Pagination currentPage={currentPage} totalItems={totalItems} itemsPerPage={ITEMS_PER_PAGE} onPageChange={setCurrentPage} />

          <FilterDrawer
            isOpen={isDrawerOpen}
            onClose={() => setIsDrawerOpen(false)}
            fields={[
              { id: 'estado', label: 'Estado', type: 'select', options: [ { value: 'Activo', label: 'Activo' }, { value: 'Inactivo', label: 'Inactivo' } ] },
              { id: 'aplicaA', label: 'Aplica a', type: 'select', options: [ { value: 'empleado', label: 'Empleado' }, { value: 'centro', label: 'Centro' }, { value: 'ambos', label: 'Ambos' } ] },
              { id: 'createdAt', label: 'Rango de fechas', type: 'daterange', defaultToday: true },
            ]}
            initialFilters={filters}
            onChange={setFilters}
            onApply={setFilters}
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
            fields={documentTypesColumns}
            title={modalMode === 'create' ? 'Crear Nuevo Tipo de Archivo' : 'Editar Tipo de Archivo'}
            mode={modalMode}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default DocumentTypesPage;
