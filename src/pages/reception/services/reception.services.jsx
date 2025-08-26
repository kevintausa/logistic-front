const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const handleResponse = async (response) => {
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Ocurrió un error en la solicitud.');
  }
  return response.json();
};

export const fetchReceptions = async ({ limit, page, query }) => {
  const response = await fetch(`${API_URL}/reception/filter`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ limit, page, query }),
  });
  return handleResponse(response);
};

export const createReception = async (data) => {
  const response = await fetch(`${API_URL}/reception/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return handleResponse(response);
};

export const updateReception = async (id, data) => {
  const response = await fetch(`${API_URL}/reception/update/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return handleResponse(response);
};

export const deleteReception = async (id) => {
  const response = await fetch(`${API_URL}/reception/delete/${id}`, {
    method: 'DELETE',
  });
  return handleResponse(response);
};

export const exportReceptions = async (query = {}) => {
    const response = await fetch(`${API_URL}/reception/export`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
    });
    const result = await handleResponse(response);
    return result.data; // Asumiendo que la API devuelve { data: [...] }
};

// Nuevo servicio para obtener el total de kilos según los filtros aplicados
export const getTotalKilos = async (query = {}) => {
    const response = await fetch(`${API_URL}/reception/totalKilos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
    });
    return handleResponse(response);
};

// Servicio para finalizar el lavado con registro de kilos limpios y rechazos
export const finalizarLavado = async (id, data) => {
    const response = await fetch(`${API_URL}/reception/finalizar/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    return handleResponse(response);
};

// =====================
// Reportes de Recepciones
// =====================

// Totales consolidados (POST)
// Esperado que el backend retorne un objeto con acumulados, por ejemplo:
// { kilosProcesados, kilosRechazo, kilosLimpios, pendientes, conteo }
export const getReceptionReportTotals = async ({ query = {} } = {}) => {
  const response = await fetch(`${API_URL}/reception/reports/totals`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query }),
  });
  return handleResponse(response);
};

// Series diarias/semanales/mensuales (POST)
// groupBy: 'day' | 'week' | 'month'
// Se espera que el backend agrupe por fecha (createdAt o fechaFinalizacion)
// y retorne items como: [{ date: '2025-07-21', pesoKg, kilosLimpios, rechazoKg, count }]
export const getReceptionDaily = async ({ query = {}, groupBy = 'day' } = {}) => {
  const response = await fetch(`${API_URL}/reception/reports/daily`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, groupBy }),
  });
  return handleResponse(response);
};
