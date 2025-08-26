
import React from 'react';

export const sampleDashboardData = [
  {
    id: 1,
    nombre: 'Juan Pérez',
    email: 'juan.perez@ejemplo.com',
    edad: 32,
    departamento: 'Ventas',
    estado: 'Activo',
    fechaIngreso: '2021-05-15',
    salario: 45000,
    esGerente: true
  },
  {
    id: 2,
    nombre: 'María López',
    email: 'maria.lopez@ejemplo.com',
    edad: 28,
    departamento: 'Marketing',
    estado: 'Activo',
    fechaIngreso: '2022-01-10',
    salario: 38000,
    esGerente: false
  },
  {
    id: 3,
    nombre: 'Carlos Rodríguez',
    email: 'carlos.rodriguez@ejemplo.com',
    edad: 45,
    departamento: 'Finanzas',
    estado: 'Inactivo',
    fechaIngreso: '2018-11-20',
    salario: 62000,
    esGerente: true
  },
  {
    id: 4,
    nombre: 'Ana Martínez',
    email: 'ana.martinez@ejemplo.com',
    edad: 31,
    departamento: 'Recursos Humanos',
    estado: 'Activo',
    fechaIngreso: '2020-03-05',
    salario: 41000,
    esGerente: false
  },
  {
    id: 5,
    nombre: 'Roberto Sánchez',
    email: 'roberto.sanchez@ejemplo.com',
    edad: 37,
    departamento: 'Tecnología',
    estado: 'Activo',
    fechaIngreso: '2019-08-12',
    salario: 55000,
    esGerente: true
  },
  {
    id: 6,
    nombre: 'Laura Gómez',
    email: 'laura.gomez@ejemplo.com',
    edad: 29,
    departamento: 'Ventas',
    estado: 'Pendiente',
    fechaIngreso: '2022-06-18',
    salario: 36000,
    esGerente: false
  },
  {
    id: 7,
    nombre: 'Miguel Torres',
    email: 'miguel.torres@ejemplo.com',
    edad: 42,
    departamento: 'Marketing',
    estado: 'Activo',
    fechaIngreso: '2017-04-22',
    salario: 48000,
    esGerente: true
  },
  {
    id: 8,
    nombre: 'Sofía Ramírez',
    email: 'sofia.ramirez@ejemplo.com',
    edad: 26,
    departamento: 'Recursos Humanos',
    estado: 'Inactivo',
    fechaIngreso: '2021-09-30',
    salario: 34000,
    esGerente: false
  }
];

export const sampleDashboardColumns = [
  { id: 'nombre', label: 'Nombre', type: 'text' },
  { id: 'email', label: 'Email', type: 'text' },
  { id: 'edad', label: 'Edad', type: 'number' },
  { id: 'departamento', label: 'Departamento', type: 'text' },
  { id: 'estado', label: 'Estado', type: 'status' },
  { id: 'fechaIngreso', label: 'Fecha de Ingreso', type: 'date' },
  { id: 'salario', label: 'Salario', type: 'number' },
  { id: 'esGerente', label: 'Es Gerente', type: 'boolean' }
];

export const sampleDashboardFilters = [
  {
    id: 'nombre',
    label: 'Nombre',
    type: 'text',
    placeholder: 'Buscar por nombre'
  },
  {
    id: 'departamento',
    label: 'Departamento',
    type: 'select',
    options: [
      { value: 'Ventas', label: 'Ventas' },
      { value: 'Marketing', label: 'Marketing' },
      { value: 'Finanzas', label: 'Finanzas' },
      { value: 'Recursos Humanos', label: 'Recursos Humanos' },
      { value: 'Tecnología', label: 'Tecnología' }
    ]
  },
  {
    id: 'estado',
    label: 'Estado',
    type: 'select',
    options: [
      { value: 'Activo', label: 'Activo' },
      { value: 'Inactivo', label: 'Inactivo' },
      { value: 'Pendiente', label: 'Pendiente' }
    ]
  },
  {
    id: 'edad',
    label: 'Rango de Edad',
    type: 'range',
    min: 20,
    max: 60,
    step: 1
  },
  {
    id: 'esGerente',
    label: 'Rol',
    type: 'select',
    options: [
      { value: true, label: 'Gerente' },
      { value: false, label: 'Empleado' }
    ]
  },
  {
    id: 'salario',
    label: 'Rango de Salario',
    type: 'range',
    min: 30000,
    max: 70000,
    step: 1000
  }
];


export const clientesColumns = [
  { id: 'tipoUsuario', label: 'Tipo de Usuario', type: 'text', sortable: true },
  { id: 'nombre', label: 'Usuario', type: 'text', sortable: true },
  { id: 'razonSocial', label: 'Razón Social', type: 'text', sortable: true },
  { id: 'nit', label: 'Nit/No. Identificación', type: 'text', sortable: true },
  { id: 'ciudad', label: 'Ciudad', type: 'text', sortable: true },
  { id: 'direccion', label: 'Dirección', type: 'text', sortable: true },
  { id: 'celular', label: 'Celular', type: 'text', sortable: true },
  { id: 'actividadEconomica', label: 'Actividad Económica', type: 'text', sortable: true },
];

export const sampleClientesData = [
  { id: 'cli1', tipoUsuario: 'Empresa', nombre: 'Tech Solutions S.A.S.', razonSocial: 'Tech Solutions S.A.S.', nit: '900.123.456-7', ciudad: 'Bogotá', direccion: 'Cra 7 # 71-21', celular: '3101234567', actividadEconomica: 'Desarrollo de Software' },
  { id: 'cli2', tipoUsuario: 'Persona Natural', nombre: 'Ana María Rojas', razonSocial: 'Ana María Rojas', nit: '1022345678', ciudad: 'Medellín', direccion: 'Cl 45 # 15-02', celular: '3158765432', actividadEconomica: 'Consultoría Independiente' },
  { id: 'cli3', tipoUsuario: 'Empresa', nombre: 'Comercializadora ABC Ltda.', razonSocial: 'Comercializadora ABC Ltda.', nit: '800.987.654-3', ciudad: 'Cali', direccion: 'Av. Roosevelt # 20-30', celular: '3123456789', actividadEconomica: 'Comercio al por mayor' },
  { id: 'cli4', tipoUsuario: 'Persona Natural', nombre: 'Carlos Pérez Gómez', razonSocial: 'Carlos Pérez Gómez', nit: '79001002', ciudad: 'Barranquilla', direccion: 'Cll 84 # 50-11', celular: '3187654321', actividadEconomica: 'Servicios Profesionales' },
  { id: 'cli5', tipoUsuario: 'Empresa', nombre: 'Industrias Metalicas XYZ', razonSocial: 'Industrias Metalicas XYZ', nit: '830.001.002-1', ciudad: 'Bucaramanga', direccion: 'Parque Industrial Bodega 5', celular: '3176543210', actividadEconomica: 'Manufactura' },
];

export const operacionesColumns = [
  { id: 'estado', label: 'Estado', type: 'status', sortable: true },
  { id: 'nombreCliente', label: 'Nombre Cliente', type: 'text', sortable: true },
  { id: 'tipoOperacion', label: 'Tipo Operación', type: 'text', sortable: true },
  { id: 'via', label: 'Vía', type: 'text', sortable: true },
  { id: 'puertoCarga', label: 'Puerto Carga', type: 'text', sortable: true },
  { id: 'puertoDescarga', label: 'Puerto Descarga', type: 'text', sortable: true },
  { id: 'incoterm', label: 'Incoterm', type: 'text', sortable: true },
  { id: 'piezas', label: 'Piezas', type: 'number', sortable: true },
  { id: 'peso', label: 'Peso (Kg)', type: 'number', sortable: true },
  { id: 'metrosCubicos', label: 'M3', type: 'number', sortable: true },
  { id: 'asesor', label: 'Asesor', type: 'text', sortable: true },
];

export const sampleOperacionesData = [
  { id: 'op1', estado: 'Activo', nombreCliente: 'Tech Solutions S.A.S.', tipoOperacion: 'Importación', via: 'Marítima', puertoCarga: 'Shanghai', puertoDescarga: 'Buenaventura', incoterm: 'FOB', piezas: 100, peso: 5000, metrosCubicos: 25, asesor: 'Laura Gómez' },
  { id: 'op2', estado: 'Completado', nombreCliente: 'Ana María Rojas', tipoOperacion: 'Exportación', via: 'Aérea', puertoCarga: 'Bogotá', puertoDescarga: 'Miami', incoterm: 'CIF', piezas: 10, peso: 200, metrosCubicos: 2, asesor: 'Juan Pérez' },
  { id: 'op3', estado: 'Pendiente', nombreCliente: 'Comercializadora ABC Ltda.', tipoOperacion: 'Importación', via: 'Marítima', puertoCarga: 'Shenzhen', puertoDescarga: 'Cartagena', incoterm: 'EXW', piezas: 500, peso: 12000, metrosCubicos: 60, asesor: 'Carlos Rodríguez' },
  { id: 'op4', estado: 'Cancelado', nombreCliente: 'Carlos Pérez Gómez', tipoOperacion: 'Importación', via: 'Aérea', puertoCarga: 'Panamá', puertoDescarga: 'Medellín', incoterm: 'DDP', piezas: 5, peso: 50, metrosCubicos: 0.5, asesor: 'Laura Gómez' },
  { id: 'op5', estado: 'Activo', nombreCliente: 'Industrias Metalicas XYZ', tipoOperacion: 'Exportación', via: 'Terrestre', puertoCarga: 'Bucaramanga', puertoDescarga: 'Cúcuta', incoterm: 'FCA', piezas: 2000, peso: 20000, metrosCubicos: 100, asesor: 'Juan Pérez' },
];
