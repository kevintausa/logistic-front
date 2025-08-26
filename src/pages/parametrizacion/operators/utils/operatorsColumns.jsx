export const operatorsColumns = [
  { id: 'estado', label: 'Estado', type: 'select', sortable: true, required: true, options: [
    { value: 'Activo', label: 'Activo' },
    { value: 'Inactivo', label: 'Inactivo' },
  ] },
  { id: 'nombre', label: 'Nombre', type: 'text', sortable: true, required: true },
  { id: 'nit', label: 'NIT', type: 'text', sortable: true, required: true },
  { id: 'representante_legal', label: 'Representante Legal', type: 'text', sortable: true, required: false },
  { id: 'correo', label: 'Correo', type: 'email', sortable: true, required: false },
  { id: 'celular', label: 'Celular', type: 'text', sortable: true, required: false },
  { id: 'fecha_vencimiento_acceso', label: 'Fecha vencimiento acceso', type: 'date', sortable: true, required: false },
];

export const columnsExcel = operatorsColumns.map(col => ({ key: col.id, header: col.label }));
