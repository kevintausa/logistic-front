import React from 'react';

/**
 * Preview simple para PDFs e imágenes. Para otros tipos muestra mensaje.
 * Props: { url: string, mimeType?: string, fileName?: string }
 */
export default function DocumentPreview({ url, mimeType, fileName }) {
  const isPdf = (mimeType || '').includes('pdf') || (fileName || '').toLowerCase().endsWith('.pdf');
  const isImage = (mimeType || '').startsWith('image/') || /\.(png|jpg|jpeg|gif|webp)$/i.test(fileName || '');

  if (!url) return null;

  if (isPdf) {
    return (
      <iframe title={fileName || 'preview'} src={url} className="w-full h-[70vh] border rounded" />
    );
  }
  if (isImage) {
    return (
      <img alt={fileName || 'preview'} src={url} className="max-h-[70vh] mx-auto" />
    );
  }
  return (
    <div className="text-sm text-muted-foreground">No hay vista previa para este tipo. Descarga el archivo.</div>
  );
}
