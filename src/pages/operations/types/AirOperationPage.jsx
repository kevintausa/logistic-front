import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import OperationModuleBase from '@/components/operations/OperationModuleBase';
import { operationsColumns, columnsExcel } from '@/pages/operations/utils/operationsColumns';
import { fetchOperations, exportOperations, createOperation } from '@/pages/operations/Services/operations.services';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import AirOperationModal from '@/pages/operations/components/air/AirOperationModal';
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
  // refresh tokens por sección
  const [refreshInitial, setRefreshInitial] = useState(0);
  const [refreshInCourse] = useState(0);
  const [refreshFinal] = useState(0);

  const handleOpenModal = useCallback(() => setIsModalOpen(true), []);
  const handleCloseModal = useCallback(() => setIsModalOpen(false), []);

  const handleSaveItem = useCallback(async (payload) => {
    try {
      // En Aéreo, se espera tipoOperacion importacion_aerea/exportacion_aerea desde el modal
      const resp = await createOperation(payload);
      if (resp?.code === 201) {
        toast({ title: 'Solicitud creada', description: 'Se creó la solicitud aérea.' });
      } else {
        throw new Error(resp?.message || 'Error al crear la solicitud');
      }
      setIsModalOpen(false);
      // Solo refrescar la sección de iniciales
      setRefreshInitial((n) => n + 1);
    } catch (e) {
      toast({ title: 'Error', description: e.message || 'No se pudo crear la solicitud.', variant: 'destructive' });
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
        columns={operationsColumns}
        filterFields={FILTER_FIELDS}
        fetchService={fetchOperations}
        exportService={exportOperations}
        columnsExcel={columnsExcel}
        fileName="operaciones_aereo"
        enforcedFilters={{
          'tipoOperacion.id': { $in: ['importacion_aerea', 'exportacion_aerea'] },
          'estado': { $in: ['Pendiente', 'Tarifa Seleccionada', 'Pendiente de Aprobación', 'Oferta enviada', 'Oferta Rechazada'] },
        }}
        hiddenFilterKeys={['tipoOperacion.id', 'estado']}
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
          columns={operationsColumns}
          filterFields={FILTER_FIELDS}
          fetchService={fetchOperations}
          exportService={exportOperations}
          columnsExcel={columnsExcel}
          fileName="operaciones_aereo_en_curso"
          enforcedFilters={{
            'tipoOperacion.id': { $in: ['importacion_aerea', 'exportacion_aerea'] },
            'estado': 'En curso',
          }}
          hiddenFilterKeys={['tipoOperacion.id', 'estado']}
          refreshToken={refreshInCourse}
        />
      </div>

      {/* Sección 3: Finalizadas / Canceladas */}
      <div className="mt-6">
        <OperationModuleBase
          title="Finalizadas"
          description="Operaciones finalizadas o canceladas."
          columns={operationsColumns}
          filterFields={FILTER_FIELDS}
          fetchService={fetchOperations}
          exportService={exportOperations}
          columnsExcel={columnsExcel}
          fileName="operaciones_aereo_finalizadas"
          enforcedFilters={{
            'tipoOperacion.id': { $in: ['importacion_aerea', 'exportacion_aerea'] },
            'estado': { $in: ['Finalizada', 'Cancelada'] },
          }}
          hiddenFilterKeys={['tipoOperacion.id', 'estado']}
          refreshToken={refreshFinal}
        />
      </div>

      <AirOperationModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSave={handleSaveItem}
        title="Crear Solicitud Aérea"
      />
    </div>
  );
}
