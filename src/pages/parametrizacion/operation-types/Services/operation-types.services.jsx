const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const fetchOperationTypes = async ({ limit, offset, query }) => {
  const res = await fetch(`${API_URL}/operation-type/filter`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ limit, offset, query })
  });
  if (!res.ok) throw new Error('Error al obtener tipos de operación');
  return await res.json();
};

export const createOperationType = async (payload) => {
  const res = await fetch(`${API_URL}/operation-type/create`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error('Error al crear tipo de operación');
  return await res.json();
};

export const updateOperationType = async (id, payload) => {
  const res = await fetch(`${API_URL}/operation-type/update/${id}`, {
    method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error('Error al actualizar tipo de operación');
  return await res.json();
};

export const deleteOperationType = async (id) => {
  const res = await fetch(`${API_URL}/operation-type/delete/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Error al eliminar tipo de operación');
  return await res.json();
};

export const exportOperationTypes = async ({ query = {} } = {}) => {
  const res = await fetch(`${API_URL}/operation-type/export`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ query })
  });
  if (!res.ok) throw new Error('Error al exportar tipos de operación');
  const data = await res.json();
  return data.data;
};
