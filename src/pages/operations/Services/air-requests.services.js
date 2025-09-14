const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const BASE_URL = `${API_URL}/operations`;

export const createAirRequest = async (payload) => {
  try {
    const response = await fetch(`${BASE_URL}/air-request/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error creating air request:', error);
    throw error;
  }
};
