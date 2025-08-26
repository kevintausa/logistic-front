const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const fetchServices = async ({ limit, offset, query }) => { 
  try {
    const response = await fetch(`${API_URL}/service/filter`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ limit, offset, query }),
    });

    if (!response.ok) {
      throw new Error('Error al obtener los servicios');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching services:', error);
    throw error;
  }
};

export const createService = async (serviceData) => {
  try {
    const response = await fetch(`${API_URL}/service/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(serviceData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Error al crear el servicio');
    }

    return await response.json();
  } catch (error) {
    console.error('Error creating service:', error);
    throw error;
  }
};

export const updateService = async (id, serviceData) => {
  try {
    const response = await fetch(`${API_URL}/service/update`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id: id,
        data: serviceData
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Error al actualizar el servicio');
    }

    return await response.json();
  } catch (error) {
    console.error('Error updating service:', error);
    throw error;
  }
};

export const deleteService = async (id) => {
  try {
    const response = await fetch(`${API_URL}/service/delete/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Error al eliminar el servicio');
    }

    return await response.json();
  } catch (error) {
    console.error('Error deleting service:', error);
    throw error;
  }
};

export const exportServices = async (filters = {}) => {
  try {
    const response = await fetch(`${API_URL}/service/export`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query: filters }),
    });

    if (!response.ok) {
      throw new Error('Error al exportar los servicios');
    }

    return await response.json();
  } catch (error) {
    console.error('Error exporting services:', error);
    throw error;
  }
};
