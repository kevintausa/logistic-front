
export const servicesColumns = [
  {
    id: 'nombre',
    label: 'Nombre',
    sortable: true,
    type: 'text',
    required: true,
  },
  {
    id: 'tipo',
    label: 'Tipo',
    sortable: true,
    type: 'select',
    required: true,
    options: [
      { value: 'Agua', label: 'Agua' },
      { value: 'Agua_caliente', label: 'Agua caliente' },
      { value: 'Gas', label: 'Gas' },
      { value: 'Electricidad', label: 'Electricidad' },
      { value: 'Internet', label: 'Internet' },
    ]
  },
  {
    id: 'contador',
    label: 'Contador',
    sortable: true,
    type: 'number',
    required: true
  },
  {
    id: 'lavanderia', label: 'Centro de Lavado', type: 'asyncSelect', sortable: true, required: true,
    fetchOptions: async () => {
      try {
        // Importamos dinámicamente para evitar problemas de importación circular
        const { fetchLaundries } = await import('@/pages/parametrizacion/laundries/Services/laundries.services');
        const response = await fetchLaundries({ limit: 100, offset: 1, query: { estado: 'Activo' } });

        if (response && response.data) {
          return response.data.map(laundry => ({
            value: { id: laundry._id, nombre: laundry.nombre },
            label: laundry.nombre
          }));
        }
        return [];
      } catch (error) {
        console.error('Error cargando centros de lavado:', error);
        return [];
      }
    }
  },
  {
    id: 'proveedor',
    label: 'Proveedor',
    sortable: true,
    type: 'text',
    required: true,
  },
  {
    id: 'unidad',
    label: 'Unidad',
    sortable: true,
    type: 'select',
    required: true,
    options: [
      { value: 'kwh', label: 'kwh' },
      { value: 'galones', label: 'galones' },
      { value: 'litros', label: 'litros' },
      { value: 'm3', label: 'm3' },
    ],
  },
  {
    id: 'precio',
    label: 'Precio',
    sortable: true,
    type: 'number',
    required: true,
  },
  {
    id: 'createdAt',
    label: 'Fecha de Creación',
    type: 'date',
    cell: ({ row }) => new Date(row.original.createdAt).toLocaleDateString(),
  },
  {
    id: 'estado',
    label: 'Estado',
    type: 'select',
    required: true,
    options: [
      { value: 'Activo', label: 'Activo' },
      { value: 'Inactivo', label: 'Inactivo' },
    ],
    render: (row) => row.estado,
  },
];

export const columnsExcel = [
  { header: 'Nombre', key: 'nombre', width: 20 },
  { header: 'Contador', key: 'contador', width: 15 },
  { header: 'Centro de Lavado', key: 'lavanderia.nombre', width: 25 },
  { header: 'Proveedor', key: 'proveedor', width: 25 },
  { header: 'Fecha de Creación', key: 'createdAt', width: 20 },
  { header: 'Estado', key: 'estado', width: 15 },
];
