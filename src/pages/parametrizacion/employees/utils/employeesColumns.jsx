export const employeesColumns = [
  {
    id: 'estado', label: 'Estado', type: 'select', sortable: true, required: true, options: [
      { value: 'Activo', label: 'Activo' },
      { value: 'Inactivo', label: 'Inactivo' },
    ]
  },
  { id: 'lavanderia', label: 'Centro de Lavado', type: 'text', sortable: true, required: false },
  { id: 'cedula', label: 'Cédula', type: 'text', sortable: true, required: true },
  { id: 'nombre', label: 'Nombre', type: 'text', sortable: true, required: true },
  { id: 'apellido', label: 'Apellido', type: 'text', sortable: true, required: true },
  { id: 'correo', label: 'Correo', type: 'text', sortable: true, required: true },
  { id: 'celular', label: 'Celular', type: 'text', sortable: true, required: true },
  { id: 'direccion', label: 'Direccion', type: 'text', sortable: true, required: true },
  { id: 'fechaIngreso', label: 'Fecha Ingreso', type: 'date', sortable: true },
  {
    id: 'rol', label: 'Rol', type: 'select', sortable: true, required: true, options: [
      { value: 'Administrador', label: 'Administrador' },
      { value: 'Asesor comercial', label: 'Asesor comercial' },
      { value: 'Supervisor planta', label: 'Supervisor planta' },
      { value: 'Auxiliar lavanderia', label: 'Auxiliar lavanderia' },
      { value: 'Conductor', label: 'Conductor' },
    ]
  },
  { id: 'salario', label: 'Salario', type: 'number', sortable: true, required: true },
  { id: "EPS", label: "EPS", type: "text", sortable: true, required: true },
  { id: "nombre_contacto_emergencia", label: "Nombre Contacto Emergencia", type: "text", sortable: true, required: true },
  { id: "telefono_contacto_emergencia", label: "Telefono Contacto Emergencia", type: "text", sortable: true, required: true },
  { id: "parentesco_contacto_emergencia", label: "Parentesco Contacto Emergencia", type: "select", sortable: true, required: true, options: [
    { value: 'Hijo', label: 'Hijo' },
    { value: 'Hermano', label: 'Hermano' },
    { value: 'Padre', label: 'Padre' },
    { value: 'Madre', label: 'Madre' },
    { value: 'Conyuge', label: 'Conyuge' },
    { value: 'Otros', label: 'Otros' },
  ] },
  { id: "colorPlaneacion", label: "Color Planeacion", type: "select", sortable: true, required: true ,
    options: [
      { value: 'naranja', label: 'Naranja' },
      { value: 'azul_oscuro', label: 'Azul Oscuro' },
      { value: 'gris', label: 'Gris' },
      { value: 'verde_claro', label: 'Verde Claro' },
      { value: 'amarillo', label: 'Amarillo' },
      { value: 'azul_claro', label: 'Azul Claro' },
      { value: 'rosado', label: 'Rosado' },
      { value: 'rojo', label: 'Rojo' },
      { value: 'verde_oscuro', label: 'Verde Oscuro' },
      { value: 'vino_tinto', label: 'Vino Tinto' },
      { value: 'cafe', label: 'Cafe' },
    ]
   },
  { id: "diaDescanso", label: "Dia Descanso", type: "select", sortable: true, required: true, options: [
    { value: 'Lunes', label: 'Lunes' },
    { value: 'Martes', label: 'Martes' },
    { value: 'Miercoles', label: 'Miercoles' },
    { value: 'Jueves', label: 'Jueves' },
    { value: 'Viernes', label: 'Viernes' },
    { value: 'Sabado', label: 'Sabado' },
    { value: 'Domingo', label: 'Domingo' },
  ] },
];


export const columnsExcel = [
  { key: 'estado', header: 'Estado' },
  { key: 'lavanderia.nombre', header: 'Centro de Lavado' },
  { key: 'cedula', header: 'Cédula' },
  { key: 'nombre', header: 'Nombre' },
  { key: 'apellido', header: 'Apellido' },
  { key: 'correo', header: 'Correo' },
  { key: 'celular', header: 'Celular' },
  { key: 'direccion', header: 'Direccion' },
  { key: 'fechaIngreso', header: 'Fecha Ingreso' },
  { key: 'rol', header: 'Rol' },
  { key: 'salario', header: 'Salario' },
  { key: 'EPS', header: 'EPS' },
  { key: 'arl', header: 'ARL' },
]