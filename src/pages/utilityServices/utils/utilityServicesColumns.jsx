import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Droplet, Zap, Flame, Wifi } from 'lucide-react';

export const utilityServicesColumns = [
  {
    id: 'fecha',
    label: 'Fecha',
    type: 'daterange',
    sortable: true,
    required: true,
    isFilter: true,
    render: (row) => {
      try {
        if (!row.fecha) return '-';
        // Validar que la fecha sea un string o un objeto Date válido
        const dateValue = row.fecha;
        if (typeof dateValue === 'string') {
          if (dateValue.trim() === '') return '-';
          // Si es una fecha ISO válida
          if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(dateValue)) {
            return format(new Date(dateValue), 'dd/MM/yyyy', { locale: es });
          }
          // Si es una fecha en otro formato, mostramos como está
          return dateValue;
        } else if (dateValue instanceof Date) {
          return format(dateValue, 'dd/MM/yyyy', { locale: es });
        }
        return '-';
      } catch (error) {
        console.error('Error al formatear fecha:', error, row.fecha);
        // Devolvemos el valor como texto plano si falla el formateo
        return typeof row.fecha === 'string' ? row.fecha : '-';
      }
    }
  },
  {
    id: 'servicio.nombre',
    label: 'Servicio',
    type: 'text',
    sortable: true,
    required: true,
    isFilter: false,
   // options: [], // Opciones se inyectarán dinámicamente
    render: (row) => {
      try {
        if (!row.servicio) return '-';
        return row.servicio.nombre || '-';
      } catch (error) {
        console.error('Error al renderizar servicio:', error);
        return '-';
      }
    }
  },
  {
    id: 'contadorAnterior',
    label: 'Contador Anterior',
    type: 'number',
    sortable: true,
    required: true,
    isFilter: false,
    isForm: true,
    render: (row) => {
      try {
        if (row.contadorAnterior === null || row.contadorAnterior === undefined) return '-';
        return Number(row.contadorAnterior).toLocaleString();
      } catch (error) {
        console.error('Error al renderizar contador anterior:', error);
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
        if (row.contadorNuevo === null || row.contadorNuevo === undefined) return '-';
        return Number(row.contadorNuevo).toLocaleString();
      } catch (error) {
        console.error('Error al renderizar contador nuevo:', error);
        return '-';
      }
    }
  },
  {
    id: 'consumo',
    label: 'Consumo',
    type: 'number',
    sortable: true,
    isForm: false, // Se calcula automáticamente
    render: (row) => {
      try {
        if (row.consumo === null || row.consumo === undefined) return '-';
        return Number(row.consumo).toLocaleString();
      } catch (error) {
        console.error('Error al renderizar consumo:', error);
        return '-';
      }
    }
  },
  {
    id: 'consumoLitros',
    label: 'Consumo Litros',
    type: 'number',
    sortable: true,
    isForm: false, // Se calcula automáticamente
    render: (row) => {
      try {
        if (row.consumoLitros === null || row.consumoLitros === undefined) return '-';
        return Number(row.consumoLitros).toLocaleString();
      } catch (error) {
        console.error('Error al renderizar consumo litros:', error);
        return '-';
      }
    }
  },
  {
    id: 'servicio.unidad',
    label: 'Unidad',
    type: 'text',
    sortable: true,
    required: true,
    isForm: true,
    render: (row) => {
      try {
        if (!row.servicio || !row.servicio.unidad) return '-';
        return row.servicio.unidad;
      } catch (error) {
        console.error('Error al renderizar unidad:', error);
        return '-';
      }
    }
  },
  {
    id: 'costo',
    label: 'Costo Total',
    type: 'number',
    sortable: true,
    required: false,
    render: (row) => {
      try {
        if (row.costo === null || row.costo === undefined) return '-';
        return `$${Number(row.costo).toLocaleString()}`;
      } catch (error) {
        console.error('Error al renderizar costo:', error);
        return '-';
      }
    }
  },
  {
    id: 'servicio.tipo',
    label: 'Tipo de Servicio',
    type: 'select',
    sortable: true,
    isFilter: true,
    isForm: true,  // Habilitamos para el formulario
    options: [
      { value: 'Agua', label: 'Agua' },
      { value: 'Gas', label: 'Gas' },
      { value: 'Electricidad', label: 'Electricidad' },
      { value: 'Internet', label: 'Internet' },
    ],
    render: (row) => {
      const tipo = row.servicio?.tipo;
      if (!tipo) return '-';
      
      const getIconByType = () => {
        switch (tipo) {
          case 'Agua': return <Droplet className="h-5 w-5" color="#3b82f6" />;
          case 'Gas': return <Flame className="h-5 w-5" color="#d97706" />;
          case 'Electricidad': return <Zap className="h-5 w-5" color="#eab308" />;
          case 'Internet': return <Wifi className="h-5 w-5" color="#8b5cf6" />;
          default: return null;
        }
      };
      
      const getColorByType = () => {
        switch (tipo) {
          case 'Agua': return 'text-blue-500';
          case 'Gas': return 'text-amber-500';
          case 'Electricidad': return 'text-yellow-500';
          case 'Internet': return 'text-purple-500';
          default: return 'text-gray-500';
        }
      };
      
      return (
        <div className="flex items-center space-x-2">
          {getIconByType()}
          <span className={getColorByType()}>{tipo}</span>
        </div>
      );
    }
  },
];

export const columnsExcel = [
  { key: 'fecha', header: 'Fecha', formatDate: true },
  { key: 'servicio.nombre', header: 'Servicio' },
  { key: 'servicio.tipo', header: 'Tipo de Servicio' },
  { key: 'contadorAnterior', header: 'Contador Anterior' },
  { key: 'contadorNuevo', header: 'Contador Nuevo' },
  { key: 'consumo', header: 'Consumo' },
  { key: 'servicio.unidad', header: 'Unidad' },
  { key: 'servicio.precio', header: 'Precio Unitario' },
  { key: 'costo', header: 'Costo Total' },
  { key: 'lavanderia.nombre', header: 'Lavandería' },
  { key: 'createdAt', header: 'Fecha de Registro', formatDate: true },
];
