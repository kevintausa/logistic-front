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

export const getAirOperations = async ({ limit = 10, offset = 1, query = {} } = {}) => {
  try {
    // Backend expects 0-based page index for offset in skip(offset * limit)
    const pageIndex = Math.max(0, Number(offset || 1) - 1);

    const params = new URLSearchParams();
    params.set('limit', String(limit));
    params.set('offset', String(pageIndex));

    // Map known filters to simple query params when possible
    const { estado, tipo, asesorId, clienteId, search } = query || {};
    if (estado && typeof estado === 'string') params.set('estado', estado);
    if (tipo && typeof tipo === 'string') params.set('tipo', tipo);
    if (asesorId && typeof asesorId === 'string') params.set('asesorId', asesorId);
    if (clienteId && typeof clienteId === 'string') params.set('clienteId', clienteId);
    if (search && typeof search === 'string') params.set('search', search);

    const response = await fetch(`${API_BASE_URL}/air-operations?${params.toString()}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Error al obtener las operaciones aéreas');
    }

    const json = await response.json();
    // Controller returns: { success, message, data: { items, total } }
    const items = json?.data?.items || [];
    const total = json?.data?.total || 0;

    // Normalize rows a bit for current table/exports
    const normalized = items.map((row) => ({
      ...row,
      clienteNombre: row?.cliente?.nombre,
      asesorNombre: row?.asesor?.nombre,
      puertoCargaNombre: row?.puertoCarga?.nombre,
      puertoDescargaNombre: row?.puertoDescarga?.nombre,
    }));

    return { data: normalized, totalRecords: total };
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

// Export helper similar to exportOperations but for air operations
export const exportAirOperations = async ({ query = {} } = {}) => {
  // Fetch a large page to export (adjust as needed or implement server-side export later)
  const { data } = await getAirOperations({ limit: 10000, offset: 1, query });
  // Flatten to match columnsExcel keys currently used in UI
  return (data || []).map((row) => ({
    ...row,
    clienteNombre: row?.cliente?.nombre || row?.clienteNombre,
    puertoCargaNombre: row?.puertoCarga?.nombre || row?.puertoCargaNombre,
    puertoDescargaNombre: row?.puertoDescarga?.nombre || row?.puertoDescargaNombre,
    // Air operations do not have tipoOperacion; leave empty for now
    tipoOperacionNombre: row?.tipo || '',
  }));
};
