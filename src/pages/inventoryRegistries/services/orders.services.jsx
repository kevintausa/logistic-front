const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export async function createOrder(payload) {
  const res = await fetch(`${API_URL}/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || 'Error creando pedido');
  }
  return res.json();
}

export async function fetchOrders({ lavanderiaId, estado, productoId } = {}) {
  const params = new URLSearchParams();
  if (lavanderiaId) params.append('lavanderiaId', lavanderiaId);
  if (estado) params.append('estado', estado);
  if (productoId) params.append('productoId', productoId);
  const url = `${API_URL}/orders${params.toString() ? `?${params.toString()}` : ''}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Error obteniendo pedidos');
  return res.json();
}

export async function sendOrderPreviewEmail(payload) {
  const res = await fetch(`${API_URL}/orders/preview-email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || 'Error enviando resumen');
  }
  return res.json();
}

export async function reserveOrderNumber() {
  const res = await fetch(`${API_URL}/orders/reserve-number`, {
    method: 'POST',
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || 'Error reservando número de pedido');
  }
  return res.json();
}
