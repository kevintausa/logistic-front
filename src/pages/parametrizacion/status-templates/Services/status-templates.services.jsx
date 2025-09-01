const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const fetchStatusTemplates = async ({ limit, offset, query }) => {
  const res = await fetch(`${API_URL}/status-template/filter`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ limit, offset, query })
  });
  if (!res.ok) throw new Error('Error al obtener plantillas de estatus');
  return await res.json();
};

export const createStatusTemplate = async (payload) => {
  const res = await fetch(`${API_URL}/status-template/create`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error('Error al crear plantilla');
  return await res.json();
};

export const updateStatusTemplate = async (id, payload) => {
  const res = await fetch(`${API_URL}/status-template/update/${id}`, {
    method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error('Error al actualizar plantilla');
  return await res.json();
};

export const deleteStatusTemplate = async (id) => {
  const res = await fetch(`${API_URL}/status-template/delete/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Error al eliminar plantilla');
  return await res.json();
};

export const exportStatusTemplates = async ({ query = {} } = {}) => {
  const res = await fetch(`${API_URL}/status-template/export`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ query })
  });
  if (!res.ok) throw new Error('Error al exportar plantillas');
  const data = await res.json();
  return data.data;
};
