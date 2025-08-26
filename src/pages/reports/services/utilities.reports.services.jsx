// Definimos la URL base según la variable de entorno, con fallback a localhost
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export async function getUtilityReportTotals({ query = {} }) {
  try {
    const res = await fetch(`${API_URL}/utility-services/reports/totals`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    return json; // { data: { totales, porTipo }, ... }
  } catch (err) {
    console.error('getUtilityReportTotals error', err);
    throw err;
  }
}

export async function getUtilityDaily({ query = {}, groupBy = 'day' }) {
  try {
    const res = await fetch(`${API_URL}/utility-services/reports/daily`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, groupBy }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    return json; // { data: [{ date, agua, gas, Electricidad, total }], ... }
  } catch (err) {
    console.error('getUtilityDaily error', err);
    throw err;
  }
}
