const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const getPublicStatuses = async (numtrazabilidad, nit) => {
  const url = `${API_URL}/statuses/public?numtrazabilidad=${encodeURIComponent(numtrazabilidad)}&nit=${encodeURIComponent(nit)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Error al consultar trazabilidad');
  return await res.json();
};
