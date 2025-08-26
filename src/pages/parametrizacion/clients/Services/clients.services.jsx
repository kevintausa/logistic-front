const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const fetchClients = async ({ limit, offset, query }) => { 
  try {
      const response = await fetch(`${API_URL}/client/filter`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ limit, offset, query }),
      });

      if (!response.ok) {
        throw new Error('Error al obtener los clientes');
      }
  
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error al obtener los clientes:', error);
      throw error;
    }
  };

  export const createClient = async (clientData) => {
    try {
      const response = await fetch(`${API_URL}/client/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(clientData),
      });
  
      if (!response.ok) {
        throw new Error('Error al crear el cliente');
      }
  
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error al crear el cliente:', error);
      throw error;
    }
  };

  export const updateClient = async (clientId, clientData) => {
    try {
      const response = await fetch(`${API_URL}/client/update/${clientId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(clientData),
      });
  
      if (!response.ok) {
        throw new Error('Error al actualizar el cliente');
      }
  
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error al actualizar el cliente:', error);
      throw error;
    }
  };

  export const deleteClient = async (clientId) => {
    try {
      const response = await fetch(`${API_URL}/client/delete/${clientId}`, {
        method: 'DELETE',
      });
  
      if (!response.ok) {
        throw new Error('Error al eliminar el cliente');
      }
  
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error al eliminar el cliente:', error);
      throw error;
    }
  };

  export const exportClients = async (query = {}) => {
    try {
      const response = await fetch(`${API_URL}/client/export`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query }),
      });
  
      if (!response.ok) {
        throw new Error('Error al exportar los clientes');
      }
  
      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error al exportar los clientes:', error);
      throw error;
    }
  };

  export const fetchDailyClientStats = async () => {
    try {
      const response = await fetch(`${API_URL}/reception/stats/daily-weight-by-client`);
      if (!response.ok) {
        throw new Error('Error al obtener las estadísticas diarias de clientes');
      }
      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error al obtener estadísticas de clientes:', error);
      throw error;
    }
  };

  export const getClientByLaundryId = async ({ limit, offset, query }) => {
    try {

      const response = await fetch(`${API_URL}/client/getByLaundryId`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ query }),
        }
      );
  
      if (!response.ok) {
        throw new Error('Error al obtener los clientes');
      }
  
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error al obtener los clientes:', error);
      throw error;
    }
  };
