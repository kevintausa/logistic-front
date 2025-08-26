// Definimos la URL base según la variable de entorno, con fallback a localhost
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const fetchEmployees = async ({ limit, offset, query }) => {
    try {
      const response = await fetch(`${API_URL}/employee/filter`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ limit, offset, query }),
      });
  
      if (!response.ok) {
        throw new Error('Error al obtener los empleados');
      }
  
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error al obtener los empleados:', error);
      throw error;
    }
  };

  export const createEmployee = async (employeeData) => {
    try {
      const response = await fetch(`${API_URL}/employee/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(employeeData),
      });
  
      if (!response.ok) {
        throw new Error('Error al crear el empleado');
      }
  
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error al crear el empleado:', error);
      throw error;
    }
  };

  export const updateEmployee = async ( employeeId, employeeData) => {
    try {
      const response = await fetch(`${API_URL}/employee/update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: employeeId, data:employeeData }),
      });
  
      if (!response.ok) {
        throw new Error('Error al actualizar el empleado');
      }
  
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error al actualizar el empleado:', error);
      throw error;
    }
  };

  export const deleteEmployee = async (employeeId) => {
    try {
      const response = await fetch(`${API_URL}/employee/delete/${employeeId}`, {
        method: 'DELETE',
      });
  
      if (!response.ok) {
        throw new Error('Error al eliminar el empleado');
      }
  
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error al eliminar el empleado:', error);
      throw error;
    }
  };

  export const exportEmployees = async (query = {}) => {
    try {
      const response = await fetch(`${API_URL}/employee/export`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query }),
      });
  
      if (!response.ok) {
        throw new Error('Error al exportar los empleados');
      }
  
      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error al exportar los empleados:', error);
      throw error;
    }
  };
    