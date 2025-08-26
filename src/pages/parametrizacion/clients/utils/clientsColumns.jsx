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
  { id: 'lavanderia', label: 'Centro de Lavado', type: 'text', sortable: true, required: false },
  { id: 'asesor', label: 'Asesor', type: 'text', sortable: true, required: false },
  { id: 'contacto', label: 'Contacto', type: 'text', sortable: true, required: false },
];

export const columnsExcel = clientsColumns.map(col => {
  if (col.id === 'lavanderia') {
    return { key: 'lavanderia', header: col.label };
  }
  return { key: col.id, header: col.label };
});
