import pkg from '../../package.json';
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export async function fetchLatestVersion() {
  try {
    const res = await fetch(`${API_URL}/versions/latest`, { headers: { 'Content-Type': 'application/json' } });
    if (!res.ok) throw new Error('Failed to fetch latest version');
    const data = await res.json();
    return data; // { version, changes }
  } catch (e) {
    return null;
  }
}

export function getLocalVersion() {
  return import.meta.env.VITE_APP_VERSION || pkg?.version || null;
}
