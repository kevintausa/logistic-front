import React from 'react';

export const gruposOptions = [
  { value: 'transporte', label: 'Transporte internacional' },
  { value: 'aduana', label: 'Gastos de Aduana' },
  { value: 'terrestre', label: 'Transporte Terrestre' },
  { value: 'seguro', label: 'Seguro' },
];

// Columnas para DataTable
export const offerConceptsColumns = [
  {
    id: 'opciones',
    label: 'Opciones',
    key: 'opciones',
    actions: [
      { key: 'edit', icon: 'Edit', label: 'Editar', tooltip: 'Editar concepto' },
      {
        key: 'toggle-active',
        icon: 'Check',
        label: 'Activar/Desactivar',
        tooltip: 'Cambiar estado',
      },
    ],
  },
  { id: 'concepto', label: 'Concepto', type: 'text' },
  { id: 'grupo', label: 'Grupo', type: 'text', render: (row) => <span className="capitalize">{row.grupo}</span> },
  { id: 'montoUsd', label: 'Monto (USD)', type: 'number', render: (row) => <span className="font-medium">{Number(row.montoUsd || 0).toFixed(2)}</span> },
  { id: 'activo', label: 'Activo', type: 'boolean' },
];

// Campos para DynamicFormModal (crear/editar)
export const offerConceptsFields = [
  { id: 'concepto', label: 'Concepto', type: 'text', required: true },
  { id: 'montoUsd', label: 'Monto (USD)', type: 'number', required: true, min: 0, step: 0.01 },
  { id: 'grupo', label: 'Grupo', type: 'select', options: gruposOptions, required: true, defaultValue: 'transporte' },
];
