export const airportsColumns = [
  { id: 'nombre', label: 'Nombre', type: 'text', required: true },
  { id: 'ciudad', label: 'Ciudad', type: 'text' },
  { id: 'pais', label: 'País', type: 'text' },
  { id: 'iata', label: 'IATA', type: 'text' },
  { id: 'icao', label: 'ICAO', type: 'text' },
  { id: 'tipo', label: 'Tipo', type: 'text' },
  { id: 'coordenadas.lat', label: 'Latitud', type: 'number' },
  { id: 'coordenadas.lng', label: 'Longitud', type: 'number' },
];

export const columnsExcel = [
  { header: 'Nombre', key: 'nombre' },
  { header: 'Ciudad', key: 'ciudad' },
  { header: 'País', key: 'pais' },
  { header: 'IATA', key: 'iata' },
  { header: 'ICAO', key: 'icao' },
  { header: 'Tipo', key: 'tipo' },
  { header: 'Latitud', key: 'coordenadas.lat' },
  { header: 'Longitud', key: 'coordenadas.lng' },
];
