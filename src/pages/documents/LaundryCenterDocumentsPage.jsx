import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import DocumentUpload from '@/components/documents/DocumentUpload';
import DocumentList from '@/components/documents/DocumentList';
import * as documentsApi from '@/services/documentsService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import StorageUsageIndicator from '@/components/documents/StorageUsageIndicator';

export default function LaundryCenterDocumentsPage() {
  const { idLavanderia } = useParams();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const load = async () => {
    try {
      setLoading(true);
      const data = await documentsApi.listDocuments({ ownerType: 'laundry_center', ownerId: idLavanderia });
      setItems(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (idLavanderia) load();
  }, [idLavanderia]);

  // Laundries module removed: no center details fetch

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

  const location = useLocation();
  const fromCentersDashboard = location?.pathname?.startsWith('/centros-lavado/');

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="px-2">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="text-sm text-muted-foreground">
          {fromCentersDashboard ? (
            <>
              <Link to="/centros-lavado" className="hover:underline">Centros de Lavado</Link>
              <span className="mx-1">/</span>
              <span className="text-foreground">{center?.nombre || center?.name || 'Detalle'}</span>
              <span className="mx-1">/</span>
              <span className="text-foreground">Documentación</span>
            </>
          ) : (
            <>
              <Link to="/documentacion" className="hover:underline">Documentación</Link>
              <span className="mx-1">/</span>
              <Link to="/documentacion/centros" className="hover:underline">Centros de Lavado</Link>
              <span className="mx-1">/</span>
              <span className="text-foreground">Detalle</span>
            </>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Documentos del Centro de Lavado</CardTitle>
          <div className="mt-1 text-sm text-muted-foreground">Gestión de archivos por centro</div>
          <StorageUsageIndicator className="mt-3" />
        </CardHeader>
        <CardContent>
          <DocumentUpload ownerType="laundry_center" ownerId={idLavanderia} onUploaded={handleUploaded} />
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
