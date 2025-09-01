export const operationsColumns = [
  { id: 'codigo', label: 'Id', accessor: (row) => row.codigo , sortable: true },
  { id: 'estado', label: 'Estado', accessor: (row) => row.estado, sortable: true },
  { id: 'clienteNombre', label: 'Cliente', accessor: (row) => row.cliente?.nombre || row.clienteNombre || (typeof row.cliente === 'string' ? row.cliente : row.cliente?.id), sortable: true },
  { id: 'tipoOperacion', label: 'Tipo Operación', accessor: (row) => row.tipoOperacion?.nombre || row.tipoOperacion?.id },
  { id: 'asesorNombre', label: 'Asesor', accessor: (row) => row.asesorNombre || row.asesorId },
  { id: 'numTrazabilidad', label: 'N° Trazabilidad', accessor: (row) => row.numTrazabilidad || '-' },
  { id: 'actions', label: 'Acciones', type: 'actions', actions: [
    { key: 'view', label: 'Ver', icon: 'Eye', tooltip: 'Ver detalles', className: 'text-blue-600 hover:text-white hover:bg-blue-600' },
    { key: 'addQuote', label: 'Agregar cotización', icon: 'Plus', tooltip: 'Agregar cotización', disabledTooltip: 'Solo disponible cuando la operación está Pendiente', className: 'text-teal-600 hover:text-white hover:bg-teal-600', disabledWhen: (row) => row.estado !== 'Pendiente' },
    { id: 'quotes', label: 'Cotizaciones', icon: 'FileText', tooltip: 'Gestionar cotizaciones', className: 'text-amber-600 hover:text-white hover:bg-amber-600' },
    { id: 'offer', label: 'Oferta', icon: 'Tag', tooltip: 'Generar oferta', disabledTooltip: 'Primero selecciona una cotización', className: 'text-purple-600 hover:text-white hover:bg-purple-600', disabledWhen: (row) => !row.cotizacionSeleccionadaId },
    { id: 'viewOffer', label: 'Ver oferta', icon: 'Eye', tooltip: 'Ver oferta', className: 'text-indigo-600 hover:text-white hover:bg-indigo-600', disabledWhen: (row) => !row.cotizacionSeleccionadaId },
    { id: 'downloadOffer', label: 'Descargar', icon: 'Download', tooltip: 'Descargar oferta', className: 'text-indigo-700 hover:text-white hover:bg-indigo-700', disabledWhen: (row) => !row.cotizacionSeleccionadaId },
    { id: 'status', label: 'Status', icon: 'ListChecks', tooltip: 'Status', className: 'text-sky-600 hover:text-white hover:bg-sky-600' },
    { id: 'close', label: 'Cerrar', icon: 'Lock', tooltip: 'Cerrar operación', disabledTooltip: 'Requiere una cotización seleccionada', className: 'text-emerald-600 hover:text-white hover:bg-emerald-600', disabledWhen: (row) => !row.cotizacionSeleccionadaId },
    { id: 'cancel', label: 'Cancelar', icon: 'Ban', tooltip: 'Cancelar operación', disabledTooltip: 'No se puede cancelar una operación en curso o finalizada', className: 'text-red-600 hover:text-white hover:bg-red-600', disabledWhen: (row) => row.estado === 'En curso' || row.estado === 'Finalizada' },
    { id: 'edit', label: 'Editar', icon: 'Edit', tooltip: 'Editar operación', disabledTooltip: 'Solo editable cuando la operación está Pendiente', className: 'text-green-600 hover:text-white hover:bg-green-600', disabledWhen: (row) => row.estado !== 'Pendiente' },
    { id: 'delete', label: 'Eliminar', icon: 'Trash', tooltip: 'Eliminar operación', disabledTooltip: 'Solo se puede eliminar en estado Pendiente', className: 'text-red-600 hover:text-white hover:bg-red-600', disabledWhen: (row) => row.estado !== 'Pendiente' },
  ] },
];

export const columnsExcel = [
  { header: 'Código', key: 'codigo' },
  { header: 'Estado', key: 'estado' },
  { header: 'Cliente', key: 'clienteNombre' },
  { header: 'Tipo Operación', key: 'tipoOperacionNombre' },
  { header: 'Puerto Carga', key: 'puertoCargaNombre' },
  { header: 'Puerto Descarga', key: 'puertoDescargaNombre' },
  { header: 'Asesor', key: 'asesorNombre' },
  { header: 'N° Trazabilidad', key: 'numTrazabilidad' },
];
