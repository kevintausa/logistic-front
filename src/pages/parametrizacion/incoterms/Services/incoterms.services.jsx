const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const fetchIncoterms = async ({ limit, offset, query }) => {
  const res = await fetch(`${API_URL}/incoterm/filter`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ limit, offset, query })
  });
  if (!res.ok) throw new Error('Error al obtener incoterms');
  return await res.json();
};

export const createIncoterm = async (payload) => {
  const res = await fetch(`${API_URL}/incoterm/create`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error('Error al crear incoterm');
  return await res.json();
};

export const updateIncoterm = async (id, payload) => {
  const res = await fetch(`${API_URL}/incoterm/update/${id}`, {
    method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error('Error al actualizar incoterm');
  return await res.json();
};

export const deleteIncoterm = async (id) => {
  const res = await fetch(`${API_URL}/incoterm/delete/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Error al eliminar incoterm');
  return await res.json();
};

export const exportIncoterms = async ({ query = {} } = {}) => {
  const res = await fetch(`${API_URL}/incoterm/export`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ query })
  });
  if (!res.ok) throw new Error('Error al exportar incoterms');
  const data = await res.json();
  return data.data;
};
