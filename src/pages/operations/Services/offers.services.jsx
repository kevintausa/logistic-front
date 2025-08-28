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

export async function listOfferConcepts({ grupo, activos = true } = {}) {
  const url = new URL(`${API_URL}/offers/concepts`);
  if (grupo) url.searchParams.set('grupo', grupo);
  if (activos !== undefined) url.searchParams.set('activos', String(activos));
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error('Error al obtener conceptos');
  return await res.json();
}

export async function createOfferConcept(body) {
  const res = await fetch(`${API_URL}/offers/concepts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error('Error al crear concepto');
  return await res.json();
}

export async function updateOfferConcept(id, body) {
  const res = await fetch(`${API_URL}/offers/concepts/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error('Error al actualizar concepto');
  return await res.json();
}

export async function toggleOfferConceptActive(id, activo) {
  const url = new URL(`${API_URL}/offers/concepts/${id}/active`);
  url.searchParams.set('activo', String(!!activo));
  const res = await fetch(url.toString(), { method: 'PATCH' });
  if (!res.ok) throw new Error('Error al cambiar estado del concepto');
  return await res.json();
}
