import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import OperationModuleBase from '@/components/operations/OperationModuleBase';
import { operationsColumns, columnsExcel } from '@/pages/operations/utils/operationsColumns';
import { fetchOperations, exportOperations } from '@/pages/operations/Services/operations.services';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function TariffsPage() {
  const FILTER_FIELDS = useMemo(() => (
    [
      { id: 'estado', label: 'Estado', type: 'select', options: ['Pendiente','Tarifa Seleccionada','Pendiente de Aprobación','Oferta enviada','Oferta Rechazada','En curso','Finalizada','Cancelada'].map(v => ({ value: v, label: v })) },
    ]
  ), []);

  return (
    <div className="p-4 md:p-6">
      <div className="mb-3">
        <Button asChild variant="outline">
          <Link to="/operaciones/modulos"><ArrowLeft className="mr-2 h-4 w-4" /> Volver</Link>
        </Button>
      </div>
      <OperationModuleBase
        title="Tarifas"
        description="Listado y gestión de tarifas por tipo de operación."
        columns={operationsColumns}
        filterFields={FILTER_FIELDS}
        fetchService={fetchOperations}
        exportService={exportOperations}
        columnsExcel={columnsExcel}
        fileName="operaciones_tarifas"
      />
    </div>
  );
}
