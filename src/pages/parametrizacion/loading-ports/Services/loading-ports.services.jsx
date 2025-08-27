const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const fetchLoadingPorts = async ({ limit, offset, query }) => {
  const res = await fetch(`${API_URL}/loading-port/filter`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ limit, offset, query })
  });
  if (!res.ok) throw new Error('Error al obtener puertos de carga');
  return await res.json();
};

export const createLoadingPort = async (payload) => {
  const res = await fetch(`${API_URL}/loading-port/create`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error('Error al crear puerto de carga');
  return await res.json();
};

export const updateLoadingPort = async (id, payload) => {
  const res = await fetch(`${API_URL}/loading-port/update/${id}`, {
    method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error('Error al actualizar puerto de carga');
  return await res.json();
};

export const deleteLoadingPort = async (id) => {
  const res = await fetch(`${API_URL}/loading-port/delete/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Error al eliminar puerto de carga');
  return await res.json();
};

export const exportLoadingPorts = async ({ query = {} } = {}) => {
  const res = await fetch(`${API_URL}/loading-port/export`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ query })
  });
  if (!res.ok) throw new Error('Error al exportar puertos de carga');
  const data = await res.json();
  return data.data;
};
