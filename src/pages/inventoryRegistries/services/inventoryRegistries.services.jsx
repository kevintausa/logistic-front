// Definimos la URL base según la variable de entorno, con fallback a localhost
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const fetchInventoryRegistries = async ({ limit, offset, query }) => {
  try {
    const response = await fetch(`${API_URL}/inventory-registries/filter`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ limit, offset, query }),
    });

    if (!response.ok) {
      throw new Error('Error al obtener los registros de inventario');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error al obtener los registros de inventario:', error);
    throw error;
  }
};

export const getTotalsUsedByProduct = async ({ lavanderiaId, from, to } = {}) => {
  try {
    const params = new URLSearchParams();
    if (lavanderiaId) params.append('lavanderiaId', lavanderiaId);
    if (from) params.append('from', new Date(from).toISOString());
    if (to) params.append('to', new Date(to).toISOString());
    const qs = params.toString();
    const response = await fetch(`${API_URL}/inventory-registries/totals-used${qs ? `?${qs}` : ''}`);
    if (!response.ok) {
      throw new Error('Error al obtener totales de cantidad usada');
    }
    const data = await response.json();
    // buildSuccessResponse shape => { data, code, message }
    return data.data || [];
  } catch (error) {
    console.error('Error al obtener totales de cantidad usada:', error);
    throw error;
  }
};

export const createInventoryRegistriesBatch = async (items) => {
  try {
    const response = await fetch(`${API_URL}/inventory-registries/batch`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ items }),
    });

    if (!response.ok) {
      throw new Error('Error al crear los registros de inventario (batch)');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error al crear los registros de inventario (batch):', error);
    throw error;
  }
};

export const createInventoryRegistry = async (registryData) => {
  try {
    const response = await fetch(`${API_URL}/inventory-registries`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(registryData),
    });

    if (!response.ok) {
      throw new Error('Error al crear el registro de inventario');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error al crear el registro de inventario:', error);
    throw error;
  }
};

export const updateInventoryRegistry = async (registryId, registryData) => {
  try {
    const response = await fetch(`${API_URL}/inventory-registries/${registryId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(registryData),
    });

    if (!response.ok) {
      throw new Error('Error al actualizar el registro de inventario');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error al actualizar el registro de inventario:', error);
    throw error;
  }
};

export const deleteInventoryRegistry = async (registryId) => {
  try {
    const response = await fetch(`${API_URL}/inventory-registries/${registryId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error('Error al eliminar el registro de inventario');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error al eliminar el registro de inventario:', error);
    throw error;
  }
};

export const exportInventoryRegistries = async (query = {}) => {
  try {
    const qs = encodeURIComponent(JSON.stringify(query));
    const response = await fetch(`${API_URL}/inventory-registries/export?query=${qs}`, {
      method: 'GET',
    });

    if (!response.ok) {
      throw new Error('Error al exportar los registros de inventario');
    }

    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Error al exportar los registros de inventario:', error);
    throw error;
  }
};
