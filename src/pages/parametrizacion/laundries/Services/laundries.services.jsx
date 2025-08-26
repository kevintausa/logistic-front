// Stub service to prevent import 404s. Replace with real implementation when backend is ready.

export const fetchLaundries = async ({ limit = 100, offset = 1, query = {} } = {}) => {
  // You can swap this stub to a real API call when available.
  // Example:
  // const API_URL = import.meta.env.VITE_API_URL;
  // const res = await fetch(`${API_URL}/laundries/filter`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ limit, offset, query }) });
  // const data = await res.json();
  // return data;

  return {
    code: 200,
    data: [],
    totalRecords: 0,
  };
};
