export const incotermsColumns = [
  { id: 'nombre', label: 'Nombre', type: 'text', sortable: true, required: true },
  { id: 'descripcion', label: 'Descripción', type: 'text', sortable: true, required: false },
];

export const columnsExcel = incotermsColumns.map(col => ({ key: col.id, header: col.label }));
