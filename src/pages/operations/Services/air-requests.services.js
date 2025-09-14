import { API_BASE_URL } from '../../../config/api';

export const createAirRequest = async (data) => {
  try {
    const response = await fetch(`${API_BASE_URL}/air-operations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Error al crear la operación aérea');
    }

    return await response.json();
  } catch (error) {
    console.error('Error creating air operation:', error);
    throw error;
  }
};

export const getAirOperations = async (params = {}) => {
  try {
    const queryParams = new URLSearchParams(params).toString();
    const response = await fetch(`${API_BASE_URL}/air-operations?${queryParams}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Error al obtener las operaciones aéreas');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching air operations:', error);
    throw error;
  }
};

export const getAirOperationById = async (id) => {
  try {
    const response = await fetch(`${API_BASE_URL}/air-operations/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Error al obtener la operación aérea');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching air operation:', error);
    throw error;
  }
};

export const updateAirOperation = async (id, data) => {
  try {
    const response = await fetch(`${API_BASE_URL}/air-operations/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Error al actualizar la operación aérea');
    }

    return await response.json();
  } catch (error) {
    console.error('Error updating air operation:', error);
    throw error;
  }
};

export const updateAirOperationStatus = async (id, estado) => {
  try {
    const response = await fetch(`${API_BASE_URL}/air-operations/${id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ estado }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Error al actualizar el estado');
    }

    return await response.json();
  } catch (error) {
    console.error('Error updating air operation status:', error);
    throw error;
  }
};

export const deleteAirOperation = async (id) => {
  try {
    const response = await fetch(`${API_BASE_URL}/air-operations/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Error al eliminar la operación aérea');
    }

    return await response.json();
  } catch (error) {
    console.error('Error deleting air operation:', error);
    throw error;
  }
};

export const getAirOperationStats = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/air-operations/stats`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Error al obtener las estadísticas');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching air operation stats:', error);
    throw error;
  }
};
