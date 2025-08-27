const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const fetchOperations = async ({ limit = 10, offset = 1, query = {} }) => {
  const res = await fetch(`${API_URL}/operations/filter`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ limit, offset, query })
  });
  if (!res.ok) throw new Error('Error al obtener operaciones');
  return await res.json();
};

export const selectOperationQuote = async (operationId, quoteId) => {
  const res = await fetch(`${API_URL}/operations/${operationId}/select-quote`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ quoteId })
  });
  if (!res.ok) throw new Error('Error al seleccionar cotización');
  return await res.json();
};

export const createOperation = async (payload) => {
  const res = await fetch(`${API_URL}/operations/create`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error('Error al crear operación');
  return await res.json();
};

export const updateOperation = async (id, payload) => {
  const res = await fetch(`${API_URL}/operations/update/${id}`, {
    method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error('Error al actualizar operación');
  return await res.json();
};

export const deleteOperation = async (id) => {
  const res = await fetch(`${API_URL}/operations/delete/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Error al eliminar operación');
  return await res.json();
};

export const exportOperations = async ({ query = {} }) => {
  const res = await fetch(`${API_URL}/operations/export`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ query })
  });
  if (!res.ok) throw new Error('Error al exportar operaciones');
  const data = await res.json();
  const rows = data?.data || [];
  // Flatten to match columnsExcel keys
  return rows.map((row) => ({
    ...row,
    consecutivo: row?.codigo || `OP${String(Number(row?.consecutivo || 0)).padStart(4, '0')}`,
    clienteNombre: row?.cliente?.nombre,
    tipoOperacionNombre: row?.tipoOperacion?.nombre,
    viaNombre: row?.via?.nombre,
    puertoCargaNombre: row?.puertoCarga?.nombre,
    puertoDescargaNombre: row?.puertoDescarga?.nombre,
  }));
};
