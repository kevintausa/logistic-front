const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export async function getOfferByOperation(operationId) {
  const url = new URL(`${API_URL}/offers/by-operation`);
  url.searchParams.set('operationId', operationId);
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error('Error al obtener oferta');
  return await res.json();
}

export async function assembleOfferFromQuote(operationId, quoteId) {
  const url = new URL(`${API_URL}/offers/assemble-from-quote`);
  url.searchParams.set('operationId', operationId);
  url.searchParams.set('quoteId', quoteId);
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error('Error al armar borrador de oferta');
  return await res.json();
}

export async function upsertOffer(payload) {
  const res = await fetch(`${API_URL}/offers/upsert`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Error al guardar oferta');
  return await res.json();
}
