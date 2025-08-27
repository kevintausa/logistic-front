export const operationsColumns = [
  { id: 'codigo', label: 'Id', accessor: (row) => row.codigo , sortable: true },
  { id: 'estado', label: 'Estado', accessor: (row) => row.estado, sortable: true },
  { id: 'clienteNombre', label: 'Cliente', accessor: (row) => row.cliente?.nombre || row.clienteNombre || (typeof row.cliente === 'string' ? row.cliente : row.cliente?.id), sortable: true },
  { id: 'tipoOperacion', label: 'Tipo Operación', accessor: (row) => row.tipoOperacion?.nombre || row.tipoOperacion?.id },
  { id: 'via', label: 'Vía', accessor: (row) => row.via?.nombre || row.via?.id },
  { id: 'puertoCarga', label: 'Puerto Carga', accessor: (row) => row.puertoCarga?.nombre || row.puertoCarga?.id },
  { id: 'puertoDescarga', label: 'Puerto Descarga', accessor: (row) => row.puertoDescarga?.nombre || row.puertoDescarga?.id },
  { id: 'asesorNombre', label: 'Asesor', accessor: (row) => row.asesorNombre || row.asesorId },
  { id: 'trazabilidadPct', label: 'Trazabilidad', accessor: (row) => `${row.trazabilidadPct ?? 0}%` },
  { id: 'actions', label: 'Acciones', type: 'actions', actions: [
    { key: 'view', label: 'Ver', icon: 'Eye', tooltip: 'Ver detalles', className: 'text-blue-600 hover:text-white hover:bg-blue-600' },
    { key: 'addQuote', label: 'Agregar cotización', icon: 'Plus', tooltip: 'Agregar cotización', className: 'text-teal-600 hover:text-white hover:bg-teal-600' },
    { id: 'quotes', label: 'Cotizaciones', icon: 'FileText', tooltip: 'Gestionar cotizaciones', className: 'text-amber-600 hover:text-white hover:bg-amber-600' },
    { id: 'offer', label: 'Oferta', icon: 'Tag', tooltip: 'Generar oferta', className: 'text-purple-600 hover:text-white hover:bg-purple-600' },
    { id: 'status', label: 'Estatus', icon: 'ListChecks', tooltip: 'Ver estatus / trazabilidad', className: 'text-sky-600 hover:text-white hover:bg-sky-600' },
    { id: 'close', label: 'Cerrar', icon: 'Lock', tooltip: 'Cerrar operación', className: 'text-emerald-600 hover:text-white hover:bg-emerald-600' },
    { id: 'cancel', label: 'Cancelar', icon: 'Ban', tooltip: 'Cancelar operación', className: 'text-red-600 hover:text-white hover:bg-red-600' },
    { id: 'edit', label: 'Editar', icon: 'Edit', tooltip: 'Editar operación', className: 'text-green-600 hover:text-white hover:bg-green-600' },
    { id: 'delete', label: 'Eliminar', icon: 'Trash', tooltip: 'Eliminar operación', className: 'text-red-600 hover:text-white hover:bg-red-600' },
  ] },
];

export const columnsExcel = [
  { header: 'Código', key: 'codigo' },
  { header: 'Estado', key: 'estado' },
  { header: 'Cliente', key: 'clienteNombre' },
  { header: 'Tipo Operación', key: 'tipoOperacionNombre' },
  { header: 'Vía', key: 'viaNombre' },
  { header: 'Puerto Carga', key: 'puertoCargaNombre' },
  { header: 'Puerto Descarga', key: 'puertoDescargaNombre' },
  { header: 'Asesor', key: 'asesorNombre' },
  { header: 'Trazabilidad %', key: 'trazabilidadPct' },
];
