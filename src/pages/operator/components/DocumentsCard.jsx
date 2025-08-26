import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileDown } from 'lucide-react';

// Descarga de documentación del operador.
const DocumentsCard = ({ onDownloadCertificate, onDownloadManual }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileDown className="h-5 w-5" /> Documentación y Certificados
        </CardTitle>
        <CardDescription>Descarga tus certificados, manuales y documentos.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="text-sm text-muted-foreground">No hay documentos disponibles.</div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={onDownloadCertificate}>Descargar Certificado</Button>
          <Button variant="outline" size="sm" onClick={onDownloadManual}>Descargar Manual</Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default DocumentsCard;
