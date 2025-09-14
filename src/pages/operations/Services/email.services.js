
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const sendEmail = async ({ to, subject, html, text }) => {
  const response = await fetch(`${API_URL}/email/send`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ to, subject, html, text }),
  });
  if (!response.ok) {
    let msg = 'Error al enviar correo';
    try { const j = await response.json(); msg = j?.message || msg; } catch {}
    throw new Error(msg);
  }
  return await response.json();
};
