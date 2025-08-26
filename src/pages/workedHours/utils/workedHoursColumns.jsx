import React from 'react';

import { Button } from '@/components/ui/button';
import { Camera, LogOut } from 'lucide-react';

export const workedHoursColumns = [
  {
    id: 'empleado.nombre',
    label: 'Nombre del Empleado',
    type: 'select',
    sortable: true,
    required: true,
    isFilter: true,
    render: (row) => row.empleado?.nombre || 'N/A',
  },
  {
    id: 'empleado.cedula',
    label: 'Cédula',
    type: 'text',
    sortable: false,
    required: false,
    isFilter: true,
    render: (row) => row.empleado?.cedula || 'N/A',
  },
  {
    id: 'fecha',
    label: 'Fecha',
    type: 'daterange',
    sortable: true,
    required: true,
    isFilter: true,
    render: (row) => new Date(row.fecha).toLocaleDateString(),
  },
  {
    id: 'horaIngreso',
    label: 'Hora de Llegada',
    type: 'time',
    sortable: true,
    required: true,
    isFilter: false,
  },
  {
    id: 'horaSalida',
    label: 'Hora de Salida',
    type: 'time',
    sortable: true,
    required: true,
    isFilter: false,
    render: (row) => row.horaSalida || 'N/A',
  },
  {
    id: 'totalHorasTrabajadas',
    label: 'Total Horas',
    type: 'number',
    sortable: true,
    required: true,
    isFilter: false,
    render: (row) => {
      const horas = row.totalHorasTrabajadas;

      return (
        <div className="flex items-center gap-2">
          <span>{horas?.toFixed(2) || 'N/A'}</span>
          {row.almuerzo && (
            <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2 py-0.5 rounded-full">
              Almuerzo
            </span>
          )}
        </div>
      );
    },
  },
  {
    id: 'totalHorasAutorizadas',
    label: 'Total Horas Autorizadas',
    type: 'number',
    sortable: true,
    required: true,
    isFilter: false,
    render: (row) => row.totalHorasAutorizadas?.toFixed(2) || 'N/A',
  },
  {
    id: 'foto',
    label: 'Evidencia',
    type: 'image',
    sortable: true,
    required: true,
    isFilter: false,
    render: (row, column, props) => {
      const { onImageClick } = props;
      const imageUrl = row.foto;


      if (!imageUrl) {
        return <span className="text-xs text-gray-500">Sin foto</span>;
      }

      return (
        <Button
          variant="outline"
          size="sm"
          onClick={() => onImageClick && onImageClick(imageUrl)}
        >
          <Camera className="mr-2 h-4 w-4" />
          Ver
        </Button>
      );
    },
  },
  {
    id: 'isAprobado',
    label: 'Estado',
    type: 'boolean',
    sortable: true,
    required: true,
    isFilter: true,
    render: (row) => row.isAprobado ? 'Aprobado' : 'Pendiente',
  },
  {
    id: 'opciones',
    label: 'Opciones',
    width: '10%',
    actions: [
      {
        key: 'edit',
        icon: 'LogOut',
        tooltip: 'Registrar salida',
        className: 'text-green-400 hover:text-green-600',
        showWhen: (item) => !item.horaSalida
      },
      {
        key: 'authorize',
        icon: 'Check',
        tooltip: 'Autorizar Horas',
        className: 'text-blue-400 hover:text-blue-600',
        showWhen: (item) => item.horaSalida && !item.isAprobado
      },
    ],
  },
];

export const workedHoursColumnsExcel = [
  { header: 'Nombre del Empleado', key: 'nombreEmpleado' },
  { header: 'Cédula', key: 'cedulaEmpleado' },
  { header: 'Centro de Lavado', key: 'nombreLavanderia' },
  { header: 'Fecha', key: 'fecha' },
  { header: 'Hora de Llegada', key: 'horaIngreso' },
  { header: 'Hora de Salida', key: 'horaSalida' },
  { header: 'Total Horas Trabajadas', key: 'totalHorasTrabajadas' },
  { header: 'Total Horas Autorizadas', key: 'totalHorasAutorizadas' },
  { header: 'Estado', key: 'isAprobado' },
];

export const workedHoursDataMapper = (item) => {
  return {
    nombreEmpleado: item.empleado?.nombre,
    cedulaEmpleado: item.empleado?.cedula,
    fecha: item.fecha ? new Date(item.fecha).toLocaleDateString() : '',
    horaIngreso: item.horaIngreso,
    horaSalida: item.horaSalida,
    totalHorasTrabajadas: item.totalHorasTrabajadas,
    totalHorasAutorizadas: item.totalHorasAutorizadas,
    isAprobado: item.isAprobado ? 'Aprobado' : 'Pendiente',
    nombreLavanderia: item.lavanderia?.nombre,
  };
};
