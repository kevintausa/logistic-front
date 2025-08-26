export const machinesColumns = [
  { id: 'estado', label: 'Estado', type: 'select', sortable: true, required: true, options: [
    { value: 'Activa', label: 'Activa' },
    { value: 'Inactiva', label: 'Inactiva' },
  ] },
  { id: 'nombre', label: 'Nombre', type: 'text', sortable: true, required: true },
  { id: 'capacidad', label: 'Capacidad (kg)', type: 'number', sortable: true, required: true },
  { id: 'marca', label: 'Marca', type: 'text', sortable: true, required: true },
  { id: 'contador', label: 'Contador', type: 'number', sortable: true, required: true },
  { 
    id: 'lavanderia', 
    label: 'Centro de Lavado', 
    type: 'asyncSelect', 
    sortable: true, 
    required: true, 
    fetchOptions: async () => {
      try {
        const { fetchLaundries } = await import('@/pages/parametrizacion/laundries/Services/laundries.services');
        const response = await fetchLaundries({ limit: 100, offset: 1, query: { estado: 'Activo' } });
        
        if (response && response.data) {
          return response.data.map(laundry => ({
            value: { 
              id: laundry._id,
              nombre: laundry.nombre 
            },
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
];

export const columnsExcel = machinesColumns.map(col => {
  if (col.id === 'lavanderia') {
    return { key: 'lavanderia.nombre', header: col.label };
  }
  return { key: col.id, header: col.label };
});
