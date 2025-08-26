// Definimos la URL base según la variable de entorno, con fallback a localhost
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const fetchWashingCycles = async ({ limit, page, query }) => {
  try {
    const response = await fetch(`${API_URL}/washing-cycles/filter`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ limit, page, query }),
    });

    if (!response.ok) {
      throw new Error('Error al obtener los ciclos de lavado');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error al obtener los ciclos de lavado:', error);
    throw error;
  }
};

// Reportes: totales de ciclos de lavado
export const getWashingCycleReportTotals = async ({ query = {} }) => {
  try {
    console.log(query);
    // cambiar createdAt por fecha
    if (query?.createdAt) {
      query.fecha = query.createdAt;
      delete query.createdAt;
    }
    const response = await fetch(`${API_URL}/washing-cycles/reports/totals`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query }),
    });
    if (!response.ok) {
      throw new Error('Error al obtener totales de ciclos de lavado');
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error al obtener totales de ciclos de lavado:', error);
    throw error;
  }
};

// Reportes: series temporales (día/semana/mes) de kilos lavados y conteo
export const getWashingCycleDaily = async ({ query = {}, groupBy = 'day' }) => {
  try {
    const response = await fetch(`${API_URL}/washing-cycles/reports/daily`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, groupBy }),
    });
    if (!response.ok) {
      throw new Error('Error al obtener serie diaria de ciclos de lavado');
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error al obtener serie diaria de ciclos de lavado:', error);
    throw error;
  }
};

export const createWashingCycle = async (cycleData) => {
  try {
    const response = await fetch(`${API_URL}/washing-cycles/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(cycleData),
    });

    if (!response.ok) {
      throw new Error('Error al crear el registro de ciclo de lavado');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error al crear el registro de ciclo de lavado:', error);
    throw error;
  }
};

export const updateWashingCycle = async (cycleId, cycleData) => {
  try {
    const response = await fetch(`${API_URL}/washing-cycles/update`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ id: cycleId, data: cycleData }),
    });

    if (!response.ok) {
      throw new Error('Error al actualizar el registro de ciclo de lavado');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error al actualizar el registro de ciclo de lavado:', error);
    throw error;
  }
};

export const deleteWashingCycle = async (cycleId) => {
  try {
    const response = await fetch(`${API_URL}/washing-cycles/delete/${cycleId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error('Error al eliminar el registro de ciclo de lavado');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error al eliminar el registro de ciclo de lavado:', error);
    throw error;
  }
};

export const exportWashingCycles = async (query = {}) => {
  try {
    const qs = encodeURIComponent(JSON.stringify(query || {}));
    const response = await fetch(`${API_URL}/washing-cycles/export?query=${qs}`, {
      method: 'GET',
    });

    if (!response.ok) {
      throw new Error('Error al exportar los ciclos de lavado');
    }

    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Error al exportar los ciclos de lavado:', error);
    throw error;
  }
};

export const getTotalWashedKilos = async (idLavanderia, dateRange) => {
  try {
    const response = await fetch(`${API_URL}/washing-cycles/total-kilos`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        idLavanderia, 
        startDate: dateRange?.$gte,
        endDate: dateRange?.$lte
      }),
    });

    if (!response.ok) {
      throw new Error('Error al obtener los kilos lavados');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error al obtener los kilos lavados:', error);
    throw error;
  }
};
