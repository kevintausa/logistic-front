// Definimos la URL base según la variable de entorno, con fallback a localhost
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const fetchUtilityServices = async ({ limit, offset, query, page }) => {
  try {
    const response = await fetch(`${API_URL}/utility-services/filter`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ limit, offset, query, page }),
    });

    if (!response.ok) {
      throw new Error('Error al obtener los registros de servicios públicos');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error al obtener los registros de servicios públicos:', error);
    throw error;
  }
};

export const createUtilityService = async (serviceData) => {
  try {
    const response = await fetch(`${API_URL}/utility-services/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(serviceData),
    });

    if (!response.ok) {
      throw new Error('Error al crear el registro de servicio público');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error al crear el registro de servicio público:', error);
    throw error;
  }
};

export const updateUtilityService = async (serviceId, serviceData) => {
  try {
    const response = await fetch(`${API_URL}/utility-services/update`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ id: serviceId, data: serviceData }),
    });

    if (!response.ok) {
      throw new Error('Error al actualizar el registro de servicio público');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error al actualizar el registro de servicio público:', error);
    throw error;
  }
};

export const deleteUtilityService = async (serviceId) => {
  try {
    const response = await fetch(`${API_URL}/utility-services/delete/${serviceId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error('Error al eliminar el registro de servicio público');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error al eliminar el registro de servicio público:', error);
    throw error;
  }
};

export const exportUtilityServices = async (query = {}) => {
  try {
    const response = await fetch(`${API_URL}/utility-services/export`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query }),
    });

    if (!response.ok) {
      throw new Error('Error al exportar los registros de servicios públicos');
    }

    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Error al exportar los registros de servicios públicos:', error);
    throw error;
  }
};

export const fetchServicesByLaundry = async (idLavanderia) => {
  try {
    const response = await fetch(`${API_URL}/service/filter`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query: { 
       "lavanderia.id": idLavanderia 
      } }),
    });
    if (!response.ok) {
      throw new Error('Error al obtener los servicios de la lavandería');
    }
    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.error('Error en fetchServicesByLaundry:', error);
    throw error;
  }
};
