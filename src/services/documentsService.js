// Servicio de documentos (frontend)
// Nota: Endpoints en backend por definir. Se asume base '/documents'.
// Ajustar según tu API real.


import axios from 'axios';
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const BASE = `${API_URL}/documents`;

export async function listDocuments({ ownerType, ownerId, docType }) {
  const params = { ownerType, ownerId };
  if (docType) params.docType = docType;
  const { data } = await axios.get(`${BASE}`, { params });
  const items = data?.items || data || [];
  return items.map((it) => ({
    ...it,
    id: it.id || it._id,
    uploadedAt: it.createdAt || it.uploadedAt,
  }));
}

export async function getPresignedUpload({ ownerType, ownerId, docType, fileName, mimeType, sizeBytes, expiresAt }) {
  const { data } = await axios.post(`${BASE}/presign-upload`, {
    ownerType,
    ownerId,
    docType,
    fileName,
    mimeType,
    sizeBytes,
    expiresAt,
  });
  return data;
}

export async function uploadToPresignedUrl({ presign, file, onProgress }) {
  // Soporta presign tipo PUT (URL única) o POST (formData + fields)
  if (presign.method === 'POST' && presign.url && presign.fields) {
    const formData = new FormData();
    Object.entries(presign.fields).forEach(([k, v]) => formData.append(k, v));
    formData.append('file', file);
    await axios.post(presign.url, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (e) => {
        if (!onProgress) return;
        const pct = e.total ? Math.round((e.loaded / e.total) * 100) : 0;
        onProgress(pct);
      },
    });
    return;
  }
  // PUT simple
  await axios.put(presign.url, file, {
    headers: { 'Content-Type': file.type || 'application/octet-stream' },
    onUploadProgress: (e) => {
      if (!onProgress) return;
      const pct = e.total ? Math.round((e.loaded / e.total) * 100) : 0;
      onProgress(pct);
    },
  });
}

export async function confirmUpload({ presign }) {
  // si tu backend lo requiere para persistir metadatos finales
  const { data } = await axios.post(`${BASE}/confirm-upload`, { token: presign.token, ...presign.meta });
  return data;
}

export async function getPresignedDownload({ id }) {
  if (!id) throw new Error('Documento inválido: id requerido');
  const { data } = await axios.get(`${BASE}/${id}/presign-download`);
  return data?.url || data;
}

export async function deleteDocument({ id }) {
  if (!id) throw new Error('Documento inválido: id requerido');
  const { data } = await axios.delete(`${BASE}/${id}`);
  return data;
}

export async function getUsage({ ownerType, ownerId } = {}) {
  const params = {};
  if (ownerType) params.ownerType = ownerType;
  if (ownerId) params.ownerId = ownerId;
  const { data } = await axios.get(`${BASE}/usage`, { params });
  const totalBytes = data?.totalBytes ?? 0;
  // Enforce 10 GB (decimal) as the quota on the client side
  const limitBytes = 10 * 1000 * 1000 * 1000;
  const percent = Math.min(100, limitBytes > 0 ? (totalBytes / limitBytes) * 100 : 0);
  return {
    totalBytes,
    limitBytes,
    percent,
    count: data?.count ?? 0,
  };
}

// Helper de alto nivel: hace presign -> upload -> confirm en una sola llamada
export async function uploadDocumentFlow({ ownerType, ownerId, docType, file, onProgress }) {
  if (!file) throw new Error('Archivo requerido');
  const presign = await getPresignedUpload({
    ownerType,
    ownerId,
    docType,
    fileName: file.name,
    mimeType: file.type,
    sizeBytes: file.size,
  });

  // Guardamos meta para confirmar correctamente en backend
  presign.meta = {
    ownerType,
    ownerId,
    docType,
    fileName: file.name,
    mimeType: file.type,
    sizeBytes: file.size,
  };

  await uploadToPresignedUrl({ presign, file, onProgress });
  const saved = await confirmUpload({ presign });
  return { ...saved, id: saved.id || saved._id, uploadedAt: saved.createdAt || saved.uploadedAt };
}

export async function getDownloadUrlOrOpen({ id, openInNewTab = false }) {
  if (!id) throw new Error('Documento inválido: id requerido');
  const url = await getPresignedDownload({ id });
  if (openInNewTab && url) {
    window.open(url, '_blank', 'noopener,noreferrer');
  }
  return url;
}
