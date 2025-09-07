import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import OperationModuleBase from '@/components/operations/OperationModuleBase';
import { operationsColumns, columnsExcel } from '@/pages/operations/utils/operationsColumns';
import { fetchOperations, exportOperations, createOperation } from '@/pages/operations/Services/operations.services';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import OperationModal from '@/pages/operations/components/OperationModal';
import { useToast } from '@/components/ui/use-toast';
import { useState, useCallback } from 'react';

export default function GroundTransportOperationPage() {
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
      <GroundTransportOperationsSection FILTER_FIELDS={FILTER_FIELDS} />
    </div>
  );
}

function GroundTransportOperationsSection({ FILTER_FIELDS }) {
  const { toast } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [refreshToken, setRefreshToken] = useState(0);

  const handleOpenModal = useCallback(() => setIsModalOpen(true), []);
  const handleCloseModal = useCallback(() => setIsModalOpen(false), []);

  const handleSaveItem = useCallback(async (payload) => {
    try {
      const resp = await createOperation(payload);
      if (resp?.code === 201) {
        toast({ title: 'Solicitud creada', description: 'Se creó la solicitud de Transporte Terrestre.' });
      } else {
        throw new Error(resp?.message || 'Error al crear la solicitud');
      }
      setIsModalOpen(false);
      setRefreshToken((n) => n + 1);
    } catch (e) {
      toast({ title: 'Error', description: e.message || 'No se pudo crear la solicitud.', variant: 'destructive' });
    }
  }, [toast]);

  const initialItem = useMemo(() => ({ tipoOperacion: { id: 'transporte_terrestre', nombre: 'Transporte terrestre' } }), []);

  return (
    <>
      <OperationModuleBase
        title="Transporte Terrestre"
        description="Listado y gestión de operaciones de transporte terrestre."
        columns={operationsColumns}
        filterFields={FILTER_FIELDS}
        fetchService={fetchOperations}
        exportService={exportOperations}
        columnsExcel={columnsExcel}
        fileName="operaciones_transporte_terrestre"
        defaultFilters={{ 'tipoOperacion.id': 'transporte_terrestre' }}
        refreshToken={refreshToken}
        renderHeaderActions={() => (
          <div className="flex gap-2">
            <Button variant="default" onClick={handleOpenModal}>Crear Solicitud</Button>
            <Button asChild variant="secondary">
              <Link to="/operaciones">Seguimiento</Link>
            </Button>
          </div>
        )}
      />
      <OperationModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSave={handleSaveItem}
        item={initialItem}
        title="Crear Solicitud Transporte Terrestre"
      />
    </>
  );
}
