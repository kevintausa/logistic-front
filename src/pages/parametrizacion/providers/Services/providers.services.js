const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const PROVIDERS_API_URL = `${API_URL}/providers`;

export const fetchProviders = async ({ limit = 10, offset = 1, query = {} }) => {
  try {
    const url = new URL(PROVIDERS_API_URL);
    url.searchParams.append('limit', limit);
    url.searchParams.append('offset', offset);
    if (Object.keys(query).length > 0) {
      url.searchParams.append('query', JSON.stringify(query));
    }
    const response = await fetch(url.toString());
    if (!response.ok) throw new Error('Error al obtener los proveedores');
    return await response.json();
  } catch (error) {
    console.error('Error fetching providers:', error);
    throw error;
  }
};

export const createProvider = async (data) => {
  try {
    const response = await fetch(PROVIDERS_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Error al crear el proveedor');
    return await response.json();
  } catch (error) {
    console.error('Error creating provider:', error);
    throw error;
  }
};

export const updateProvider = async (id, data) => {
  try {
    const response = await fetch(`${PROVIDERS_API_URL}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Error al actualizar el proveedor');
    return await response.json();
  } catch (error) {
    console.error('Error updating provider:', error);
    throw error;
  }
};

export const deleteProvider = async (id) => {
  try {
    const response = await fetch(`${PROVIDERS_API_URL}/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Error al eliminar el proveedor');
    return await response.json();
  } catch (error) {
    console.error('Error deleting provider:', error);
    throw error;
  }
};

export const exportProviders = async (query = {}) => {
  try {
    const url = new URL(`${PROVIDERS_API_URL}/export`);
    if (Object.keys(query).length > 0) {
      url.searchParams.append('query', JSON.stringify(query));
    }
    const response = await fetch(url.toString());
    if (!response.ok) throw new Error('Error al exportar los proveedores');
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Error exporting providers:', error);
    throw error;
  }
};
