import { ROLES } from '@/contexts/AuthContext';

// Función para obtener el nombre del rol
const getRoleName = (role) => {
  const roles = {
    [ROLES.ADMIN]: 'Administrador',
    [ROLES.SUPERVISOR]: 'Supervisor',
    [ROLES.EMPLOYEE]: 'Empleado',
    [ROLES.CLIENT]: 'Cliente'
  };
  return roles[role] || role;
};

// Columnas para la tabla de usuarios
export const usersColumns = [
  {
    header: 'Nombre',
    accessorKey: 'nombre',
    cell: ({ row }) => row.original.nombre || 'Sin nombre',
  },
  {
    header: 'Email',
    accessorKey: 'email',
    cell: ({ row }) => row.original.email || 'Sin email',
  },
  {
    header: 'Rol',
    accessorKey: 'role',
    cell: ({ row }) => getRoleName(row.original.role),
  },
  {
    header: 'Estado',
    accessorKey: 'estado',
    cell: ({ row }) => ({
      content: (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          row.original.estado === 'Activo' 
            ? 'bg-green-100 text-green-800' 
            : 'bg-gray-100 text-gray-800'
        }`}>
          {row.original.estado}
        </span>
      ),
    }),
  },
  {
    header: 'Acciones',
    id: 'actions',
    cell: ({ row }) => ({
      actions: [
        {
          label: 'Editar',
          icon: 'edit',
          onClick: () => {},
          variant: 'ghost',
        },
        {
          label: 'Eliminar',
          icon: 'trash',
          onClick: () => {},
          variant: 'ghost',
          className: 'text-red-500 hover:text-red-700',
        },
      ],
    }),
  },
];

// Columnas para la exportación a Excel
export const columnsExcel = [
  { header: 'ID', key: 'id', width: 10 },
  { header: 'Nombre', key: 'nombre', width: 30 },
  { header: 'Email', key: 'email', width: 30 },
  { 
    header: 'Rol', 
    key: 'role',
    width: 20,
    valueGetter: (row) => getRoleName(row.role)
  },
  { 
    header: 'Estado', 
    key: 'estado',
    width: 15
  },
  { 
    header: 'Fecha de Creación', 
    key: 'fechaCreacion',
    width: 20,
    valueGetter: (row) => row.fechaCreacion ? new Date(row.fechaCreacion).toLocaleDateString() : 'N/A'
  },
];
