const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const fetchData = async (url, options) => {
  const response = await fetch(url, options);
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Error en la petición');
  }
  return response.json();
};

export const getWashingPrograms = (filters) => {
  return fetchData(`${API_URL}/washing-programs/filter`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(filters),
  });
};

export const createWashingProgram = (data) => {
  return fetchData(`${API_URL}/washing-programs/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
};

export const updateWashingProgram = (id, data) => {
  return fetchData(`${API_URL}/washing-programs/update/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
};

export const deleteWashingProgram = (id) => {
  return fetchData(`${API_URL}/washing-programs/delete/${id}`, {
    method: 'DELETE',
  });
};

export const exportWashingPrograms = (filters) => {
  return fetchData(`${API_URL}/washing-programs/export`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(filters),
  });
};
