// Componente Badge personalizado con span y clases
const CustomBadge = ({ variant, children }) => {
  const styles = {
    success: 'font-semibold text-green-700 bg-green-100 px-2 py-1 rounded-md',
    destructive: 'font-semibold text-red-700 bg-red-100 px-2 py-1 rounded-md',
  };
  return <span className={styles[variant] || 'bg-gray-100 px-2 py-1 rounded-md'}>{children}</span>;
};

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
    type: 'status',
    cell: ({ value }) => (
      <CustomBadge variant={value === 'Activo' ? 'success' : 'destructive'}>{value}</CustomBadge>
    ),
    options: [
        { value: 'Activo', label: 'Activo' },
        { value: 'Inactivo', label: 'Inactivo' },
    ],
    required: true,
  },
];

export const columnsExcel = productsColumns
  .filter(c => c.id !== 'actions' && c.id !== 'foto') 
  .map(c => ({ header: c.label, key: c.accessorKey }));
