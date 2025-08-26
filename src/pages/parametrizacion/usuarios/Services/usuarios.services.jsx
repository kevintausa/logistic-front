const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const fetchUsers = async ({ limit, offset, query }) => {
    try {
      const response = await fetch(`${API_URL}/user/filter`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ limit, offset, query }),
      });
  
      if (!response.ok) {
        throw new Error('Error al obtener los usuarios');
      }
  
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error al obtener los usuarios:', error);
      throw error;
    }
  };
    
export const createUser = async (userData) => {
    try {
      const response = await fetch(`${API_URL}/user/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });
  
      if (!response.ok) {
        throw new Error('Error al crear el usuario');
      }
  
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error al crear el usuario:', error);
      throw error;
    }
  };
        
export const updateUser = async (userId, userData) => {
    try {
      const response = await fetch(`${API_URL}/user/update/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });
  
      if (!response.ok) {
        throw new Error('Error al actualizar el usuario');
      }
  
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error al actualizar el usuario:', error);
      throw error;
    }
  };
    
export const deleteUser = async (userId) => {
    try {
      const response = await fetch(`${API_URL}/user/delete/${userId}`, {
        method: 'DELETE',
      });
  
      if (!response.ok) {
        throw new Error('Error al eliminar el usuario');
      }
  
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error al eliminar el usuario:', error);
      throw error;
    }
  };
  
export const exportUsers = async ({ query }) => {
    try {
      const response = await fetch(`${API_URL}/user/export`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query }),
      });
  
      if (!response.ok) {
        throw new Error('Error al exportar los usuarios');
      }
  
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error al exportar los usuarios:', error);
      throw error;
    }
  };
    
    