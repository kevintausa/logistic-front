import React, { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import * as documentsApi from '@/services/documentsService';
import DocumentList from '@/components/documents/DocumentList';
import { getEmployeeByCedula } from '@/pages/workedHours/services/workedHours.services';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import StorageUsageIndicator from '@/components/documents/StorageUsageIndicator';

// Página independiente: Documentación del operario
// TODO: Consumir endpoint de documentos por empleado y listar descargas
const OperatorDocumentsPage = () => {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const userCedula = useMemo(() => (
    user?.raw?.cedula || user?.cedula || user?.documento || user?.numeroDocumento || null
  ), [user]);

  const load = async () => {
    try {
      setLoading(true);
      let ownerId = null;

      if (userCedula) {
        // Resolver por cédula usando el endpoint existente
        const emp = await getEmployeeByCedula(userCedula);
        // El endpoint devuelve { data: { _id, ... }, state, ... }
        ownerId = emp?.data?._id || emp?._id || emp?.id || null;
      }

      if (!ownerId) {
        setItems([]);
        console.warn('No se pudo resolver el id del empleado desde la cédula de la sesión.');
        return;
      }

      const list = await documentsApi.listDocuments({ ownerType: 'employee', ownerId });
      setItems(list);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userCedula, user?.id]);

  const handleDownload = async (id) => {
    try {
      const url = await documentsApi.getPresignedDownload({ id });
      if (url) window.open(url, '_blank');
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="p-2 sm:p-4 space-y-3 sm:space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3">
        <Button asChild variant="outline" className="w-full sm:w-auto">
          <Link to="/operario-dashboard"><ArrowLeft className="mr-2 h-4 w-4" /> Volver</Link>
        </Button>
        <div className="hidden sm:block" />
      </div>

      <div className="space-y-1">
        <h1 className="text-xl sm:text-2xl font-bold leading-tight">Documentación y Certificados</h1>
        <p className="text-xs sm:text-sm text-muted-foreground">Descarga tus certificados, manuales y documentos.</p>
        <StorageUsageIndicator />
      </div>

      <div className="rounded-md border bg-background p-3 sm:p-4 space-y-3">
        {loading ? (
          <div className="text-sm text-muted-foreground">Cargando...</div>
        ) : (
          <DocumentList items={items} onDownload={handleDownload} />
        )}
        {(!loading && items.length === 0) && (
          <div className="text-sm text-muted-foreground">No tienes documentos disponibles aún.</div>
        )}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
          <Button variant="outline" size="sm" onClick={load} className="w-full sm:w-auto">Actualizar</Button>
        </div>
      </div>
    </div>
  );
};

export default OperatorDocumentsPage;
