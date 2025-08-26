import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return token ? { headers: { Authorization: `Bearer ${token}` } } : {};
};

export const getWeeklyOverview = async (payload) => {
  try {
    const response = await axios.post(
      `${API_URL}/shifts/weekly-overview`,
      payload,
      getAuthHeaders()
    );
    return response.data;
  } catch (error) {
    console.error('Error obteniendo vista general semanal:', error.response?.data || error.message);
    throw error.response?.data || error;
  }
};

export const getEmployeeWeeklyOverview = async (params) => {
  const { weekStart, weekEnd, lavanderiaId, employeeId, cedula, nombre } = params || {};
  const qp = new URLSearchParams();
  if (weekStart) qp.set('weekStart', weekStart);
  if (weekEnd) qp.set('weekEnd', weekEnd);
  if (lavanderiaId) qp.set('lavanderiaId', lavanderiaId);
  if (employeeId) qp.set('employeeId', employeeId);
  if (cedula) qp.set('cedula', cedula);
  if (nombre) qp.set('nombre', nombre);
  try {
    const response = await axios.get(
      `${API_URL}/shifts/employee-weekly-overview?${qp.toString()}`,
      getAuthHeaders()
    );
    return response.data;
  } catch (error) {
    console.error('Error obteniendo vista semanal de empleado:', error.response?.data || error.message);
    throw error.response?.data || error;
  }
};

export const sendSummaryEmail = async ({ empleado, lavanderia, dias }) => {
  try {
    const response = await axios.post(
      `${API_URL}/shifts/send-summary-email`,
      { empleado, lavanderia, dias },
      getAuthHeaders()
    );
    return response.data;
  } catch (error) {
    console.error('Error enviando resumen por correo:', error.response?.data || error.message);
    throw error.response?.data || error;
  }
};
