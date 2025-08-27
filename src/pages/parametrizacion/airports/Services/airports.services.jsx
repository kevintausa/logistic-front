const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const fetchAirports = async ({ limit, offset, query }) => {
  const res = await fetch(`${API_URL}/airport/filter`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ limit, offset, query })
  });
  if (!res.ok) throw new Error('Error al obtener aeropuertos');
  return await res.json();
};

export const createAirport = async (payload) => {
  const res = await fetch(`${API_URL}/airport/create`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error('Error al crear aeropuerto');
  return await res.json();
};

export const updateAirport = async (id, payload) => {
  const res = await fetch(`${API_URL}/airport/update/${id}`, {
    method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error('Error al actualizar aeropuerto');
  return await res.json();
};

export const deleteAirport = async (id) => {
  const res = await fetch(`${API_URL}/airport/delete/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Error al eliminar aeropuerto');
  return await res.json();
};

export const exportAirports = async ({ query = {} } = {}) => {
  const res = await fetch(`${API_URL}/airport/export`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ query })
  });
  if (!res.ok) throw new Error('Error al exportar aeropuertos');
  const data = await res.json();
  return data.data;
};
