import React from 'react';
import { Button } from '@/components/ui/button';
import { Download, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

/**
 * Lista de documentos con acciones básicas.
 * Props:
 * - items: Array<{ id, docType, fileName, uploadedAt, expiresAt, mimeType }>
 * - onDownload: (id) => void
 * - onDelete?: (id) => void
 */
export default function DocumentList({ items = [], onDownload, onDelete }) {
  const typeLabel = (t) => {
    const map = {
      arl: 'ARL',
      certificacion_laboral: 'Certificación laboral',
      ficha_tecnica: 'Ficha técnica',
      seguridad: 'Seguridad',
      otro: 'Otro',
    };
    return map[t] || t;
  };

  const expiryBadge = (expiresAt) => {
    if (!expiresAt) return null;
    const d = new Date(expiresAt);
    const days = Math.ceil((d - new Date()) / (1000 * 60 * 60 * 24));
    let variant = 'secondary';
    if (days <= 0) variant = 'destructive';
    else if (days <= 30) variant = 'default';
    return <Badge variant={variant}>Vence: {d.toLocaleDateString()}</Badge>;
  };

  return (
    <div className="w-full">
      {/* Mobile cards */}
      <div className="sm:hidden space-y-2">
        {items.map((it) => (
          <div key={it.id} className="border rounded-md p-3 bg-background">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="text-sm font-medium truncate">{typeLabel(it.docType)}</div>
                <div className="text-xs text-muted-foreground truncate">{it.fileName}</div>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => onDownload?.(it.id)}
                  title="Descargar"
                  aria-label="Descargar"
                >
                  <Download className="h-4 w-4" />
                </Button>
                {onDelete && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => onDelete(it.id)}
                    title="Eliminar"
                    aria-label="Eliminar"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className="text-[11px] text-muted-foreground">
                {it.uploadedAt ? new Date(it.uploadedAt).toLocaleDateString() : '-'}
              </span>
              {expiryBadge(it.expiresAt)}
            </div>
          </div>
        ))}
        {items.length === 0 && (
          <div className="text-center text-muted-foreground py-6 text-sm">Sin documentos</div>
        )}
      </div>

      {/* Desktop table */}
      <div className="hidden sm:block overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tipo</TableHead>
              <TableHead>Archivo</TableHead>
              <TableHead>Subido</TableHead>
              <TableHead>Vencimiento</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((it) => (
              <TableRow key={it.id}>
                <TableCell>{typeLabel(it.docType)}</TableCell>
                <TableCell>{it.fileName}</TableCell>
                <TableCell>{it.uploadedAt ? new Date(it.uploadedAt).toLocaleString() : '-'}</TableCell>
                <TableCell>{expiryBadge(it.expiresAt)}</TableCell>
                <TableCell className="text-right space-x-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => onDownload?.(it.id)}
                    title="Descargar"
                    aria-label="Descargar"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  {onDelete && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => onDelete(it.id)}
                      title="Eliminar"
                      aria-label="Eliminar"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
            {items.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-6">
                  Sin documentos
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
