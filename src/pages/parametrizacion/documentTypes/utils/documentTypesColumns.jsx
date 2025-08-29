export const documentTypesColumns = [
  { id: 'nombre', label: 'Nombre', type: 'text', sortable: true, required: true },
  {
    id: 'aplicaA',
    label: 'Aplica a',
    type: 'select',
    sortable: true,
    required: true,
    options: [
      { value: 'cliente', label: 'Cliente' },
      { value: 'general', label: 'General' },
      { value: 'ambos', label: 'Ambos' },
    ],
  },
  {
    id: 'requiereVencimiento',
    label: 'Requiere vencimiento',
    type: 'select',
    sortable: true,
    required: true,
    options: [
      { value: 'true', label: 'Sí' },
      { value: 'false', label: 'No' }
    ],
  },
  {
    id: 'estado',
    label: 'Estado',
    type: 'select',
    sortable: true,
    required: true,
    options: [
      { value: 'Activo', label: 'Activo' },
      { value: 'Inactivo', label: 'Inactivo' },
    ],
  },
];

export const columnsExcel = {
  nombre: 'Nombre',
  aplicaA: 'Aplica a',
  requiereVencimiento: 'Requiere vencimiento',
  estado: 'Estado',
  createdAt: 'Fecha de Creación',
  updatedAt: 'Fecha de Actualización',
};
