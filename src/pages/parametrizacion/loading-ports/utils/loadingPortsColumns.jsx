export const loadingPortsColumns = [
  { id: 'estado', label: 'Estado', type: 'select', sortable: true, required: true, options: [
    { value: 'Activo', label: 'Activo' },
    { value: 'Inactivo', label: 'Inactivo' },
  ] },
  { id: 'nombre', label: 'Nombre', type: 'text', sortable: true, required: true },
  { id: 'ciudad', label: 'Ciudad', type: 'text', sortable: true, required: false },
  { id: 'codigo', label: 'Código', type: 'text', sortable: true, required: false },
  { id: 'tipo', label: 'Tipo', type: 'text', sortable: true, required: false },
  {
    id: 'operador',
    label: 'Operador logístico',
    type: 'asyncSelect',
    sortable: true,
    required: false,
    fetchOptions: async () => {
      try {
        const { fetchOperators } = await import('@/pages/parametrizacion/operators/Services/operators.services.jsx');
        const response = await fetchOperators({ limit: 100, offset: 1, query: { estado: 'Activo' } });
        if (response && response.data) {
          return response.data.map(op => ({ value: { id: op._id, nombre: op.nombre }, label: op.nombre }));
        }
        return [];
      } catch (error) {
        console.error('Error cargando operadores:', error);
        return [];
      }
    }
  },
];

export const columnsExcel = loadingPortsColumns.map(col => {
  if (col.id === 'operador') return { key: 'operador.nombre', header: col.label };
  return { key: col.id, header: col.label };
});
