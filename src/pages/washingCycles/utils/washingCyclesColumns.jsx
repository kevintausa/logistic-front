import { format } from 'date-fns';

// Definir columnas como un array simple, no como una función
export const washingCyclesColumns = [
  {
    id: 'fecha',
    label: 'Fecha',
    type: 'daterange',
    sortable: true, 
    required: true,
    isFilter: true,
    isForm: true,
    // Columna 'fecha'
    render: (row) => {
      try {
        const value = row.fecha;
        if (!value) return '-';
        const date = new Date(value);
        if (isNaN(date.getTime())) return 'Fecha inválida';
        
        // Aplicar formato sin ajuste de zona horaria
        const fechaLocal = date; 
          
        return format(fechaLocal, 'dd/MM/yyyy');
      } catch (error) {
        console.error('Error al formatear fecha:', error);
        return 'Fecha inválida';
      }
    }
  },
  {
    id: 'maquina',
    label: 'Máquina',
    type: 'select',
    sortable: true,
    required: true,
    isFilter: true,
    options: [], // Las opciones se inyectarán dinámicamente
    getFilterValueLabel: (value, options) => {
      const option = options.find(opt => opt.value === value);
      return option ? option.label : value;
    },
    // Columna 'máquina'
    render: (row) => {
      try {
        const value = row.maquina;
        if (!value) return '-';
        if (typeof value === 'object') {
          return value.nombre || '-';
        }
        return String(value);
      } catch (error) {
        console.error('Error al renderizar máquina:', error);
        return '-';
      }
    }
  },
  {
    id: 'ciclos',
    label: 'Ciclos Completados',
    type: 'number',
    sortable: true,
    required: true,
    // Columna 'ciclos'
    render: (row) => {
      try {
        const value = row.ciclos;
        if (value === null || value === undefined) return '-';
        return String(value);
      } catch (error) {
        console.error('Error al renderizar ciclos:', error);
        return '-';
      }
    }
  },
  {
    id: 'kilosLavados',
    label: 'Kilos Lavados',
    type: 'number',
    sortable: true,
    isForm: false, // Se calcula automáticamente
    // Columna 'kilosLavados'
    render: (row) => {
      try {
        const value = row.kilosLavados;
        if (value === null || value === undefined) return '-';
        // Asegurar que es un número
        const numValue = Number(value);
        if (isNaN(numValue)) return '0 kg';
        return `${numValue.toLocaleString()} kg`;
      } catch (error) {
        console.error('Error al formatear kilos lavados:', error);
        return '0 kg';
      }
    }
  },
  {
    id: 'capacidad',
    label: 'Capacidad Nominal(kg)',
    type: 'number',
    sortable: true,
    isForm: false, 
 
    render: (row) => {
      try {
        const value = row.capacidad;
        if (value === null || value === undefined) return '-';
        const numValue = Number(value);
        if (isNaN(numValue)) return '0 kg';
        return `${numValue} kg`;
      } catch (error) {
        console.error('Error al renderizar capacidad nominal:', error);
        return '0 kg';
      }
    }
  },
  {
    id: 'contador',
    label: 'Contador',
    type: 'number',
    sortable: true,
    required: true,
   
    isForm: true,
    render: (row) => {
      try {
        const value = row.contador;
        if (value === null || value === undefined) return '-';
        return String(value);
      } catch (error) {
        console.error('Error al renderizar contador:', error);
        return '-';
      }
    }
  },
  {
    id: 'contadorNuevo',
    label: 'Contador Nuevo',
    type: 'number',
    sortable: true,
    required: true,

    isForm: true,
    render: (row) => {
      try {
        const value = row.contadorNuevo;
        if (value === null || value === undefined) return '-';
        return String(value);
      } catch (error) {
        console.error('Error al renderizar contador nuevo:', error);
        return '-';
      }
    }
  }
];

// Columnas para exportación a Excel
export const columnsExcel = [
  { key: 'fecha', header: 'Fecha', formatDate: true },
  { key: 'maquina.nombre', header: 'Máquina' },
  { key: 'ciclos', header: 'Ciclos Completados' },
  { key: 'capacidad', header: 'Capacidad Nominal (kg)' },
  { key: 'kilosLavados', header: 'Kilos Lavados' },
  { key: 'observaciones', header: 'Observaciones' },
  { key: 'estado', header: 'Estado' },
  { key: 'createdAt', header: 'Fecha de Registro', formatDate: true },
];
