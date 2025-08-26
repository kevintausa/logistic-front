import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return token ? { headers: { Authorization: `Bearer ${token}` } } : {};
};

const handleResponse = async (response) => {
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Ocurrió un error en la solicitud.');
  }
  return response.json();
};

export const getEmployeesForClockIn = async (idLavanderia) => {
  try {
    const response = await axios.post(`${API_URL}/employee/filter`, {
      limit: 100,
      offset: 1,
      query: {
        "lavanderia.id": idLavanderia,
        rol: 'Auxiliar lavanderia',
        estado: "Activo", 
      },
    }, getAuthHeaders());

    if (response.data && response.data.data) {
      return response.data.data;
    }
    return [];
  } catch (error) {
    console.error('Error fetching employees for clock in:', error.response?.data || error.message);
    throw error.response?.data || error;
  }
};

export const saveClockInRecord = async (record) => {
  try {
    const response = await axios.post(`${API_URL}/worked-hours/clock-in`, record, getAuthHeaders());
    return response.data;
  } catch (error) {
    console.error('Error saving clock-in record:', error.response?.data || error.message);
    throw error.response?.data || error;
  }
};

export const getWorkedHours = async (laundryId, page = 1, limit = 10, filters = {}) => {
  try {
    const params = new URLSearchParams({
      page,
      limit,
    });

    if (filters.nombre) {
      params.append('nombre', filters.nombre);
    }

    const response = await axios.get(`${API_URL}/worked-hours/${laundryId}`, {
      ...getAuthHeaders(),
      params,
    });
    return response.data; // Devuelve el objeto completo: { data, total, page, ... }
  } catch (error) {
    console.error('Error fetching worked hours:', error.response?.data || error.message);
    throw error.response?.data || error;
  }
};

export const clockOut = async (recordId, payload) => {
  try {
    const response = await axios.patch(`${API_URL}/worked-hours/clock-out/${recordId}`, payload, getAuthHeaders());
    return response.data;
  } catch (error) {
    console.error('Error clocking out:', error.response?.data || error.message);
    throw error.response?.data || error;
  }
};

export const exportWorkedHours = async (payload) => {
  try {
    const response = await fetch(`${API_URL}/worked-hours/export`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders().headers,
      },
      body: JSON.stringify(payload),
    });
    const result = await handleResponse(response);
    return result; 
  } catch (error) {
    console.error('Error exporting worked hours:', error.response?.data || error.message);
    throw error.response?.data || error;
  }
};

export const updateWorkedHours = async (recordId, payload) => {
  try {
   const response = await fetch(`${API_URL}/worked-hours/update`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({recordId, payload}),
   });
   return response.json();

  } catch (error) {
    console.error('Error updating worked hours:', error.response?.data || error.message);
    throw error.response?.data || error;
  }
};

export const fetchWorkedHours = async ({limit, page, query}) => {
 const response = await fetch(`${API_URL}/worked-hours/filter`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ limit, page, query }),
  });
  return handleResponse(response);
};

export const getWorkedHoursSummary = async (query) => {
  const response = await fetch(`${API_URL}/worked-hours/summary`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders().headers,
    },
    body: JSON.stringify({ query }),
  });
  return handleResponse(response);
};

// Serie diaria/ mensual de horas trabajadas y autorizadas
export const getWorkedHoursDailyReport = async ({ query, groupBy = 'day' }) => {
  const response = await fetch(`${API_URL}/worked-hours/reports/daily`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders().headers,
    },
    body: JSON.stringify({ query, groupBy }),
  });
  return handleResponse(response);
};

export const getEmployeeByCedula = async (cedula) => {
  const response = await fetch(`${API_URL}/employee/by-cedula/${cedula}`, {
    method: 'GET',
    headers: getAuthHeaders().headers,
  });
  return handleResponse(response);
};

export const getAllEmployees = async () => {
  try {
    const response = await fetch(`${API_URL}/employee/filter`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders().headers,
      },
      body: JSON.stringify({
        limit: 100,
        offset: 1,
        query: {
          rol: 'Auxiliar lavanderia',
          estado: 'Activo',
        },
      }),
    });
    if (!response.ok) {
      throw new Error('Error al obtener la lista de empleados');
    }
    const data = await response.json();
    return data.data; // Asumimos que la lista está en la propiedad 'data'
  } catch (error) {
    console.error('Error en getAllEmployees:', error);
    throw error;
  }
};