import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Package, PlusCircle, FilterIcon } from 'lucide-react';
import AppliedFilters from '@/components/AppliedFilters';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import DataTable from '@/components/DataTable';
import Pagination from '@/components/Pagination';
import DynamicFormModal from '@/components/DynamicFormModal';
import { useToast } from '@/components/ui/use-toast';
import { productsColumns, columnsExcel } from '@/pages/parametrizacion/products/utils/productsColumns.jsx';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { fetchProducts, createProduct, updateProduct, deleteProduct, exportProducts } from '@/pages/parametrizacion/products/Services/products.services';
import { fetchProviders } from '@/pages/parametrizacion/providers/Services/providers.services';
import FilterDrawer from '@/components/FilterDrawer';
import ExportExcelButton from '@/components/ExportExcelButton';

const ITEMS_PER_PAGE = 10;
const DEFAULT_FILTERS = { estado: 'Activo' };

const ProductsPage = () => {
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

  // Preload providers once on page load to avoid fetching in modal
  const [providersOptions, setProvidersOptions] = useState([]);
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetchProviders({ limit: 500, offset: 1, query: { estado: 'Activo' } });
        const list = Array.isArray(res?.data) ? res.data : Array.isArray(res?.items) ? res.items : [];
        const opts = list.map(p => ({ value: { id: p._id || p.id, nombre: p.nombre }, label: p.nombre }));
        if (mounted) setProvidersOptions(opts);
      } catch (e) {
        // Silent fail; the modal still has fetchOptions as fallback
        console.error('No se pudieron cargar proveedores', e);
      }
    })();
    return () => { mounted = false; };
  }, []);

  // Inject preloaded providers options into the proveedor field so modal doesn't refetch
  const fieldsForModal = useMemo(() => {
    return productsColumns.map(col => {
      if (col.id === 'proveedor') {
        return { ...col, options: providersOptions };
      }
      return col;
    });
  }, [providersOptions]);

  const fetchAndSetProducts = useCallback(async () => {
    setIsLoading(true);
    try {
      const offset = currentPage;
      const { data, totalRecords } = await fetchProducts({ limit: ITEMS_PER_PAGE, offset, query: filters });
      setDisplayedData(data);
      setTotalItems(totalRecords);
    } catch (error) {
      toast({ title: 'Error', description: error.message || 'No se pudieron obtener los productos.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, filters, toast]);

  useEffect(() => {
    fetchAndSetProducts();
  }, [fetchAndSetProducts]);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleOpenModal = (mode, item = null) => {
    setModalMode(mode);
    setCurrentItem(item);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setCurrentItem(null);
  };

  const handleSaveItem = async (itemData) => {
    try {
      if (modalMode === 'create') {
        const response = await createProduct(itemData);
        if (response.code === 201) {
          toast({ title: "Producto creado", description: "El producto fue registrado correctamente." });
        } else {
          throw new Error(response.message || "Error al crear producto");
        }
      } else if (modalMode === 'edit') {
        const response = await updateProduct(currentItem._id, itemData);
        if (response.code === 200) {
          toast({ title: "Producto actualizado", description: "Los datos fueron actualizados correctamente." });
        } else {
          throw new Error(response.message || "Error al actualizar producto");
        }
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "Ocurrió un problema al guardar el producto.",
        variant: "destructive",
      });
    } finally {
      handleCloseModal();
      fetchAndSetProducts();
    }
  };

  const handleDeleteConfirmation = (item) => {
    setItemToDelete(item);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteItem = async () => {
    try {
      if (itemToDelete) {
        const response = await deleteProduct(itemToDelete._id);
        if (response.code === 200) {
          toast({ title: "Producto eliminado", description: "El producto fue eliminado correctamente." });
        } else {
          throw new Error(response.message || "Error al eliminar producto");
        }
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "Ocurrió un problema al eliminar el producto.",
        variant: "destructive",
      });
    } finally {
      setIsDeleteDialogOpen(false);
      setItemToDelete(null);
      fetchAndSetProducts();
    }
  };

  const handleAction = (actionType, row) => {
    if (actionType === 'edit') {
      handleOpenModal('edit', row);
    } else if (actionType === 'delete') {
      handleDeleteConfirmation(row);
    } else if (actionType === 'view') {
      toast({ title: "Ver Producto", description: `Visualizando producto: ${row.nombre}` });
    }
  };

  const handleFilterChange = (filters) => {
    setFilters(filters);
    setIsDrawerOpen(false);
  };

  const handleRemoveFilter = (key) => {
    const newFilters = { ...filters };
    delete newFilters[key];
    setFilters(newFilters);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card>
        <CardHeader className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
          <div className="w-full md:w-auto">
            <div className="flex items-center space-x-3 mb-2">
              <Package className="h-8 w-8 text-primary" />
              <CardTitle className="text-2xl">Parametrización de Productos</CardTitle>
            </div>
            <CardDescription>Gestiona los productos de la empresa.</CardDescription>
          </div>

          <div className="w-full flex flex-col gap-3">
    
            <div className="flex flex-wrap gap-2 justify-end">
              <ExportExcelButton
                title="Productos"
                columns={columnsExcel}
                getData={() => exportProducts({query: filters})}
              />
              <Button onClick={() => handleOpenModal('create')}>
                <PlusCircle className="mr-2 h-4 w-4" /> Crear Producto
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
                  { id: 'estado', label: 'Estado', type: 'select', options: [
                    { value: 'Activo', label: 'Activo' },
                    { value: 'Inactivo', label: 'Inactivo' },
                  ]},
                  { id: 'proveedor.id', label: 'Proveedor', type: 'select', options: providersOptions.map(o => ({ value: o.value.id, label: o.label })) },
                ]}
                onRemoveFilter={handleRemoveFilter}
              />
            </div>
          <DataTable
            data={displayedData}
            columns={productsColumns}
            isLoading={isLoading}
            onAction={handleAction}
            showCreateButton={false}
          />
          <Pagination
            currentPage={currentPage}
            totalItems={totalItems}
            itemsPerPage={ITEMS_PER_PAGE}
            onPageChange={handlePageChange}
          />
          <FilterDrawer
            isOpen={isDrawerOpen}
            onClose={() => setIsDrawerOpen(false)}
            fields={[
              {
                id: 'estado', label: 'Estado', type: 'select', options: [
                  { value: 'Activo', label: 'Activo' },
                  { value: 'Inactivo', label: 'Inactivo' },
                ]
              },
              { id: 'proveedor.id', label: 'Proveedor', type: 'select', options: providersOptions.map(o => ({ value: o.value.id, label: o.label })) },
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
            fields={fieldsForModal}
            title={modalMode === 'create' ? 'Crear Nuevo Producto' : 'Editar Producto'}
            mode={modalMode}
          />
        )}
      </AnimatePresence>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro de eliminar este producto?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Esto eliminará permanentemente el producto
              "{itemToDelete?.nombre}" de tus registros.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setItemToDelete(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteItem} className="bg-destructive hover:bg-destructive/90">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
};

export default ProductsPage;
