const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const fetchVias = async ({ limit, offset, query }) => {
  const res = await fetch(`${API_URL}/via/filter`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ limit, offset, query })
  });
  if (!res.ok) throw new Error('Error al obtener vías');
  return await res.json();
};

export const createVia = async (payload) => {
  const res = await fetch(`${API_URL}/via/create`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error('Error al crear vía');
  return await res.json();
};

export const updateVia = async (id, payload) => {
  const res = await fetch(`${API_URL}/via/update/${id}`, {
    method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error('Error al actualizar vía');
  return await res.json();
};

export const deleteVia = async (id) => {
  const res = await fetch(`${API_URL}/via/delete/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Error al eliminar vía');
  return await res.json();
};

export const exportVias = async ({ query = {} } = {}) => {
  const res = await fetch(`${API_URL}/via/export`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ query })
  });
  if (!res.ok) throw new Error('Error al exportar vías');
  const data = await res.json();
  return data.data;
};
