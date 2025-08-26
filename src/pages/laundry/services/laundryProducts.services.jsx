const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const LP_API_URL = `${API_URL}/laundry-products`;

export async function fetchLaundryProducts({ lavanderiaId, onlyActive = true } = {}) {
  const params = new URLSearchParams();
  if (lavanderiaId) params.append('lavanderiaId', lavanderiaId);
  if (onlyActive != null) params.append('onlyActive', String(onlyActive));
  const url = `${LP_API_URL}${params.toString() ? `?${params.toString()}` : ''}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Error obteniendo productos del centro');
  return res.json();
}

export async function createLaundryProduct(payload) {
  const res = await fetch(LP_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || 'Error creando producto del centro');
  }
  return res.json();
}

export async function updateLaundryProduct(id, patch) {
  const res = await fetch(`${LP_API_URL}/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(patch),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || 'Error actualizando producto del centro');
  }
  return res.json();
}
