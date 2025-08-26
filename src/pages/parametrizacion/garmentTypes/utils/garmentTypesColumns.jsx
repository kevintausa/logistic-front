export const garmentTypesColumns = [
  { id: 'nombre', label: 'Nombre', type: 'text', sortable: true, required: true },
  { id: 'peso', label: 'Peso (kg)', type: 'number', sortable: true, required: true },
  { 
    id: 'lavanderia', 
    label: 'Centro de Lavado', 
    type: 'asyncSelect', 
    sortable: true, 
    required: true, 
    fetchOptions: async () => {
      try {
        // Importamos dinámicamente para evitar problemas de importación circular
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
  {
    id: 'estado',
    label: 'Estado',
    type: 'select',
    sortable: true,
    required: true,
    options: [
      { value: 'Activo', label: 'Activo' },
      { value: 'Inactivo', label: 'Inactivo' },
    ],
  },
];

export const columnsExcel = {
  nombre: 'Nombre',
  peso: 'Peso (kg)',
  'lavanderia.nombre': 'Centro de Lavado',
  estado: 'Estado',
  createdAt: 'Fecha de Creación',
  updatedAt: 'Fecha de Actualización',
};
