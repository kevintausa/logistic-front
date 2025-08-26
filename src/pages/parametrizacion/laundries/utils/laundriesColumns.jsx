export const laundriesColumns = [
  { id: 'estado', label: 'Estado', type: 'select', sortable: true, required: true, options: [
    { value: 'Activo', label: 'Activo' },
    { value: 'Inactivo', label: 'Inactivo' },
  ] },
  { id: 'nombre', label: 'Nombre Lavandería', type: 'text', sortable: true, required: true },
  { id: 'direccion', label: 'Dirección', type: 'text', sortable: true, required: true },
  { id: 'supervisor', label: 'Supervisor', type: 'text', sortable: true, required: true },
  { id: 'telefono', label: 'Teléfono', type: 'text', sortable: true, required: true },
  { id: 'asesor', label: 'Asesor', type: 'text', sortable: true, required: false },
];

export const columnsExcel = laundriesColumns.map(col => ({ key: col.id, header: col.label }));
