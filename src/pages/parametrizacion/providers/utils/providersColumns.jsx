export const providersColumns = [
  { id: 'nombre', label: 'Nombre', accessorKey: 'nombre', sortable: true, type: 'text', required: true },
  { id: 'nit', label: 'NIT', accessorKey: 'nit', sortable: true, type: 'text', required: true },
  { id: 'nombre_contacto', label: 'Nombre Contacto', accessorKey: 'nombre_contacto', sortable: true, type: 'text', required: false },
  { id: 'celular', label: 'Celular', accessorKey: 'celular', sortable: true, type: 'text', required: false },
  { id: 'correo', label: 'Correo', accessorKey: 'correo', sortable: true, type: 'email', required: false },
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
];

export const columnsExcel = providersColumns
  .filter(c => c.id !== 'actions')
  .map(c => ({ header: c.label, key: c.accessorKey }));
