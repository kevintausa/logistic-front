import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import OperationModuleBase from '@/components/operations/OperationModuleBase';
import { airOperationsColumns, airColumnsExcel } from '@/pages/operations/utils/airOperationsColumns';
import { getAirOperations, exportAirOperations, createAirRequest } from '@/pages/operations/Services/air-requests.services';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import AirOperationModal from '@/pages/operations/components/air/AirOperationModal';
import AirOperationDetails from '@/pages/operations/components/air/AirOperationDetails';
import RequestQuoteModal from '@/pages/operations/components/air/RequestQuoteModal';
import { useToast } from '@/components/ui/use-toast';
import { useState, useCallback } from 'react';

export default function AirOperationPage() {
  // Filtros disponibles (mínimos por ahora). Puedes extenderlos como en OperationsPage
  const FILTER_FIELDS = useMemo(() => (
    [
      { id: 'estado', label: 'Estado', type: 'select', options: ['Pendiente', 'Tarifa Seleccionada', 'Pendiente de Aprobación', 'Oferta enviada', 'Oferta Rechazada', 'En curso', 'Finalizada', 'Cancelada'].map(v => ({ value: v, label: v })) },
      // { id: 'tipoOperacion.id', label: 'Tipo Operación', type: 'select', options: [...] },
    ]
  ), []);

  const { toast } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isQuoteOpen, setIsQuoteOpen] = useState(false);
  const [selectedOperation, setSelectedOperation] = useState(null);
  const [selectedOperationId, setSelectedOperationId] = useState(null);
  // refresh tokens por sección
  const [refreshInitial, setRefreshInitial] = useState(0);
  const [refreshInCourse] = useState(0);
  const [refreshFinal] = useState(0);

  const handleOpenModal = useCallback(() => setIsModalOpen(true), []);
  const handleCloseModal = useCallback(() => setIsModalOpen(false), []);

  const handleAction = useCallback((actionKey, row) => {
    if (actionKey === 'view') {
      setSelectedOperation(row || null);
      setSelectedOperationId(row?._id || null);
      setIsDetailsOpen(true);
    } else if (actionKey === 'requestQuote') {
      setSelectedOperation(row || null);
      setIsQuoteOpen(true);
    }
  }, []);

  const handleSaveItem = useCallback(async (payload) => {
    try {
      // El modal ya creó la solicitud (onSave recibe result.data). Solo notificar y refrescar.
      toast({ title: 'Solicitud creada', description: 'Se creó la solicitud aérea.' });
      setIsModalOpen(false);
      setRefreshInitial((n) => n + 1);
    } catch (e) {
      toast({ title: 'Error', description: e.message || 'No se pudo procesar la solicitud.', variant: 'destructive' });
    }
  }, [toast]);

  return (
    <div className="p-4 md:p-6">
      <div className="mb-3">
        <Button asChild variant="outline">
          <Link to="/operaciones/modulos"><ArrowLeft className="mr-2 h-4 w-4" /> Volver</Link>
        </Button>
      </div>
      <div className="mb-4">
        <h1 className="text-2xl font-semibold">Aéreo</h1>
        <p className="text-muted-foreground">Gestión de solicitudes y operaciones aéreas.</p>
      </div>
      {/* Sección 1: Estados iniciales */}
      <OperationModuleBase
        title="Solicitudes"
        description="Operaciones en estados iniciales."
        columns={airOperationsColumns}
        filterFields={FILTER_FIELDS}
        fetchService={getAirOperations}
        exportService={exportAirOperations}
        columnsExcel={airColumnsExcel}
        fileName="operaciones_aereo"
        onAction={handleAction}
        enforcedFilters={{
          'estado': { $in: ['Pendiente', 'Tarifa Seleccionada', 'Pendiente de Aprobación', 'Oferta enviada', 'Oferta Rechazada'] },
        }}
        hiddenFilterKeys={['estado']}
        refreshToken={refreshInitial}
        renderHeaderActions={() => (
          <div className="flex gap-2">
            <Button variant="default" onClick={handleOpenModal}>Crear Solicitud</Button>
          </div>
        )}
      />

      {/* Sección 2: En curso */}
      <div className="mt-6">
        <OperationModuleBase
          title="En curso"
          description="Operaciones actualmente en curso."
          columns={airOperationsColumns}
          filterFields={FILTER_FIELDS}
          fetchService={getAirOperations}
          exportService={exportAirOperations}
          columnsExcel={airColumnsExcel}
          fileName="operaciones_aereo_en_curso"
          onAction={handleAction}
          enforcedFilters={{
            'estado': 'En curso',
          }}
          hiddenFilterKeys={['estado']}
          refreshToken={refreshInCourse}
        />
      </div>

      {/* Sección 3: Finalizadas / Canceladas */}
      <div className="mt-6">
        <OperationModuleBase
          title="Finalizadas"
          description="Operaciones finalizadas o canceladas."
          columns={airOperationsColumns}
          filterFields={FILTER_FIELDS}
          fetchService={getAirOperations}
          exportService={exportAirOperations}
          columnsExcel={airColumnsExcel}
          fileName="operaciones_aereo_finalizadas"
          onAction={handleAction}
          enforcedFilters={{
            'estado': { $in: ['Finalizada', 'Cancelada'] },
          }}
          hiddenFilterKeys={['estado']}
          refreshToken={refreshFinal}
        />
      </div>

      <AirOperationModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSave={handleSaveItem}
        title="Crear Solicitud Aérea"
      />

      <AirOperationDetails
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        operation={selectedOperation}
        operationId={selectedOperationId}
      />

      <RequestQuoteModal
        isOpen={isQuoteOpen}
        onClose={() => setIsQuoteOpen(false)}
        operation={selectedOperation}
      />
    </div>
  );
}
