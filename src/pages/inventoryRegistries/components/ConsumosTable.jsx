import React, { useEffect, useState, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import DataTable from '@/components/DataTable';
import Pagination from '@/components/Pagination';
import { useToast } from '@/components/ui/use-toast';
import { fetchInventoryRegistries, getTotalsUsedByProduct } from '../services/inventoryRegistries.services';
import { inventoryRegistriesColumns } from '../utils/inventoryRegistriesColumns';
import { fetchProducts } from '@/pages/parametrizacion/products/Services/products.services';
import FilterDrawer from '@/components/FilterDrawer';
import AppliedFilters from '@/components/AppliedFilters';
import ExportExcelButton from '@/components/ExportExcelButton';
import { deleteInventoryRegistry } from '../services/inventoryRegistries.services';
import { useAuth } from '@/contexts/AuthContext';

const ITEMS_PER_PAGE = 10;

const ConsumosTable = ({ idLavanderia, refreshKey, isExternalLoading = false }) => {
  const { toast } = useToast();
  const { isAdmin } = useAuth();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [totalsUsed, setTotalsUsed] = useState([]);
  const [loadingTotals, setLoadingTotals] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [filters, setFilters] = useState({}); // expects { fecha: {$gte,$lte}, 'producto.id': '...' }
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const query = { idLavanderia, tipoMovimiento: 'consumo', ...filters };
      const { data: rows, totalRecords } = await fetchInventoryRegistries({ limit: ITEMS_PER_PAGE, offset: currentPage, query });
      setData(rows);
      setTotalItems(totalRecords);
    } catch (e) {
      console.error('Error cargando consumos:', e);
      toast({ title: 'Error', description: 'No se pudieron cargar los consumos.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [idLavanderia, currentPage, filters, toast]);

  useEffect(() => { load(); }, [load, refreshKey, filters, currentPage]);

  // Totales de cantidad usada por producto
  useEffect(() => {
    const fetchTotals = async () => {
      if (!idLavanderia) {
        setTotalsUsed([]);
        return;
      }
      setLoadingTotals(true);
      try {
        const from = filters?.fecha?.$gte ? filters.fecha.$gte : undefined;
        const to = filters?.fecha?.$lte ? filters.fecha.$lte : undefined;
        const data = await getTotalsUsedByProduct({ lavanderiaId: idLavanderia, from, to });
        let arr = Array.isArray(data) ? data : [];
        if (filters['producto.id']) {
          arr = arr.filter(t => (t?.producto?.id) === filters['producto.id']);
        }
        setTotalsUsed(arr);
      } catch (e) {
        setTotalsUsed([]);
      } finally {
        setLoadingTotals(false);
      }
    };
    fetchTotals();
  }, [idLavanderia, refreshKey, filters]);

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

  // Columnas relevantes para consumos
  const columns = inventoryRegistriesColumns.filter(c => [
    'fecha',
    'producto',
    'tipoMovimiento',
    'cantidadInicial',
    'cantidadUsada',
    'cantidadRestante',
    'costoUnitario',
    'observacion',
    'createdAt'
  ].includes(c.id));

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
            <CardTitle className="text-lg">Tabla de Consumos</CardTitle>
            <CardDescription>
              Movimientos tipo consumo
              <div className="mt-1 text-[11px] text-muted-foreground overflow-x-auto whitespace-nowrap">
                <span className="font-medium">TOTALES:</span>{' '}
                {loadingTotals ? 'Cargando…' : (
                  totalsUsed.length === 0 ? '—' : totalsUsed
                    .map(t => `${t?.producto?.nombre || 'Producto'}: ${(Number(t?.totalUsado)||0).toLocaleString('es-CO')}`)
                    .join(' · ')
                )}
              </div>
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <ExportExcelButton
              title="Consumos"
              columns={columns}
              getData={() => import('../services/inventoryRegistries.services').then(m => m.exportInventoryRegistries({ query: { idLavanderia, tipoMovimiento: 'consumo', ...filters } }))}
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
        <DataTable data={data} columns={columnsWithActions} isLoading={loading || isExternalLoading} showCreateButton={false} onAction={handleAction} />
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

export default ConsumosTable;
