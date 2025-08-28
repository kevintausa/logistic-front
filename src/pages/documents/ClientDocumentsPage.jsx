import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import DocumentUpload from '@/components/documents/DocumentUpload';
import DocumentList from '@/components/documents/DocumentList';
import * as documentsApi from '@/services/documentsService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import StorageUsageIndicator from '@/components/documents/StorageUsageIndicator';
import { fetchClients } from '@/pages/parametrizacion/clients/Services/clients.services.jsx';

export default function ClientDocumentsPage() {
  const { idCliente } = useParams();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [client, setClient] = useState(null);
  const [loadingClient, setLoadingClient] = useState(false);
  const navigate = useNavigate();

  const load = async () => {
    try {
      setLoading(true);
      const data = await documentsApi.listDocuments({ ownerType: 'client', ownerId: idCliente });
      setItems(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (idCliente) load();
  }, [idCliente]);

  useEffect(() => {
    const loadClient = async () => {
      if (!idCliente) return;
      setLoadingClient(true);
      try {
        const { data } = await fetchClients({ limit: 1, offset: 1, query: { _id: idCliente } });
        setClient(Array.isArray(data) && data.length ? data[0] : null);
      } catch (e) {
        console.error(e);
      } finally {
        setLoadingClient(false);
      }
    };
    loadClient();
  }, [idCliente]);

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
          <Link to="/documentacion/clientes" className="hover:underline">Clientes</Link>
          <span className="mx-1">/</span>
          <span className="text-foreground">Detalle</span>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            Documentos del Cliente
          </CardTitle>
          <div className="mt-1 text-sm text-muted-foreground">
            {loadingClient ? (
              <span>Cargando información del cliente...</span>
            ) : client ? (
              <span>
                <span className="font-medium text-foreground">{client.nombre || client.name}</span>
                {(() => {
                  const idStr = client.nit || client.documento || client.identificacion;
                  return idStr ? ` · NIT: ${idStr}` : '';
                })()}
              </span>
            ) : (
              <span>No se encontró información del cliente.</span>
            )}
          </div>
          <StorageUsageIndicator className="mt-3" />
        </CardHeader>
        <CardContent>
          <DocumentUpload ownerType="client" ownerId={idCliente} onUploaded={handleUploaded} />
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
