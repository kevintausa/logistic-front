const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const BASE_URL = `${API_URL}/operations/airports`;

export const searchAirports = async (params = {}) => {
  try {
    const { country, name, limit = 10 } = params;
    const searchParams = new URLSearchParams();
    
    if (country) searchParams.append('country', country);
    if (name) searchParams.append('name', name);
    searchParams.append('limit', limit.toString());

    const response = await fetch(`${BASE_URL}/search?${searchParams.toString()}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error searching airports:', error);
    throw error;
  }
};

export const searchAirportsByCountry = async (country, limit = 10) => {
  try {
    const searchParams = new URLSearchParams({
      country,
      limit: limit.toString()
    });

    const response = await fetch(`${BASE_URL}/search/country?${searchParams.toString()}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error searching airports by country:', error);
    throw error;
  }
};

export const searchAirportsByName = async (name, limit = 10) => {
  try {
    const searchParams = new URLSearchParams({
      name,
      limit: limit.toString()
    });

    const response = await fetch(`${BASE_URL}/search/name?${searchParams.toString()}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error searching airports by name:', error);
    throw error;
  }
};

export const getUniqueCountries = async (searchTerm = '', limit = 10) => {
  try {
    const response = await fetch(`${BASE_URL}/search?country=${encodeURIComponent(searchTerm)}&limit=100`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    const airports = result?.data || [];
    
    // Extract unique countries
    const countries = [...new Set(airports.map(airport => airport.pais).filter(Boolean))];
    
    // Filter countries based on search term
    const filteredCountries = searchTerm 
      ? countries.filter(country => country.toLowerCase().includes(searchTerm.toLowerCase()))
      : countries;
    
    return {
      success: true,
      data: filteredCountries.slice(0, limit)
    };
  } catch (error) {
    console.error('Error getting unique countries:', error);
    throw error;
  }
};
