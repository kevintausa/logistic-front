import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return token ? { headers: { Authorization: `Bearer ${token}` } } : {};
};

// --- Servicios para Tipos de Prenda ---

export const createGarmentType = async (data) => {
  try {
    const response = await axios.post(`${API_URL}/garment-type/create`, data, getAuthHeaders());
    return response.data;
  } catch (error) {
    console.error('Error creating garment type:', error.response?.data || error.message);
    throw error.response?.data || error;
  }
};

export const getGarmentTypes = async (filters) => {
  try {
    const { page, limit, query } = filters;
    const response = await axios.get(`${API_URL}/garment-type`, {
      ...getAuthHeaders(),
      params: { page, limit, ...query },
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching garment types:', error.response?.data || error.message);
    throw error.response?.data || error;
  }
};

export const updateGarmentType = async (id, data) => {
  try {
    const response = await axios.put(`${API_URL}/garment-type/update/${id}`, data, getAuthHeaders());
    return response.data;
  } catch (error) {
    console.error('Error updating garment type:', error.response?.data || error.message);
    throw error.response?.data || error;
  }
};

export const deleteGarmentType = async (id) => {
  try {
    const response = await axios.delete(`${API_URL}/garment-type/delete/${id}`, getAuthHeaders());
    return response.data;
  } catch (error) {
    console.error('Error deleting garment type:', error.response?.data || error.message);
    throw error.response?.data || error;
  }
};

export const exportGarmentTypes = async (filters) => {
  try {
    const response = await axios.post(`${API_URL}/garment-type/export`, filters, {
      ...getAuthHeaders(),
      responseType: 'blob',
    });
    return response.data;
  } catch (error) {
    console.error('Error exporting garment types:', error.response?.data || error.message);
    throw error.response?.data || error;
  }
};

export const getGarmentTypesByLaundryId = async ({limit, offset, query}) => {

  try {
    const response = await fetch(`${API_URL}/garment-type/getByLaundryId`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query }),
      });
    
    if (!response.ok) {
      throw new Error('Error fetching garment types by laundry id');
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching garment types by laundry id:', error.response?.data || error.message);
    throw error.response?.data || error;
  }
};
