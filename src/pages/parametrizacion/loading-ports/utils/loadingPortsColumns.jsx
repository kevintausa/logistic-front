export const loadingPortsColumns = [
  { id: 'nombre', label: 'Nombre', type: 'text', sortable: true, required: true },
  { id: 'ciudad', label: 'Ciudad', type: 'text', sortable: true, required: false },
  { id: 'codigo', label: 'Código', type: 'text', sortable: true, required: false },
  { id: 'tipo', label: 'Tipo', type: 'text', sortable: true, required: false },
  // Campos adicionales para alinear con el JSON generado (UN/LOCODE)
  { id: 'pais', label: 'País (ISO2)', type: 'text', sortable: true, required: false },
  { id: 'locode', label: 'UN/LOCODE', type: 'text', sortable: true, required: false },
  { id: 'subdivision', label: 'Subdivisión', type: 'text', sortable: true, required: false },
  { id: 'status', label: 'Status', type: 'text', sortable: true, required: false },
  { id: 'iata', label: 'IATA', type: 'text', sortable: true, required: false },
  { id: 'funciones', label: 'Funciones', type: 'text', sortable: true, required: false },
  { id: 'coordenadas.lat', label: 'Latitud', type: 'number', sortable: false, required: false },
  { id: 'coordenadas.lng', label: 'Longitud', type: 'number', sortable: false, required: false },
];

export const columnsExcel = loadingPortsColumns.map(col => ({ key: col.id, header: col.label }));
