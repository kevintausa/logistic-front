const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const fetchUsers = async ({ limit = 10, offset = 1, query = {} }) => {
  const res = await fetch(`${API_URL}/user/filter`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ limit, offset, query })
  });
  if (!res.ok) throw new Error('Error al obtener usuarios');
  return res.json();
};

export const createUser = async (userData) => {
  const res = await fetch(`${API_URL}/user/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userData)
  });
  let data;
  try { data = await res.json(); } catch {}
  if (!res.ok) {
    const msg = Array.isArray(data?.message)
      ? data.message.join('\n')
      : data?.message || data?.error || 'Error al crear usuario';
    throw new Error(msg);
  }
  return data;
};

export const updateUser = async (id, data) => {
  const res = await fetch(`${API_URL}/user/update`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, data })
  });
  let json;
  try { json = await res.json(); } catch {}
  if (!res.ok) {
    const msg = Array.isArray(json?.message)
      ? json.message.join('\n')
      : json?.message || json?.error || 'Error al actualizar usuario';
    throw new Error(msg);
  }
  return json;
};

export const deleteUser = async (id) => {
  const res = await fetch(`${API_URL}/user/delete/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Error al eliminar usuario');
  return res.json();
};

export const exportUsers = async (query = {}) => {
  const res = await fetch(`${API_URL}/user/export`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query })
  });
  let data;
  try { data = await res.json(); } catch {}
  if (!res.ok) {
    const msg = Array.isArray(data?.message)
      ? data.message.join('\n')
      : data?.message || data?.error || 'Error al exportar usuarios';
    throw new Error(msg);
  }
  return data.data;
};
