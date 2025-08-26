// Definimos la URL base según la variable de entorno, con fallback a localhost
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export async function getCurrentInventory({ lavanderiaId, productoId } = {}) {
  const params = new URLSearchParams();
  if (lavanderiaId) params.append('lavanderiaId', lavanderiaId);
  if (productoId) params.append('productoId', productoId);
  const url = `${API_URL}/inventory-current${params.toString() ? `?${params.toString()}` : ''}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Error fetching current inventory');
  return res.json();
}
