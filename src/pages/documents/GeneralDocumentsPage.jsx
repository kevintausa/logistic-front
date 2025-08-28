import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import DocumentUpload from '@/components/documents/DocumentUpload';
import DocumentList from '@/components/documents/DocumentList';
import * as documentsApi from '@/services/documentsService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import StorageUsageIndicator from '@/components/documents/StorageUsageIndicator';

export default function GeneralDocumentsPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      const data = await documentsApi.listDocuments({ ownerType: 'general' });
      setItems(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

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
      {/* Breadcrumb */}
      <div className="text-sm text-muted-foreground">
        <Link to="/documentacion" className="hover:underline">Documentación</Link>
        <span className="mx-1">/</span>
        <span className="text-foreground">General</span>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Documentación General</CardTitle>
          <StorageUsageIndicator className="mt-3" />
        </CardHeader>
        <CardContent>
          <DocumentUpload ownerType="general" onUploaded={handleUploaded} />
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
