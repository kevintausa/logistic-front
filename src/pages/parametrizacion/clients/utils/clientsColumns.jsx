export const clientsColumns = [
  { id: 'estado', label: 'Estado', type: 'select', sortable: true, required: true, options: [
    { value: 'Activo', label: 'Activo' },
    { value: 'Inactivo', label: 'Inactivo' },
  ] },
  { id: 'nombre', label: 'Nombre', type: 'text', sortable: true, required: true },
  { id: 'nit', label: 'NIT', type: 'text', sortable: true, required: true },
  { id: 'direccion', label: 'Dirección', type: 'text', sortable: true, required: true },
  { id: 'telefono', label: 'Teléfono', type: 'text', sortable: true, required: true },
  { id: 'costo_kilo', label: 'Costo por Kilo', type: 'number', sortable: true, required: true },
  { 
    id: 'lavanderia', 
    label: 'Centro de Lavado', 
    type: 'asyncSelect', 
    sortable: true, 
    required: true, 
    fetchOptions: async () => {
      try {
        const { fetchLaundries } = await import('@/pages/parametrizacion/laundries/Services/laundries.services.jsx');
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
  { id: 'asesor', label: 'Asesor', type: 'text', sortable: true, required: false },
  { id: 'contacto', label: 'Contacto', type: 'text', sortable: true, required: false },
];

export const columnsExcel = clientsColumns.map(col => {
  if (col.id === 'lavanderia') {
    return { key: 'lavanderia.nombre', header: col.label };
  }
  return { key: col.id, header: col.label };
});
