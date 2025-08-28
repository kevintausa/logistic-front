import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, PlusCircle, FilterIcon } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import DataTable from '@/components/DataTable';
import AppliedFilters from '@/components/AppliedFilters';
import FilterDrawer from '@/components/FilterDrawer';
import DynamicFormModal from '@/components/DynamicFormModal';
import { useToast } from '@/components/ui/use-toast';
import { listOfferConcepts, createOfferConcept, updateOfferConcept, toggleOfferConceptActive } from '@/pages/operations/Services/offers.services.jsx';
import { offerConceptsColumns, offerConceptsFields, gruposOptions } from './utils/offerConceptsColumns';

const DEFAULT_FILTERS = { activos: 'true' };

const OfferConceptsPage = () => {
  const { toast } = useToast();
  const [displayedData, setDisplayedData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [currentItem, setCurrentItem] = useState(null);

  const fetchAndSet = useCallback(async () => {
    setIsLoading(true);
    try {
      const queryGrupo = filters?.grupo?.value || filters?.grupo || undefined;
      const activos = filters?.activos === 'true' || filters?.activos === true || filters?.activos === undefined ? true : false;
      const { data } = await listOfferConcepts({ grupo: queryGrupo || undefined, activos });
      setTotalItems(data.length);
      // Paginación en cliente (el backend no pagina aún)
      const start = (currentPage - 1) * itemsPerPage;
      const end = start + itemsPerPage;
      setDisplayedData(data.slice(start, end));
    } catch (error) {
      toast({ title: 'Error', description: error.message || 'No se pudieron obtener los conceptos.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, itemsPerPage, filters, toast]);

  useEffect(() => { fetchAndSet(); }, [fetchAndSet]);

  const handlePageChange = (page) => setCurrentPage(page);
  const handleLimitChange = (newLimit) => { setItemsPerPage(newLimit); setCurrentPage(1); };

  const handleOpenModal = (mode, item = null) => { setModalMode(mode); setCurrentItem(item); setIsModalOpen(true); };
  const handleCloseModal = () => { setIsModalOpen(false); setCurrentItem(null); };

  const handleSaveItem = async (itemData) => {
    try {
      const body = {
        concepto: itemData.concepto,
        tipo: 'cotizacion',
        montoUsd: Number(itemData.montoUsd),
        grupo: itemData.grupo,
      };
      if (modalMode === 'create') {
        const res = await createOfferConcept(body);
        if (res?.code === 201) toast({ title: 'Concepto creado', description: 'El concepto fue registrado correctamente.' });
        else toast({ title: 'Concepto creado', description: 'Se creó el concepto.', variant: 'default' });
      } else if (modalMode === 'edit' && currentItem?._id) {
        const res = await updateOfferConcept(currentItem._id, body);
        if (res?.code === 200) toast({ title: 'Concepto actualizado', description: 'Los datos fueron actualizados correctamente.' });
        else toast({ title: 'Actualizado', description: 'Se actualizó el concepto.', variant: 'default' });
      }
    } catch (error) {
      toast({ title: 'Error', description: error.message || 'Ocurrió un problema al guardar el concepto.', variant: 'destructive' });
    } finally {
      handleCloseModal();
      fetchAndSet();
    }
  };

  const handleAction = async (actionType, row) => {
    if (actionType === 'edit') {
      handleOpenModal('edit', row);
      return;
    }
    if (actionType === 'toggle-active') {
      try {
        const next = !row.activo;
        const res = await toggleOfferConceptActive(row._id, next);
        if (res?.code === 200) toast({ title: next ? 'Concepto activado' : 'Concepto desactivado' });
        else toast({ title: 'Estado actualizado' });
        fetchAndSet();
      } catch (error) {
        toast({ title: 'Error', description: error.message || 'No se pudo cambiar el estado.', variant: 'destructive' });
      }
      return;
    }
  };

  const handleFilterChange = (newFilters) => { setCurrentPage(1); setFilters(newFilters); };
  const handleRemoveFilter = (key) => { const nf = { ...filters }; delete nf[key]; setFilters(nf); setCurrentPage(1); };

  const columns = useMemo(() => offerConceptsColumns, []);

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }} className="p-4 md:p-6">
      <Card>
        <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="bg-primary/10 p-3 rounded-lg"><FileText className="h-8 w-8 text-primary" /></div>
            <div>
              <CardTitle className="text-2xl">Parametrización - Conceptos de Oferta</CardTitle>
              <CardDescription>Gestiona los conceptos predefinidos por grupo para armar ofertas.</CardDescription>
            </div>
          </div>
          <div className="w-full md:w-auto flex flex-col md:flex-row gap-3">
            <div className="flex flex-wrap gap-2 justify-end">
              <Button onClick={() => handleOpenModal('create')}>
                <PlusCircle className="mr-2 h-4 w-4" /> Crear concepto
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
                { id: 'grupo', label: 'Grupo', type: 'select', options: gruposOptions },
                { id: 'activos', label: 'Solo activos', type: 'select', options: [
                  { value: 'true', label: 'Sí' },
                  { value: 'false', label: 'No' },
                ]},
              ]}
              onRemoveFilter={handleRemoveFilter}
            />
          </div>
          <DataTable
            data={displayedData}
            columns={columns}
            isLoading={isLoading}
            onAction={handleAction}
            page={currentPage}
            limit={itemsPerPage}
            totalRecords={totalItems}
            onPageChange={handlePageChange}
            onLimitChange={handleLimitChange}
          />
          <FilterDrawer
            isOpen={isDrawerOpen}
            onClose={() => setIsDrawerOpen(false)}
            fields={[
              { id: 'grupo', label: 'Grupo', type: 'select', options: gruposOptions },
              { id: 'activos', label: 'Solo activos', type: 'select', options: [
                { value: 'true', label: 'Sí' },
                { value: 'false', label: 'No' },
              ]},
            ]}
            initialFilters={filters}
            onChange={handleFilterChange}
            onApply={handleFilterChange}
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
            fields={offerConceptsFields}
            title={currentItem ? 'Editar concepto de oferta' : 'Crear nuevo concepto de oferta'}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default OfferConceptsPage;
