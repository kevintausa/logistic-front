export const operationFormFields = [
  { id: 'cliente.id', label: 'Cliente ID', type: 'text', required: true },
  { id: 'cliente.nombre', label: 'Cliente Nombre', type: 'text', required: true },
  { id: 'cliente.nit', label: 'Cliente NIT', type: 'text' },

  { id: 'tipoOperacion.id', label: 'Tipo Operación ID', type: 'text', required: true },
  { id: 'tipoOperacion.nombre', label: 'Tipo Operación', type: 'text', required: true },

  { id: 'via.id', label: 'Vía ID', type: 'text', required: true },
  { id: 'via.nombre', label: 'Vía', type: 'text', required: true },

  { id: 'puertoCarga.id', label: 'Puerto Carga ID', type: 'text' },
  { id: 'puertoCarga.nombre', label: 'Puerto Carga', type: 'text' },

  { id: 'puertoDescarga.id', label: 'Puerto Descarga ID', type: 'text' },
  { id: 'puertoDescarga.nombre', label: 'Puerto Descarga', type: 'text' },

  { id: 'incoterm', label: 'Incoterm', type: 'text' },
  { id: 'piezas', label: 'Piezas', type: 'number' },
  { id: 'pesoKg', label: 'Peso (Kg)', type: 'number' },
  { id: 'm3', label: 'Volumen (m3)', type: 'number' },

  { id: 'asesorId', label: 'Asesor ID', type: 'text' },
  { id: 'asesorNombre', label: 'Asesor Nombre', type: 'text' },
];
