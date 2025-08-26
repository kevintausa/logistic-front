export const washingProgramsColumns = [
  {
    id: 'numero_programa',
    label: 'Número de Programa',
    type: 'number',
    required: true,
  },
  {
    id: 'nombre',
    label: 'Nombre del Programa',
    type: 'text',
    required: true,
  },
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
  {
    id: 'nivel_suciedad',
    label: 'Nivel de Suciedad',
    type: 'select',
    required: true,
    options: [
      { value: 'alto', label: 'Alto' },
      { value: 'medio', label: 'Medio' },
      { value: 'bajo', label: 'Bajo' },
    ],
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
  },
  {
    id:'factorCarga',
    label:'Factor de Carga (1/F)',
    type:'number',
    required:true
  }
];

export const columnsExcel = {
  numero_programa: 'Número de Programa',
  nombre: 'Nombre del Programa',
  'lavanderia.nombre': 'Centro de Lavado',
  nivel_suciedad: 'Nivel de Suciedad',
  estado: 'Estado',
  createdAt: 'Fecha de Creación',
};
