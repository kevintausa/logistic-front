import React, { useEffect, useState, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import DataTable from '@/components/DataTable';
import Pagination from '@/components/Pagination';
import { useToast } from '@/components/ui/use-toast';
import { fetchInventoryRegistries, deleteInventoryRegistry } from '../services/inventoryRegistries.services';
import { inventoryRegistriesColumns } from '../utils/inventoryRegistriesColumns';
import { fetchProducts } from '@/pages/parametrizacion/products/Services/products.services';
import FilterDrawer from '@/components/FilterDrawer';
import AppliedFilters from '@/components/AppliedFilters';
import ExportExcelButton from '@/components/ExportExcelButton';
import { useAuth } from '@/contexts/AuthContext';

const ITEMS_PER_PAGE = 10;

const TrasladosTable = ({ idLavanderia }) => {
  const { toast } = useToast();
  const { isAdmin } = useAuth();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [filters, setFilters] = useState({}); // { fecha: {$gte,$lte}, 'producto.id': '...', tipoMovimiento: 'trasladoSalida' }
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const baseMovs = ['trasladoSalida', 'trasladoEntrada', 'entrada'];
      const query = { idLavanderia, tipoMovimiento: { $in: baseMovs }, ...filters };
      const { data: rows, totalRecords } = await fetchInventoryRegistries({ limit: ITEMS_PER_PAGE, offset: currentPage, query });
      const normalized = (rows || []).map(r => ({
        ...r,
        // Mostrar cantidadInicial como 'cantidad' para entradas si falta cantidad
        cantidad: r?.tipoMovimiento === 'entrada' && (r?.cantidad === undefined || r?.cantidad === null)
          ? r?.cantidadInicial
          : r?.cantidad,
        // Unificar campo de observación
        observacion: r?.observacion ?? r?.observaciones ?? r?.observacion,
      }));
      setData(normalized);
      setTotalItems(totalRecords);
    } catch (e) {
      console.error('Error cargando traslados:', e);
      toast({ title: 'Error', description: 'No se pudieron cargar los traslados.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [idLavanderia, currentPage, filters, toast]);

  useEffect(() => { load(); }, [load, filters, currentPage]);

  // Load products for filter options
  useEffect(() => {
    const loadProducts = async () => {
      setLoadingProducts(true);
      try {
        const res = await fetchProducts({ limit: 500, offset: 1, query: {} });
        setProducts(Array.isArray(res?.data) ? res.data : []);
      } catch (e) {
        setProducts([]);
      } finally {
        setLoadingProducts(false);
      }
    };
    loadProducts();
  }, []);

  // Columnas relevantes para traslados
  const columns = inventoryRegistriesColumns.filter(c => ['fecha', 'numeroFactura', 'producto', 'tipoMovimiento', 'cantidad', 'lavanderiaDestino', 'observacion', 'createdAt'].includes(c.id));

  const actionsColumn = {
    id: 'opciones',
    key: 'opciones',
    label: 'Opciones',
    actions: [
      {
        key: 'delete',
        icon: 'Trash',
        tooltip: 'Eliminar',
        showWhen: () => isAdmin(),
        className: 'text-red-500',
      },
    ],
  };
  const columnsWithActions = [actionsColumn, ...columns];

  const handleAction = async (actionKey, row) => {
    if (actionKey === 'delete') {
      if (!isAdmin()) return;
      const ok = window.confirm('¿Deseas eliminar este registro? Esta acción no se puede deshacer.');
      if (!ok) return;
      try {
        await deleteInventoryRegistry(row._id || row.id);
        toast({ title: 'Eliminado', description: 'Registro eliminado correctamente.' });
        await load();
      } catch (e) {
        toast({ title: 'Error', description: 'No se pudo eliminar el registro.', variant: 'destructive' });
      }
    }
  };

  const productOptions = products.map(p => ({ value: p._id || p.id, label: p.nombre }));

  const filterFields = [
    { id: 'fecha', label: 'Rango de fechas', type: 'daterange' },
    { id: 'producto.id', label: 'Producto', type: 'select', options: [{ value: '', label: '-- Todos --' }, ...productOptions] },
    { id: 'tipoMovimiento', label: 'Tipo movimiento', type: 'select', options: [
      { value: '', label: '-- Todos --' },
      { value: 'trasladoSalida', label: 'Traslado Salida' },
      { value: 'trasladoEntrada', label: 'Traslado Entrada' },
      { value: 'entrada', label: 'Entrada' },
    ] },
  ];

  const handleFilterApply = (newFilters) => {
    setFilters(newFilters);
    setCurrentPage(1);
    setIsDrawerOpen(false);
  };

  const handleRemoveFilter = (key) => {
    const nf = { ...filters };
    delete nf[key];
    setFilters(nf);
  };

  return (
    <Card className="mb-4">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="text-lg">Tabla de Traslados</CardTitle>
            <CardDescription>Movimientos de traslado entre centros</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <ExportExcelButton
              title="Traslados"
              columns={columns}
              getData={() => import('../services/inventoryRegistries.services').then(m => m.exportInventoryRegistries({ query: { idLavanderia, tipoMovimiento: { $in: ['trasladoSalida','trasladoEntrada','entrada'] }, ...filters } }))}
            />
            <Button variant="outline" size="sm" onClick={() => setIsDrawerOpen(true)} disabled={loadingProducts}>
              {loadingProducts ? 'Cargando…' : 'Filtros'}
            </Button>
          </div>
        </div>
        <div className="mt-2">
          <AppliedFilters filters={filters} fields={filterFields} onRemoveFilter={handleRemoveFilter} />
        </div>
      </CardHeader>
      <CardContent>
        <DataTable data={data} columns={columnsWithActions} isLoading={loading} showCreateButton={false} onAction={handleAction} />
        <Pagination currentPage={currentPage} totalItems={totalItems} itemsPerPage={ITEMS_PER_PAGE} onPageChange={setCurrentPage} />
      </CardContent>
      <FilterDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        fields={filterFields}
        initialFilters={filters}
        onChange={handleFilterApply}
        onApply={handleFilterApply}
        initialDay={false}
      />
    </Card>
  );
};

export default TrasladosTable;
