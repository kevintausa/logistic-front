const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const createQuote = async (payload) => {
  const res = await fetch(`${API_URL}/quotes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Error al crear la cotización');
  return await res.json();
};

export const fetchQuotes = async ({ limit = 10, offset = 1, query = {} }) => {
  const url = new URL(`${API_URL}/quotes`);
  url.searchParams.append('limit', limit);
  url.searchParams.append('offset', offset);
  if (Object.keys(query).length > 0) url.searchParams.append('query', JSON.stringify(query));
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error('Error al obtener cotizaciones');
  return await res.json();
};

export const updateQuote = async (id, payload) => {
  const res = await fetch(`${API_URL}/quotes/${id}`, {
    method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error('Error al actualizar cotización');
  return await res.json();
};

export const deleteQuote = async (id) => {
  const res = await fetch(`${API_URL}/quotes/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Error al eliminar cotización');
  return await res.json();
};
