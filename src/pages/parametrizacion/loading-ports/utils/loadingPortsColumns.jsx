export const loadingPortsColumns = [
  { id: 'id', label: 'ID (tipo:código)', type: 'text', sortable: true, required: false },
  { id: 'tipo', label: 'Tipo', type: 'select', sortable: true, required: true, options: [
    { value: 'aeropuerto', label: 'Aeropuerto' },
    { value: 'puerto', label: 'Puerto marítimo' },
  ] },
  { id: 'nombre', label: 'Nombre', type: 'text', sortable: true, required: true },
  { id: 'ciudad', label: 'Ciudad', type: 'text', sortable: true, required: false },
  { id: 'pais', label: 'País (ISO2)', type: 'text', sortable: true, required: false },
  { id: 'iata', label: 'IATA', type: 'text', sortable: true, required: false },
  { id: 'icao', label: 'ICAO', type: 'text', sortable: true, required: false },
  { id: 'unlocode', label: 'UN/LOCODE', type: 'text', sortable: true, required: false },
  { id: 'lat', label: 'Latitud', type: 'number', sortable: false, required: false },
  { id: 'lng', label: 'Longitud', type: 'number', sortable: false, required: false },
];

export const columnsExcel = loadingPortsColumns.map(col => ({ key: col.id, header: col.label }));
