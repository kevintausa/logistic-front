const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const fetchMachines = async ({ limit, offset, query }) => {
    try {
      const response = await fetch(`${API_URL}/machine/filter`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ limit, offset, query }),
      });
  
      if (!response.ok) {
        throw new Error('Error al obtener las lavadoras');
      }
  
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error al obtener las lavadoras:', error);
      throw error;
    }
  };

  export const createMachine = async (machineData) => {
    try {
      const response = await fetch(`${API_URL}/machine/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(machineData),
      });
  
      if (!response.ok) {
        throw new Error('Error al crear la lavadora');
      }
  
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error al crear la lavadora:', error);
      throw error;
    }
  };

  export const updateMachine = async ( machineId, machineData) => {
    try {
      const response = await fetch(`${API_URL}/machine/update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: machineId, data:machineData }),
      });
  
      if (!response.ok) {
        throw new Error('Error al actualizar la lavadora');
      }
  
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error al actualizar la lavadora:', error);
      throw error;
    }
  };

  export const deleteMachine = async (machineId) => {
    try {
      const response = await fetch(`${API_URL}/machine/delete/${machineId}`, {
        method: 'DELETE',
      });
  
      if (!response.ok) {
        throw new Error('Error al eliminar la lavadora');
      }
  
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error al eliminar la lavadora:', error);
      throw error;
    }
  };

  export const exportMachines = async (query = {}) => {
    try {
      const response = await fetch(`${API_URL}/machine/export`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query }),
      });
  
      if (!response.ok) {
        throw new Error('Error al exportar las lavadoras');
      }
  
      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error al exportar las lavadoras:', error);
      throw error;
    }
  };

  export const getMachines = async (params) => {
    try {
      // Si recibimos un objeto con idLavanderia, extraemos el valor
      // Si recibimos directamente el ID como string, lo usamos
      const idLavanderia = typeof params === 'object' ? params.idLavanderia : params;
      
      const response = await fetch(`${API_URL}/machine/getMachines`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: { idLavanderia } }),
      });
  
      if (!response.ok) {
        throw new Error('Error al obtener las lavadoras');
      }
  
      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error al obtener las lavadoras:', error);
      throw error;
    }
  };
