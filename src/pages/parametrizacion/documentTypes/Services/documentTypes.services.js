const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const BASE_URL = `${API_URL}/document-types`;

export const fetchDocumentTypes = async ({ limit = 10, offset = 1, query = {} }) => {
  try {
    const url = new URL(BASE_URL);
    url.searchParams.append('limit', limit);
    url.searchParams.append('offset', offset);
    if (Object.keys(query).length > 0) {
      url.searchParams.append('query', JSON.stringify(query));
    }
    const response = await fetch(url.toString());
    if (!response.ok) throw new Error('Error al obtener los tipos de archivo');
    return await response.json();
  } catch (error) {
    console.error('Error fetching document types:', error);
    throw error;
  }
};

export const createDocumentType = async (data) => {
  try {
    const response = await fetch(BASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Error al crear el tipo de archivo');
    return await response.json();
  } catch (error) {
    console.error('Error creating document type:', error);
    throw error;
  }
};

export const updateDocumentType = async (id, data) => {
  try {
    const response = await fetch(`${BASE_URL}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Error al actualizar el tipo de archivo');
    return await response.json();
  } catch (error) {
    console.error('Error updating document type:', error);
    throw error;
  }
};

export const deleteDocumentType = async (id) => {
  try {
    const response = await fetch(`${BASE_URL}/${id}`, { method: 'DELETE' });
    if (!response.ok) throw new Error('Error al eliminar el tipo de archivo');
    return await response.json();
  } catch (error) {
    console.error('Error deleting document type:', error);
    throw error;
  }
};

export const exportDocumentTypes = async (query = {}) => {
  try {
    const url = new URL(`${BASE_URL}/export`);
    if (Object.keys(query).length > 0) {
      url.searchParams.append('query', JSON.stringify(query));
    }
    const response = await fetch(url.toString());
    if (!response.ok) throw new Error('Error al exportar los tipos de archivo');
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Error exporting document types:', error);
    throw error;
  }
};

// Helper para obtener opciones activas, opcionalmente filtradas por destino
export const getActiveDocumentTypeOptions = async ({ appliesTo } = {}) => {
  const { data = [] } = await fetchDocumentTypes({ limit: 100, offset: 1, query: { estado: 'Activo' } });
  let list = data;
  if (appliesTo) {
    list = list.filter(dt => (dt.aplicaA === 'ambos') || (dt.aplicaA === appliesTo));
  }
  return list.map(dt => ({ value: dt._id, label: dt.nombre }));
};
