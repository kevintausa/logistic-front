import React, { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import * as documentsApi from '@/services/documentsService';
import { fetchDocumentTypes } from '@/pages/parametrizacion/documentTypes/Services/documentTypes.services';

/**
 * Subida de documentos con metadatos.
 * Props:
 * - ownerType: 'employee' | 'laundry_center'
 * - ownerId: string
 * - onUploaded?: (docMeta) => void
 */
export default function DocumentUpload({ ownerType, ownerId, onUploaded }) {
  const [file, setFile] = useState(null);
  const [docType, setDocType] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [types, setTypes] = useState([]);

  // Cargar tipos desde parametrización
  useEffect(() => {
    const load = async () => {
      try {
        const appliesTo = ownerType === 'employee'
          ? 'empleado'
          : ownerType === 'laundry_center'
          ? 'centro'
          : ownerType === 'client'
          ? 'cliente'
          : undefined;
        const { data = [] } = await fetchDocumentTypes({ limit: 100, offset: 1, query: { estado: 'Activo' } });
        const filtered = appliesTo ? data.filter(dt => (dt.aplicaA === 'ambos') || (dt.aplicaA === appliesTo)) : data;
        setTypes(filtered);
        if (!docType && filtered.length > 0) {
          const firstVal = filtered[0]._id;
          setDocType(String(firstVal));
        }
      } catch (e) {
        console.error('Error cargando tipos de archivo', e);
      }
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ownerType]);

  const options = useMemo(() => types.map(dt => ({
    value: String(dt._id),
    label: dt.nombre,
  })), [types]);

  const selectedType = useMemo(() => {
    return types.find(dt => String(dt._id) === String(docType));
  }, [types, docType]);

  const acceptAttr = '.pdf,image/*';

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!file) return;
    try {
      setLoading(true);
      setProgress(5);

      // Determinar el nombre del tipo seleccionado
      const docTypeName = selectedType?.nombre || selectedType?.label || '';

      // 1) Solicitar URL prefirmada al backend
      const presign = await documentsApi.getPresignedUpload({
        ownerType,
        ownerId,
        docType: docTypeName,
        fileName: file.name,
        mimeType: file.type,
        sizeBytes: file.size,
        expiresAt: expiresAt || null,
      });

      setProgress(15);

      // 2) Subir directo al storage usando la URL prefirmada
      await documentsApi.uploadToPresignedUrl({ presign, file, onProgress: (pct) => setProgress(15 + Math.round(pct * 0.8)) });

      setProgress(98);

      // 3) Confirmar en backend y registrar metadatos finales (si tu flujo lo requiere)
      // Adjuntamos metadatos para que el backend persista docType y demás
      presign.meta = {
        ownerType,
        ownerId,
        docType: docTypeName,
        fileName: file.name,
        mimeType: file.type,
        sizeBytes: file.size,
        expiresAt: expiresAt || null,
      };
      const saved = await documentsApi.confirmUpload({ presign });

      setProgress(100);
      if (onUploaded) onUploaded(saved);

      // Reset
      setFile(null);
      setExpiresAt('');
    } catch (err) {
      console.error('Upload error', err);
      alert('Error subiendo documento. Ver consola.');
    } finally {
      setLoading(false);
      setProgress(0);
    }
  };

  return (
    <Card className="border-muted/50">
      <CardHeader className="py-1">
        <CardTitle className="text-base">Subir documento</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <form onSubmit={onSubmit} className="flex flex-wrap items-end gap-2">
          <div className="flex flex-col gap-1 min-w-[180px]">
            <Label className="text-xs text-muted-foreground">Tipo</Label>
            <Select value={docType} onValueChange={setDocType} disabled={options.length === 0}>
              <SelectTrigger className="h-8 text-sm">
                <SelectValue placeholder={options.length === 0 ? 'Sin tipos disponibles' : 'Tipo'} />
              </SelectTrigger>
              <SelectContent>
                {options.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1 min-w-[220px] flex-1">
            <Label className="text-xs text-muted-foreground">Archivo</Label>
            <Input
              className="h-8 text-sm text-foreground file:text-sm file:text-foreground" 
              type="file"
              accept={acceptAttr}
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
          </div>

          {selectedType?.requiereVencimiento && (
            <div className="flex flex-col gap-1 min-w-[160px]">
              <Label className="text-xs text-muted-foreground">Vence</Label>
              <Input className="h-8 text-sm" type="date" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} />
            </div>
          )}

          <div className="flex gap-2">
            <Button type="submit" size="sm" disabled={!file || loading} className="h-8">Subir</Button>
          </div>

          {loading && (
            <div className="w-full mt-1">
              <div className="h-1 w-full bg-muted rounded">
                <div className="h-1 bg-primary rounded transition-all" style={{ width: `${progress}%` }} />
              </div>
              <span className="text-[10px] text-muted-foreground">Subiendo {progress}%</span>
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  );
}
