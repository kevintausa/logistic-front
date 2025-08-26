const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const fetchOperators = async ({ limit, offset, query }) => { 
  try {
      const response = await fetch(`${API_URL}/operator/filter`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ limit, offset, query }),
      });

      if (!response.ok) {
        throw new Error('Error al obtener los operadores');
      }
  
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error al obtener los operadores:', error);
      throw error;
    }
  };

export const createOperator = async (payload) => {
  try {
    const response = await fetch(`${API_URL}/operator/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!response.ok) throw new Error('Error al crear el operador');
    return await response.json();
  } catch (error) {
    console.error('Error al crear operador:', error);
    throw error;
  }
};

export const updateOperator = async (id, payload) => {
  try {
    const response = await fetch(`${API_URL}/operator/update/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!response.ok) throw new Error('Error al actualizar el operador');
    return await response.json();
  } catch (error) {
    console.error('Error al actualizar operador:', error);
    throw error;
  }
};

export const deleteOperator = async (id) => {
  try {
    const response = await fetch(`${API_URL}/operator/delete/${id}`, { method: 'DELETE' });
    if (!response.ok) throw new Error('Error al eliminar el operador');
    return await response.json();
  } catch (error) {
    console.error('Error al eliminar operador:', error);
    throw error;
  }
};

export const exportOperators = async ({ query = {} } = {}) => {
  try {
    const response = await fetch(`${API_URL}/operator/export`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query }),
    });
    if (!response.ok) throw new Error('Error al exportar operadores');
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Error al exportar operadores:', error);
    throw error;
  }
};
