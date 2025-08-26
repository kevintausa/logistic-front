import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import DocumentUpload from '@/components/documents/DocumentUpload';
import DocumentList from '@/components/documents/DocumentList';
import * as documentsApi from '@/services/documentsService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import StorageUsageIndicator from '@/components/documents/StorageUsageIndicator';
import { fetchEmployees } from '@/pages/parametrizacion/employees/Services/employees.services';

export default function EmployeeDocumentsPage() {
  const { idEmpleado } = useParams();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [emp, setEmp] = useState(null);
  const [loadingEmp, setLoadingEmp] = useState(false);
  const navigate = useNavigate();

  const load = async () => {
    try {
      setLoading(true);
      const data = await documentsApi.listDocuments({ ownerType: 'employee', ownerId: idEmpleado });
      setItems(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (idEmpleado) load();
  }, [idEmpleado]);

  useEffect(() => {
    const loadEmp = async () => {
      if (!idEmpleado) return;
      setLoadingEmp(true);
      try {
        const { data } = await fetchEmployees({ limit: 1, offset: 1, query: { _id: idEmpleado } });
        setEmp(Array.isArray(data) && data.length ? data[0] : null);
      } catch (e) {
        console.error(e);
      } finally {
        setLoadingEmp(false);
      }
    };
    loadEmp();
  }, [idEmpleado]);

  const handleUploaded = () => load();
  const handleDownload = async (id) => {
    try {
      const url = await documentsApi.getPresignedDownload({ id });
      window.open(url, '_blank');
    } catch (e) {
      console.error(e);
    }
  };
  const handleDelete = async (id) => {
    try {
      await documentsApi.deleteDocument({ id });
      await load();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="px-2">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="text-sm text-muted-foreground">
          <Link to="/documentacion" className="hover:underline">Documentación</Link>
          <span className="mx-1">/</span>
          <Link to="/documentacion/empleados" className="hover:underline">Empleados</Link>
          <span className="mx-1">/</span>
          <span className="text-foreground">Detalle</span>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            Documentos del Empleado
          </CardTitle>
          <div className="mt-1 text-sm text-muted-foreground">
            {loadingEmp ? (
              <span>Cargando información del empleado...</span>
            ) : emp ? (
              <span>
                <span className="font-medium text-foreground">{emp.nombre || emp.name}</span>
                {` · Documento: ${emp.documento || emp.numeroDocumento || emp.cedula || emp.identificacion || 'N/D'}`}
              </span>
            ) : (
              <span>No se encontró información del empleado.</span>
            )}
          </div>
          <StorageUsageIndicator className="mt-3" />
        </CardHeader>
        <CardContent>
          <DocumentUpload ownerType="employee" ownerId={idEmpleado} onUploaded={handleUploaded} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Listado</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-sm text-muted-foreground">Cargando...</div>
          ) : (
            <DocumentList items={items} onDownload={handleDownload} onDelete={handleDelete} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
