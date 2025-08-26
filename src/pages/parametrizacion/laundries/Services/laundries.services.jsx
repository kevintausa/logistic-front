const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const fetchLaundries = async ({ limit, offset, query }) => {
    try {
      const response = await fetch(`${API_URL}/laundry/filter`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ limit, offset, query }),
      });
  
      if (!response.ok) {
        throw new Error('Error al obtener las lavanderías');
      }
  
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error al obtener las lavanderías:', error);
      throw error;
    }
  };

  export const createLaundry = async (laundryData) => {
    try {
      const response = await fetch(`${API_URL}/laundry/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(laundryData),
      });
  
      if (!response.ok) {
        throw new Error('Error al crear la lavandería');
      }
  
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error al crear la lavandería:', error);
      throw error;
    }
  };

  export const updateLaundry = async ( laundryId, laundryData) => {
    try {
      const response = await fetch(`${API_URL}/laundry/update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: laundryId, data:laundryData }),
      });
  
      if (!response.ok) {
        throw new Error('Error al actualizar la lavandería');
      }
  
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error al actualizar la lavandería:', error);
      throw error;
    }
  };

  export const deleteLaundry = async (laundryId) => {
    try {
      const response = await fetch(`${API_URL}/laundry/delete/${laundryId}`, {
        method: 'DELETE',
      });
  
      if (!response.ok) {
        throw new Error('Error al eliminar la lavandería');
      }
  
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error al eliminar la lavandería:', error);
      throw error;
    }
  };

  export const exportLaundries = async (query = {}) => {
    try {
      const response = await fetch(`${API_URL}/laundry/export`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query }),
      });
  
      if (!response.ok) {
        throw new Error('Error al exportar las lavanderías');
      }
  
      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error al exportar las lavanderías:', error);
      throw error;
    }
  };

export const fetchLaundryById = async (laundryId) => {
  try {
    // Primero usamos el endpoint filter existente con una query específica por ID
    const response = await fetch(`${API_URL}/laundry/filter`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        query: { _id: laundryId } 
      }),
    });

    if (!response.ok) {
      throw new Error('Error al obtener la lavandería');
    }

    const data = await response.json();
    
    // Si encontramos resultados, devolvemos el primero
    if (data && data.data && data.data.length > 0) {
      return data.data[0];
    }
    
    throw new Error('Lavandería no encontrada');
  } catch (error) {
    console.error('Error al obtener la lavandería por ID:', error);
    throw error;
  }
};
