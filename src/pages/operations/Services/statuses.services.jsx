const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const createStatus = async (payload) => {
  const res = await fetch(`${API_URL}/statuses/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Error al crear estatus');
  return await res.json();
};
