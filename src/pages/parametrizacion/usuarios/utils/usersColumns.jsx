import { fetchOperators } from '@/pages/parametrizacion/operators/Services/operators.services';

export const usersColumns = [
  {
    id: 'estado',
    label: 'Estado',
    type: 'select',
    required: true,
    options: [
      { value: 'Activo', label: 'Activo' },
      { value: 'Inactivo', label: 'Inactivo' },
    ],
  },
  { id: 'nombre', label: 'Nombre', type: 'text', required: true },
  { id: 'correo', label: 'Correo', type: 'text', required: true },
  { id: 'contrasena', label: 'Contraseña', type: 'password', required: true, onlyOnCreate: true },
  { id: 'contrasena2', label: 'Repetir Contraseña', type: 'password', required: true, onlyOnCreate: true },
  { id: 'cedula', label: 'Cédula', type: 'text', required: true },
  {
    id: 'rol',
    label: 'Rol',
    type: 'select',
    required: true,
    options: [
      { value: 'admin', label: 'Administrador' },
      { value: 'operador', label: 'Operador' },
      { value: 'asesor', label: 'Asesor' },
      { value: 'cliente', label: 'Cliente' },
    ],
  },
  {
    id: 'operador',
    label: 'Operador logístico',
    type: 'asyncSelect',
    required: true,
    // Cargar operadores activos al abrir el modal
    fetchOptions: async () => {
      const { data } = await fetchOperators({ limit: 1000, offset: 1, query: { estado: 'Activo' } });
      return (data || []).map(op => ({ label: op.nombre, value: { id: op._id || op.id, nombre: op.nombre } }));
    },
  },
  {
    id: 'fecha_vencimiento_acceso',
    label: 'Fecha de vencimiento de acceso',
    type: 'date',
    required: false,
  },
];

export const columnsExcel = [
  { key: 'estado', header: 'Estado' },
  { key: 'nombre', header: 'Nombre' },
  { key: 'correo', header: 'Correo' },
  { key: 'rol', header: 'Rol' },
  { key: 'operador.nombre', header: 'Operador logístico' },
];
