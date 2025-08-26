import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { fetchProducts } from '@/pages/parametrizacion/products/Services/products.services.js';
import { fetchLaundries } from '@/pages/parametrizacion/laundries/Services/laundries.services.jsx';

// Helper: safely parse various date input shapes
const toValidDate = (value) => {
  try {
    if (!value) return null;
    // If Mongo extended JSON { $date: '...' }
    if (typeof value === 'object' && value.$date) {
      const d = new Date(value.$date);
      return isNaN(d.getTime()) ? null : d;
    }
    // Already a Date
    if (value instanceof Date) {
      return isNaN(value.getTime()) ? null : value;
    }
    // Number (timestamp) or string (ISO)
    const d = new Date(value);
    return isNaN(d.getTime()) ? null : d;
  } catch {
    return null;
  }
};

export const inventoryRegistriesColumns = [
  {
    id: 'fecha',
    label: 'Fecha',
    type: 'date',
    sortable: true,
    required: true,
    isFilter: true,
    render: (row, column) => {
      const value = row?.[column.id];
      const d = toValidDate(value);
      if (!d) return '-';
      return format(d, 'dd/MM/yyyy', { locale: es });
    }
  },
  {
    id: 'producto',
    label: 'Producto',
    type: 'asyncSelect',
    sortable: true,
    required: true,
    isFilter: true,
    fetchOptions: async () => {
      try {
        const response = await fetchProducts({
          limit: 100,
          offset: 1,
          query: { estado: 'Activo' }
        });

        if (response && response.data) {
          return response.data.map(product => ({
            value: { id: product._id, nombre: product.nombre, unidad: product.unidad || '' },
            label: `${product.nombre} (${product.unidad || 'Sin unidad'})`
          }));
        }
        return [];
      } catch (error) {
        console.error('Error cargando productos:', error);
        return [];
      }
    },
    render: (row, column) => {
      const value = row?.[column.id];
      if (!value) return '-';
      if (typeof value === 'object') {
        return value.nombre || '-';
      }
      return value;
    }
  },
  {
    id: 'tipoMovimiento',
    label: 'Tipo de Movimiento',
    type: 'select',
    sortable: true,
    required: true,
    isFilter: true,
    options: [
      { value: 'entrada', label: 'Entrada' },
      { value: 'consumo', label: 'Consumo' },
      { value: 'trasladoSalida', label: 'Traslado (Salida)' },
      { value: 'trasladoEntrada', label: 'Traslado (Entrada)' },
    ],
    render: (row, column) => {
      const value = row?.[column.id];
      if (!value) return '-';
      return value;
    }
  },
  {
    id: 'cantidad',
    label: 'Cantidad',
    type: 'number',
    sortable: true,
    required: true,
    render: (row, column) => {
      const value = row?.[column.id];
      if (value === null || value === undefined) return '-';
      return Number(value).toLocaleString();
    }
  },
  {
    id: 'cantidadInicial',
    label: 'Cantidad Inicial',
    type: 'number',
    sortable: true,
    required: false,
    render: (row, column) => {
      const value = row?.[column.id];
      if (value === null || value === undefined) return '-';
      return Number(value).toLocaleString();
    }
  },
  {
    id: 'cantidadUsada',
    label: 'Cantidad Usada',
    type: 'number',
    sortable: true,
    required: false,
    render: (row, column) => {
      const value = row?.[column.id];
      if (value === null || value === undefined) return '-';
      return Number(value).toLocaleString();
    }
  },
  {
    id: 'cantidadRestante',
    label: 'Cantidad Restante',
    type: 'number',
    sortable: true,
    required: false,
    render: (row, column) => {
      const value = row?.[column.id];
      if (value === null || value === undefined) return '-';
      return Number(value).toLocaleString();
    }
  },
  {
    id: 'costoUnitario',
    label: 'Costo Unitario',
    type: 'number',
    sortable: true,
    required: false,
    isFilter: false,
    render: (row, column) => {
      const value = row?.[column.id];
      if (value === null || value === undefined || value === '') return '-';
      return Number(value).toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });
    }
  },
  {
    id: 'numeroFactura',
    label: 'Número de Factura',
    type: 'text',
    sortable: true,
    required: false,
    isFilter: true,
    render: (row, column) => {
      const value = row?.[column.id];
      if (!value) return '-';
      return value;
    }
  },
  {
    id: 'lavanderiaDestino',
    label: 'Lavandería Destino',
    type: 'asyncSelect',
    sortable: true,
    required: false,
    isFilter: false,
    fetchOptions: async () => {
      try {
        const response = await fetchLaundries({ limit: 100, offset: 1, query: { estado: 'Activo' } });
        if (response && response.data) {
          return response.data.map(l => ({ value: { id: l._id, nombre: l.nombre }, label: l.nombre }));
        }
        return [];
      } catch (error) {
        console.error('Error cargando lavanderías:', error);
        return [];
      }
    },
    render: (row, column) => {
      const value = row?.[column.id];
      if (!value) return '-';
      if (typeof value === 'object') return value.nombre || '-';
      return value;
    }
  },
  {
    id: 'observacion',
    label: 'Observación',
    type: 'textarea',
    sortable: false,
    required: false,
    render: (row, column) => {
      const value = row?.[column.id];
      if (!value) return '-';
      return value;
    }
  },
  {
    id: 'createdAt',
    label: 'Fecha de Registro',
    type: 'date',
    sortable: true,
    isFilter: true,
    isForm: false,
    render: (row, column) => {
      const value = row?.[column.id];
      const d = toValidDate(value);
      if (!d) return '-';
      return format(d, 'dd/MM/yyyy HH:mm', { locale: es });
    }
  },
];

export const columnsExcel = [
  { key: 'fecha', header: 'Fecha', formatDate: true },
  { key: 'producto.nombre', header: 'Producto' },
  { key: 'tipoMovimiento', header: 'Tipo de Movimiento' },
  { key: 'cantidad', header: 'Cantidad' },
  { key: 'costoUnitario', header: 'Costo Unitario' },
  { key: 'lavanderiaDestino.nombre', header: 'Lavandería Destino' },
  { key: 'observacion', header: 'Observación' },
  { key: 'createdAt', header: 'Fecha de Registro', formatDate: true },
];
