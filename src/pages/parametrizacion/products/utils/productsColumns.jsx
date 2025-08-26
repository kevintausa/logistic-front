

export const productsColumns = [
  {
    id: 'nombre',
    label: 'Nombre',
    accessorKey: 'nombre',
    sortable: true,
    type: 'text',
    required: true,
  },
  {
    id: 'proveedor',
    label: 'Proveedor',
    accessorKey: 'proveedor',
    sortable: true,
    type: 'asyncSelect',
    // Carga proveedores parametrizados y devuelve opciones con value = {id, nombre}
    fetchOptions: async () => {
      const { fetchProviders } = await import('@/pages/parametrizacion/providers/Services/providers.services');
      const res = await fetchProviders({ limit: 500, offset: 1, query: { estado: 'Activo' } });
      const list = Array.isArray(res?.data) ? res.data : Array.isArray(res?.items) ? res.items : [];
      return list.map(p => ({ value: { id: p._id || p.id, nombre: p.nombre }, label: p.nombre }));
    },
    // Mostrar nombre en tabla si llega objeto
    cell: ({ value }) => (value?.nombre || value || ''),
    required: true,
  },
  {
    id: 'unidad',
    label: 'Unidad',
    accessorKey: 'unidad',
    sortable: true,
    type: 'text',
    required: true,
  },
  {
    id: 'presentacionLitros',
    label: 'Presentación (L)',
    accessorKey: 'presentacionLitros',
    sortable: true,
    type: 'number',
    required: true,
  },
  {
    id: 'costo',
    label: 'Costo',
    accessorKey: 'costo',
    sortable: true,
    type: 'number',
    required: true,
    cell: ({ value }) => `$${value}`
  },
  {
    id: 'estado',
    label: 'Estado',
    accessorKey: 'estado',
    sortable: true,
    type: 'select',
    options: [
        { value: 'Activo', label: 'Activo' },
        { value: 'Inactivo', label: 'Inactivo' },
    ],
    required: true,
  },
  {
    id: 'stockMinimo',
    label: 'Stock Mínimo',
    accessorKey: 'stockMinimo',
    sortable: true,
    type: 'number',
    required: true,
  },

];

export const columnsExcel = productsColumns
  .filter(c => c.id !== 'actions' && c.id !== 'foto') 
  .map(c => ({ header: c.label, key: c.accessorKey }));
