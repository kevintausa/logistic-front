const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const saveShifts = async (shiftData) => {
  try {
    const response = await fetch(`${API_URL}/shifts/save`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(shiftData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Error al guardar los turnos');
    }

    return await response.json();
  } catch (error) {
    console.error('Error en saveShifts:', error);
    throw error;
  }
};

export const getShifts = async ({ employeeId, startDate, endDate }) => {
  try {
    // Asumiendo un endpoint GET con query params
    const response = await fetch(`${API_URL}/shifts?employeeId=${employeeId}&startDate=${startDate}&endDate=${endDate}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        // Authorization header if needed
      },
    });

    if (!response.ok) {
      // Si la respuesta es 404 (no encontrado), es posible que no haya turnos, devolvemos un objeto vacío.
      if (response.status === 404) {
        return { shifts: {}, lunchHours: {}, overtimeHours: {} };
      }
      const errorData = await response.json();
      throw new Error(errorData.message || 'Error al obtener los turnos');
    }

    const data = await response.json();
    // Normalizar: asegurar estructura predecible
    return {
      shifts: data?.shifts || {},
      lunchHours: data?.lunchHours || {},
      overtimeHours: data?.overtimeHours || {},
      // soportar distintas claves que el backend pudiera usar
      plannedDayOff: data?.plannedDayOff ?? null,
      dayOff: data?.dayOff ?? null,
      diaDescanso: data?.diaDescanso ?? null,
    };
  } catch (error) {
    console.error('Error en getShifts:', error);
    throw error;
  }
};
