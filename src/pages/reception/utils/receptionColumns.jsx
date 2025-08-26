import { Check } from 'lucide-react';

const toFixed = (value, decimals = 2) => {
  return Number(value).toFixed(decimals);
};

export const receptionColumns = (
  employees = [],
  clients = [],
  garmentTypes = [],
  machines = [],
  washingPrograms = []
) => [
  
  {
    id: 'numeroLote',
    label: 'Lote',
    type: 'text',
    isForm: false,
    isFilter: true,
    width: '8%',
    render: (item) => item.numeroLote || 'N/A',
  },
  {
    id: 'estado',
    label: 'Estado',
    type: 'select',
    isForm: true,
    isFilter: true,
    width: '10%',
    options: [
      { value: 'pendiente', label: 'Pendiente' },
      { value: 'finalizado', label: 'Finalizado' }
    ],
    render: (item) => {
      const estado = item.estado || 'pendiente';
      let className = "px-2 py-0.5 rounded-full text-xs font-semibold ";
      
      if (estado === 'finalizado') {
        className += "bg-green-100 text-green-700 border border-green-200";
      } else {
        className += "bg-yellow-100 text-yellow-700 border border-yellow-200";
      }
      
      return <span className={className}>{estado.charAt(0).toUpperCase() + estado.slice(1)}</span>;
    },
  },
  {
    id: 'createdAt',
    label: 'Fecha Pesaje',
    type: 'daterange',
    isForm: false,
    isFilter: true,
    width: '12%',
    defaultToday: true,
    render: (item) => new Date(item.createdAt).toLocaleString(),
  },
  {
    id: 'empleado',
    label: 'Lavador',
    type: 'select',
    required: true,
    isFilter: true,
    width: '12%',
    options: employees.map(e => ({ value: e._id, label: `${e.nombre} ${e.apellido}` })),
    placeholder: 'Seleccione un lavador',
    render: (item) => {
      if (!item.empleado) return 'N/A';
      const fullName = item.empleado.nombre;
      const truncated = fullName.length > 11 ? `${fullName.substring(0, 11)}...` : fullName;
      
      return (
        <span 
          title={fullName} 
          className="truncate inline-block max-w-[120px] cursor-help"
        >
          {truncated}
        </span>
      );
    },
  },
  {
    id: 'cliente',
    label: 'Nombre Cliente',
    type: 'select',
    required: true,
    isFilter: true,
    width: '12%',
    options: clients.map(c => ({ value: c._id, label: c.nombre })),
    placeholder: 'Seleccione un cliente',
    render: (item) => {
      if (!item.cliente?.nombre) return 'N/A';
      const fullName = item.cliente.nombre;
      const truncated = fullName.length > 11 ? `${fullName.substring(0, 11)}...` : fullName;
      
      return (
        <span 
          title={fullName} 
          className="truncate inline-block max-w-[120px] cursor-help"
        >
          {truncated}
        </span>
      );
    },
  },
  {
    id: 'tipoPrenda',
    label: 'Tipo Prenda',
    type: 'select',
    required: true,
    isFilter: true,
    width: '12%',
    options: garmentTypes.map(g => ({ value: g._id, label: g.nombre })),
    placeholder: 'Seleccione un tipo de prenda',
    render: (item) => {
      if (!item.tipoPrenda?.nombre) return 'N/A';
      const fullName = item.tipoPrenda.nombre;
      const truncated = fullName.length > 11 ? `${fullName.substring(0, 11)}...` : fullName;
      
      return (
        <span 
          title={fullName} 
          className="truncate inline-block max-w-[120px] cursor-help"
        >
          {truncated}
        </span>
      );
    },
  },

  {
    id: 'maquina',
    label: 'Lavadora',
    type: 'select',
    required: true,
    isFilter: true,
    width: '10%',
    options: machines.map(m => ({ value: m._id, label: m.nombre })),
    placeholder: 'Seleccione una lavadora',
    render: (item) => {
      if (!item.maquina?.nombre) return 'N/A';
      const fullName = item.maquina.nombre;
      const truncated = fullName.length > 11 ? `${fullName.substring(0, 11)}...` : fullName;
      
      return (
        <span 
          title={fullName} 
          className="truncate inline-block max-w-[120px] cursor-help"
        >
          {truncated}
        </span>
      );
    },
  },
  {
    id: 'pesoKg',
    label: 'Peso Total (Kg)',
    type: 'number',
    required: true,
    isFilter: true,
    width: '8%',
  },
  {
    id: 'porcentajeRechazo',
    label: 'Porcentaje Rechazo',
    type: 'text',
    isForm: false,
    isFilter: false,
    width: '8%',
    render: (item) => {
      if (!item.totalRechazoKilos || !item.pesoKg) return '-';
      return (
        <span className="text-rose-600 font-medium">
          {toFixed(item.totalRechazoKilos / item.pesoKg * 100, 2)}%
        </span>
      );
    },
  },
  {
    id: 'programaLavado',
    label: 'Programa Lavado',
    type: 'select',
    required: true,
    isFilter: true,
    width: '10%',
    options: washingPrograms.map(p => ({ 
      value: p._id, 
      label: `${p.numero_programa || ''} - ${p.nombre}` 
    })),
    placeholder: 'Seleccione un programa',
    render: (item) => {
      if (!item.programaLavado?.nombre) return 'N/A';
      // Mostrar número de programa y nombre si está disponible
      const numero = item.programaLavado.numero_programa || '';
      const nombre = item.programaLavado.nombre;
      const fullName = numero ? `${numero} - ${nombre}` : nombre;
      const truncated = fullName.length > 15 ? `${fullName.substring(0, 15)}...` : fullName;
      
      return (
        <span 
          title={fullName} 
          className="truncate inline-block max-w-[150px] cursor-help"
        >
          {truncated}
        </span>
      );
    },
  },
  {
    id: 'kilosLimpios',
    label: 'Kilos Limpios',
    type: 'text',
    isForm: false,
    isFilter: false,
    width: '8%',
    render: (item) => {
      if (!item.kilosLimpios) return '-';
      return (
        <span className="text-blue-600 font-medium">
          {item.kilosLimpios} kg
        </span>
      );
    },
  },

  {
    id: 'totalRechazoKilos',
    label: 'Kilos Rechazo',
    type: 'text',
    isForm: false,
    isFilter: false,
    width: '8%',
    render: (item) => {
      if (!item.totalRechazoKilos) return '-';
      
      // Calcular total de kilos rechazados
      const totalRechazo = item.totalRechazoKilos;
      
      return (
        <span className="text-rose-600 font-medium">
          {totalRechazo} kg
        </span>
      );
    },
  },
  {
    id: 'observaciones',
    label: 'Observaciones',
    type: 'textarea',
    isFilter: false,
    width: '12%',
  },

  {
    key: 'opciones',
    id: 'opciones',
    label: 'Opciones',
    width: '10%',
    actions: [
      {
        key: 'edit',
        icon: 'Edit',
        tooltip: 'Editar',
        className: 'text-green-400 hover:text-green-600',
        showWhen: (item) => item.estado !== 'finalizado'
      },
      {
        key: 'delete',
        icon: 'Trash',
        tooltip: 'Eliminar',
        className: 'text-red-400 hover:text-red-600',
        showWhen: (item) => item.estado !== 'finalizado'
      },
      {
        key: 'finalizar',
        icon: 'Check',
        tooltip: 'Finalizar Lavado',
        className: 'text-blue-500 hover:text-blue-700',
        showWhen: (item) => item.estado !== 'finalizado'
      },
      {
        key: 'verRechazos',
        icon: 'Eye',
        tooltip: 'Ver Rechazos',
        className: 'text-amber-500 hover:text-amber-700',
        showWhen: (item) => item.estado === 'finalizado' && item.rechazos && item.rechazos.length > 0
      }
    ],
  },
];

// Columnas para la exportación a Excel
export const columnsExcel = [
  { header: 'Lote', key: 'numeroLote', width: 15 },
  { header: 'Fecha Pesaje', key: 'fechaPesaje', width: 20 },
  { header: 'Lavador', key: 'lavador', width: 30 },
  { header: 'Nombre Cliente', key: 'nombreCliente', width: 30 },
  { header: 'Tipo de Prenda', key: 'tipoPrenda', width: 25 },
  { header: 'Peso (Kg)', key: 'pesoKg', width: 20 },
  { header: 'Total Rechazo (Kg)', key: 'totalRechazoKilos', width: 20 },
  { header: "Arrastre", key: 'arrastre',width: 20 },
  { header: "Cloro", key: 'cloro',width: 20 },
  { header: "Grasa", key: 'grasa',width: 20 },
  { header: "Tintas", key: 'tintas',width: 20 },
  { header: "Oxido", key: 'oxido',width: 20 },
  { header: "Otro", key: 'otro',width: 20 },
  { header: 'Lavadora', key: 'lavadora', width: 20 },
  { header: 'Programa de Lavado', key: 'programaLavado', width: 25 },
  { header: 'Observaciones', key: 'observaciones', width: 40 },
];

