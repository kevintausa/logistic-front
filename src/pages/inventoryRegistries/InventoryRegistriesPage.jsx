import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Package, PlusCircle, FilterIcon, ArrowLeft, ArrowDownCircle, ArrowRightLeft, ShoppingCart } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import DataTable from '@/components/DataTable';
import Pagination from '@/components/Pagination';
import { useToast } from '@/components/ui/use-toast';
import { inventoryRegistriesColumns, columnsExcel } from './utils/inventoryRegistriesColumns';
import { fetchInventoryRegistries, createInventoryRegistry, updateInventoryRegistry, deleteInventoryRegistry, exportInventoryRegistries } from './services/inventoryRegistries.services';
import FilterDrawer from '@/components/FilterDrawer';
import ExportExcelButton from '@/components/ExportExcelButton';
import AppliedFilters from '@/components/AppliedFilters';
import DynamicFormModal from '@/components/DynamicFormModal';
import InventoryCurrentCards from './components/InventoryCurrentCards';
import ConsumosTable from './components/ConsumosTable';
import TrasladosTable from './components/TrasladosTable';
import OrderModal from './components/OrderModal';
import OrdersTable from './components/OrdersTable';
import { fetchLaundryProducts } from '@/pages/laundry/services/laundryProducts.services';
import EntryModal from './components/EntryModal';
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle 
} from "@/components/ui/alert-dialog";
import { fetchLaundryById } from '@/pages/parametrizacion/laundries/Services/laundries.services';

const ITEMS_PER_PAGE = 10;

const InventoryRegistriesPage = () => {
  const { idLavanderia } = useParams();
  const { toast } = useToast();
  const [displayedData, setDisplayedData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [laundryName, setLaundryName] = useState('');
  
  // Obtener la fecha de hoy en formato ISO para el filtro
  const today = new Date();
  const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0).toISOString();
  const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59).toISOString();

  // Inicializar filtros con la fecha actual y el ID de lavandería
  const [filters, setFilters] = useState({
    idLavanderia: idLavanderia,
    fecha: {
      $gte: startOfDay,
      $lte: endOfDay
    }
  });
  
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEntryModalOpen, setIsEntryModalOpen] = useState(false);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState(null);
  const [modalMode, setModalMode] = useState('create');
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  // Productos registrados (para acelerar selects y disponer en la página)
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  // Refresh key para Inventario Actual (colección)
  const [invCurrentRefreshKey, setInvCurrentRefreshKey] = useState(0);
  const [consumosRefreshKey, setConsumosRefreshKey] = useState(0);
  const [ordersRefreshKey, setOrdersRefreshKey] = useState(0);
  const [isConsumoSaving, setIsConsumoSaving] = useState(false);

  const fetchAndSetInventoryRegistries = useCallback(async () => {
    setIsLoading(true);
    try {
      const offset = currentPage;
      const { data, totalRecords } = await fetchInventoryRegistries({ 
        limit: ITEMS_PER_PAGE, 
        offset, 
        query: filters 
      });
      setDisplayedData(data);
      setTotalItems(totalRecords);
    } catch (error) {
      toast({ 
        title: 'Error', 
        description: error.message || 'No se pudieron obtener los registros de inventario.', 
        variant: 'destructive' 
      });
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, filters, toast]);

  const fetchLaundryInfo = async () => {
    try {
      const laundryData = await fetchLaundryById(idLavanderia);
      if (laundryData) {
        setLaundryName(laundryData.nombre || 'Centro de lavado');
      }
    } catch (error) {
      console.error('Error obteniendo información de la lavandería:', error);
    }
  };

  useEffect(() => {
    fetchAndSetInventoryRegistries();
    fetchLaundryInfo();
  }, [fetchAndSetInventoryRegistries]);

  // Cargar productos del centro (catálogo por lavandería) al entrar a la página
  useEffect(() => {
    const loadProducts = async () => {
      try {
        setLoadingProducts(true);
        const { data: rows } = await fetchLaundryProducts({ lavanderiaId: idLavanderia, onlyActive: true });
        // Mapear al shape esperado por EntryModal/OrderModal: {_id, nombre, unidad?, presentacionLitros, costo, stockMinimo}
        const mapped = Array.isArray(rows) ? rows.map(it => ({
          _id: it?.producto?.id || it?.producto?.Id || it?.productoId || it?._id, // usar id del producto global para mantener compatibilidad
          nombre: it?.producto?.nombre || '',
          presentacionLitros: Number(it?.presentacionLitros ?? 0),
          costo: Number(it?.costo ?? 0),
          stockMinimo: Number(it?.stockMinimo ?? 0),
          // unidad puede no estar disponible; dejar undefined
        })) : [];
        setProducts(mapped);
      } catch (error) {
        console.error('Error cargando productos:', error);
        toast({ title: 'Error', description: 'No se pudieron cargar los productos.', variant: 'destructive' });
      } finally {
        setLoadingProducts(false);
      }
    };
    loadProducts();
  }, [toast, idLavanderia]);

  // KPIs de la página actual (basados en los datos de la página, no del total)
  const pageCounts = useMemo(() => {
    const total = displayedData?.length || 0;
    const entradas = displayedData?.filter?.(r => r.tipoMovimiento === 'entrada')?.length || 0;
    const consumos = displayedData?.filter?.(r => r.tipoMovimiento === 'consumo')?.length || 0;
    return { total, entradas, consumos };
  }, [displayedData]);

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
      // Mapear valores de selects a IDs si vienen como objeto
      if (itemData.producto && typeof itemData.producto === 'object') {
        itemData.producto = itemData.producto.id;
      }
      if (itemData.lavanderiaDestino && typeof itemData.lavanderiaDestino === 'object') {
        itemData.lavanderiaDestino = itemData.lavanderiaDestino.id;
      }

      // Asegurar que idLavanderia (origen) está presente
      itemData.idLavanderia = idLavanderia;
      
      if (modalMode === 'create') {
        await createInventoryRegistry(itemData);
        toast({ title: "Éxito", description: "Registro de inventario creado correctamente." });
        // Refrescar Inventario Actual
        setInvCurrentRefreshKey((k) => k + 1);
      } else if (modalMode === 'edit') {
        await updateInventoryRegistry(currentItem._id, itemData);
        toast({ title: "Éxito", description: "Registro de inventario actualizado correctamente." });
        setInvCurrentRefreshKey((k) => k + 1);
      }
      handleCloseModal();
      fetchAndSetInventoryRegistries();
    } catch (error) {
      console.error("Error guardando registro de inventario:", error);
      const errorMessage = error.response?.data?.message || error.message || "Ocurrió un problema al guardar el registro.";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const handleDeleteConfirmation = (item) => {
    setItemToDelete(item);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteItem = async () => {
    try {
      if (itemToDelete) {
        const response = await deleteInventoryRegistry(itemToDelete._id);
        if (response.code === 200) {
          toast({ title: "Registro eliminado", description: "El registro fue eliminado correctamente." });
          fetchAndSetInventoryRegistries();
          setInvCurrentRefreshKey((k) => k + 1);
        } else {
          toast({
            title: "Error",
            description: "No se pudo eliminar el registro.",
            variant: "destructive",
          });
        }
      }
    } catch (error) {
      console.error("Error eliminando registro:", error);
      toast({
        title: "Error",
        description: error.message || "Ocurrió un problema al eliminar el registro.",
        variant: "destructive",
      });
    } finally {
      setIsDeleteDialogOpen(false);
      setItemToDelete(null);
    }
  };

  const handleAction = (actionType, row) => {
    switch (actionType) {
      case 'edit':
        handleOpenModal('edit', row);
        break;
      case 'delete':
        handleDeleteConfirmation(row);
        break;
      default:
        break;
    }
  };

  const handleFilterChange = (newFilters) => {
    setCurrentPage(1); // Reset to first page when filters change
    setFilters({ ...newFilters, idLavanderia });
  };

  const handleRemoveFilter = (key) => {
    const newFilters = { ...filters };
    if (key !== 'idLavanderia') {
      delete newFilters[key];
      setFilters(newFilters);
      setCurrentPage(1);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      exit={{ opacity: 0, y: -20 }} 
      className="container py-6"
    >
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center">
          <Button asChild variant="outline" className="mr-4">
          <Link to={`/centros-lavado/${idLavanderia}`}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Volver
          </Link>
          </Button>
          <h1 className="text-2xl font-bold">Registro de Inventario - {laundryName}</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            title="Registrar entrada de producto"
            onClick={() => setIsEntryModalOpen(true)}
          >
            <ArrowDownCircle className="h-5 w-5 text-green-600" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            title="Crear traslado"
            onClick={() => handleOpenModal('create', { tipoMovimiento: 'trasladoSalida', fecha: new Date().toISOString() })}
          >
            <ArrowRightLeft className="h-5 w-5 text-blue-600" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            title="Hacer pedido"
            onClick={() => setIsOrderModalOpen(true)}
            disabled = {true}
          >
            <ShoppingCart className="h-5 w-5 text-amber-600" />
          </Button>
        </div>
      </div>

      {/* Sección 1: Inventario Actual */}
      <InventoryCurrentCards
        idLavanderia={idLavanderia}
        laundryName={laundryName}
        refreshKey={invCurrentRefreshKey}
        onSavingStart={() => setIsConsumoSaving(true)}
        onSaved={() => setConsumosRefreshKey((k) => k + 1)}
        onSavingEnd={() => setIsConsumoSaving(false)}
      />

      {/* Sección 2: Tabla de Consumos */}
      <ConsumosTable idLavanderia={idLavanderia} refreshKey={consumosRefreshKey} isExternalLoading={isConsumoSaving} />

      {/* Sección 3: Traslados */}
      <TrasladosTable idLavanderia={idLavanderia} />

      {/* Sección 4: Pedidos */}
      <div className="mt-6">
        <OrdersTable idLavanderia={idLavanderia} refreshKey={ordersRefreshKey} />
      </div>

      {/* Modal: Registrar entrada */}
      <EntryModal
        open={isEntryModalOpen}
        onOpenChange={setIsEntryModalOpen}
        idLavanderia={idLavanderia}
        laundryName={laundryName}
        products={products}
        loadingProducts={loadingProducts}
        onCreated={() => {
          fetchAndSetInventoryRegistries();
          setInvCurrentRefreshKey((k) => k + 1);
        }}
      />

      {/* Modal: Hacer pedido */}
      <OrderModal
        open={isOrderModalOpen}
        onOpenChange={setIsOrderModalOpen}
        idLavanderia={idLavanderia}
        laundryName={laundryName}
        products={products}
        loadingProducts={loadingProducts}
        onCreated={() => {
          setOrdersRefreshKey((k) => k + 1);
        }}
      />


      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro de eliminar este registro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Esto eliminará permanentemente el registro
              del producto {itemToDelete?.producto?.nombre || ''} del día {itemToDelete?.fecha ? new Date(itemToDelete.fecha).toLocaleDateString() : ''}.
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

export default InventoryRegistriesPage;
