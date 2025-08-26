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
      { value: 'supervisor', label: 'Supervisor' },
      { value: 'asesor', label: 'Asesor' },
      { value: 'cliente', label: 'Cliente' },
      { value: 'centro_lavado', label: 'Centro de Lavado' },
      { value: 'documentacion', label: 'Documentación' },
    ],
  },
  {
    id: 'lavanderia',
    label: 'Centro de Lavado',
    type: 'asyncSelect',
    required: true,
    fetchOptions: async () => {
      try {
        const { fetchLaundries } = await import('@/pages/parametrizacion/laundries/Services/laundries.services');
        const r = await fetchLaundries({ limit: 100, offset: 1, query: { estado: 'Activo' } });
        return (r.data || []).map((l) => ({ value: { id: l._id, nombre: l.nombre }, label: l.nombre }));
      } catch (e) {
        console.error('Error cargando opciones de lavandería', e);
        return [];
      }
    },
  },
];

export const columnsExcel = [
  { key: 'estado', header: 'Estado' },
  { key: 'nombre', header: 'Nombre' },
  { key: 'correo', header: 'Correo' },
  { key: 'rol', header: 'Rol' },
  { key: 'lavanderia.nombre', header: 'Centro de Lavado' },
];
