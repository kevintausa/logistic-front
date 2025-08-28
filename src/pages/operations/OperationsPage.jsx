import React, { useCallback, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ClipboardList, PlusCircle, FilterIcon } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import DataTable from '@/components/DataTable';
import AppliedFilters from '@/components/AppliedFilters';
import FilterDrawer from '@/components/FilterDrawer';
import { useToast } from '@/components/ui/use-toast';
import { operationsColumns, columnsExcel } from './utils/operationsColumns';
import ExportExcelButton from '@/components/ExportExcelButton';
import { createOperation, deleteOperation, exportOperations, fetchOperations, updateOperation, selectOperationQuote } from './Services/operations.services';
import { createQuote } from './Services/quotes.services';
import OperationModal from './components/OperationModal';
import OperationDetailsModal from './components/OperationDetailsModal';
import QuoteModal from './components/QuoteModal';
import QuotesListModal from './components/QuotesListModal';
import OfferBuilderModal from './components/OfferBuilderModal';
import { getOfferByOperation, assembleOfferFromQuote, upsertOffer } from './Services/offers.services';

const DEFAULT_FILTERS = {};

const OperationsPage = () => {
  const { toast } = useToast();
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState(null);
  const [modalMode, setModalMode] = useState('create');
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [detailsItem, setDetailsItem] = useState(null);
  const [isQuoteOpen, setIsQuoteOpen] = useState(false);
  const [quoteOperation, setQuoteOperation] = useState(null);
  const [isQuotesListOpen, setIsQuotesListOpen] = useState(false);
  const [quotesOperation, setQuotesOperation] = useState(null);
  const [isOfferOpen, setIsOfferOpen] = useState(false);
  const [offerOperation, setOfferOperation] = useState(null);
  const [offerDraft, setOfferDraft] = useState(null);
  const [offerReadOnly, setOfferReadOnly] = useState(false);

  const fetchAndSet = useCallback(async () => {
    setIsLoading(true);
    try {
      const offset = currentPage;
      const { data, totalRecords } = await fetchOperations({ limit: itemsPerPage, offset, query: filters });
      const normalized = (data || []).map((row) => ({
        ...row,
        clienteNombre: row?.cliente?.nombre,
      }));
      setData(normalized);
      setTotalItems(totalRecords);
    } catch (error) {
      toast({ title: 'Error', description: error.message || 'No se pudieron obtener las operaciones.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, itemsPerPage, filters, toast]);

  useEffect(() => { fetchAndSet(); }, [fetchAndSet]);

  const handlePageChange = (page) => setCurrentPage(page);
  const handleLimitChange = (newLimit) => { setItemsPerPage(newLimit); setCurrentPage(1); };
  const handleFilterChange = (newFilters) => { setCurrentPage(1); setFilters(newFilters); };
  const handleRemoveFilter = (key) => { const nf = { ...filters }; delete nf[key]; setFilters(nf); setCurrentPage(1); };

  const handleOpenModal = (mode, item = null) => { setModalMode(mode); setCurrentItem(item); setIsModalOpen(true); };
  const handleCloseModal = () => { setIsModalOpen(false); setCurrentItem(null); };
  const handleSaveItem = async (itemData) => {
    try {
      if (modalMode === 'create') {
        const response = await createOperation(itemData);
        if (response.code === 201) toast({ title: 'Creada', description: 'Operación creada.' }); else throw new Error(response.message);
      } else {
        const response = await updateOperation(currentItem._id, itemData);
        if (response.code === 200) toast({ title: 'Actualizada', description: 'Operación actualizada.' }); else throw new Error(response.message);
      }
    } catch (error) {
      toast({ title: 'Error', description: error.message || 'Problema al guardar.', variant: 'destructive' });
    } finally {
      handleCloseModal();
      fetchAndSet();
    }
  };

  // Renderizador documento formal para impresión/descarga (temporal)
  const buildOfferPrintableHtml = (operation, offer) => {
    const items = Array.isArray(offer.items) ? offer.items : [];
    const fmt = (n) => (Number(n || 0)).toFixed(2);
    const subtotalCot = items
      .filter((it) => (it?.tipo || '').toLowerCase() === 'cotizacion')
      .reduce((a, b) => a + Number(b.montoUsd || 0), 0);
    const subtotalManual = items
      .filter((it) => (it?.tipo || '').toLowerCase() !== 'cotizacion')
      .reduce((a, b) => a + Number(b.montoUsd || 0), 0);
    const total = subtotalCot + subtotalManual;

    const rows = items
      .map((it) => `
        <tr>
          <td class=\"tcell\">${it.grupo || ''}</td>
          <td class=\"tcell\">${it.concepto || ''}</td>
          <td class=\"tcell num\">$ ${fmt(it.montoUsd)}</td>
        </tr>`)
      .join('');

    const cliente = operation?.cliente || {};
    const clientName = cliente?.nombre || '';
    const clientNit = cliente?.nit || cliente?.ruc || cliente?.documento || '';
    const asesorName = operation?.asesorNombre || operation?.asesor?.nombre || '';
    const asesorEmail = operation?.asesorCorreo || operation?.asesorEmail || operation?.asesor?.correo || '';
    const notas = offer?.notas || '';
    const logoUrl = `${window.location.origin}/logo.png`;

    return `<!doctype html>
    <html>
    <head>
      <meta charset=\"utf-8\"/>
      <title>Oferta ${operation?.codigo || operation?._id || ''}</title>
      <style>
        *{box-sizing:border-box}
        body{font-family:Inter,system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;margin:0;padding:32px;color:#111;background:#fff}
        .header{display:flex;align-items:center;justify-content:space-between;border-bottom:2px solid #111;padding-bottom:12px;margin-bottom:16px}
        .brand{display:flex;align-items:center;gap:12px}
        .brand img{height:42px;width:auto;object-fit:contain}
        .brand .title{font-size:20px;font-weight:700}
        .meta{font-size:12px;color:#444;text-align:right}
        .section-title{font-size:14px;font-weight:600;margin:18px 0 8px;color:#222}
        table{width:100%;border-collapse:collapse}
        th{font-size:12px;text-align:left;color:#333;border-bottom:1px solid #ddd;padding:8px;background:#fafafa}
        .tcell{font-size:12px;border-bottom:1px solid #eee;padding:8px;vertical-align:top}
        .num{text-align:right}
        .grid{display:grid;grid-template-columns:1fr 1fr;gap:16px}
        .card{border:1px solid #e5e7eb;border-radius:8px;padding:12px;background:#fff}
        .label{font-size:11px;color:#6b7280;margin-bottom:4px}
        .value{font-size:13px;font-weight:600;color:#111}
        .totals{margin-top:10px;display:flex;flex-direction:column;gap:4px}
        .totals .row{display:flex;justify-content:flex-end;gap:12px;font-size:13px}
        .totals .row .k{color:#374151}
        .totals .row .v{min-width:120px;text-align:right;font-weight:700}
        .notes{white-space:pre-wrap;border:1px solid #e5e7eb;border-radius:8px;padding:10px;background:#fcfcfc;font-size:12px;color:#111}
        .muted{color:#6b7280;font-size:12px}
        @media print{body{padding:0} .header{margin-top:12px}}
      </style>
    </head>
    <body>
      <div class=\"header\">
        <div class=\"brand\">
          <img src=\"${logoUrl}\" alt=\"Logo\" onerror=\"this.style.display='none'\"/>
          <div class=\"title\">Oferta</div>
        </div>
        <div class=\"meta\">
          <div><strong>Operación:</strong> ${operation?.codigo || operation?._id || ''}</div>
          <div>${new Date().toLocaleDateString()}</div>
        </div>
      </div>

      <div class=\"grid\">
        <div class=\"card\">
          <div class=\"label\">Cliente</div>
          <div class=\"value\">${clientName || '—'}</div>
          <div class=\"muted\">NIT/RUC: ${clientNit || '—'}</div>
        </div>
        <div class=\"card\">
          <div class=\"label\">Asesor</div>
          <div class=\"value\">${asesorName || '—'}</div>
          <div class=\"muted\">${asesorEmail || ''}</div>
        </div>
      </div>

      <div class=\"section-title\">Conceptos</div>
      <table>
        <thead>
          <tr><th>Grupo</th><th>Concepto</th><th class=\"num\">Monto (USD)</th></tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>

      <div class=\"totals\">
        <div class=\"row\"><div class=\"k\">Subtotal cotización</div><div class=\"v\">$ ${fmt(subtotalCot)}</div></div>
        <div class=\"row\"><div class=\"k\">Subtotal manual</div><div class=\"v\">$ ${fmt(subtotalManual)}</div></div>
        <div class=\"row\"><div class=\"k\"><strong>Total</strong></div><div class=\"v\"><strong>$ ${fmt(total)}</strong></div></div>
      </div>

      ${notas ? `<div class=\"section-title\">Notas</div><div class=\"notes\">${notas}</div>` : ''}
    </body>
    </html>`;
  };

  const handleSaveQuote = async (quoteData) => {
    try {
      if (!quoteData?.providerId) {
        toast({ title: 'Proveedor requerido', description: 'Selecciona un proveedor para guardar la cotización.', variant: 'destructive' });
        return;
      }
      const resp = await createQuote(quoteData);
      if (resp.code === 201) {
        toast({ title: 'Cotización guardada', description: 'La cotización fue creada exitosamente.' });
        setIsQuoteOpen(false);
        setQuoteOperation(null);
      } else {
        throw new Error(resp.message || 'Error al crear la cotización');
      }
    } catch (error) {
      toast({ title: 'Error', description: error.message || 'No se pudo guardar la cotización.', variant: 'destructive' });
    }
  };

  const handleAction = async (actionType, row) => {
    switch (actionType) {
      case 'view':
        setDetailsItem(row);
        setIsDetailsOpen(true);
        break;
      case 'addQuote':
        setQuoteOperation(row);
        setIsQuoteOpen(true);
        break;
      case 'quotes':
      case 'manageQuotes':
        setQuotesOperation(row);
        setIsQuotesListOpen(true);
        break;
      case 'edit':
        handleOpenModal('edit', row);
        break;
      case 'delete':
        try {
          const resp = await deleteOperation(row._id);
          if (resp.code === 200) {
            toast({ title: 'Eliminada', description: 'Operación eliminada.' });
            fetchAndSet();
          } else throw new Error(resp.message);
        } catch (err) {
          toast({ title: 'Error', description: err.message || 'Error al eliminar.', variant: 'destructive' });
        }
        break;
      case 'quotes':
        toast({ title: 'Cotizaciones', description: 'Próximamente: gestión de cotizaciones.' });
        break;
      case 'offer':
        try {
          setOfferOperation(row);
          // 1) Intentar obtener oferta existente
          const existing = await getOfferByOperation(row._id);
          let draft = existing?.data;
          // 2) Si no existe, armar desde la cotización seleccionada
          if (!draft) {
            if (!row.cotizacionSeleccionadaId) {
              toast({ title: 'Cotización requerida', description: 'Selecciona una cotización antes de generar la oferta.', variant: 'destructive' });
              setOfferOperation(null);
              return;
            }
            const assembled = await assembleOfferFromQuote(row._id, row.cotizacionSeleccionadaId);
            draft = assembled?.data;
          }
          setOfferDraft(draft || { operationId: row._id, quoteId: row.cotizacionSeleccionadaId, items: [] });
          setOfferReadOnly(false);
          setIsOfferOpen(true);
        } catch (e) {
          toast({ title: 'Error', description: e.message || 'No se pudo preparar la oferta.', variant: 'destructive' });
          setOfferOperation(null);
        }
        break;
      case 'viewOffer':
        try {
          setOfferOperation(row);
          const existing = await getOfferByOperation(row._id);
          let draft = existing?.data;
          if (!draft) {
            if (!row.cotizacionSeleccionadaId) {
              toast({ title: 'Oferta no disponible', description: 'Primero genera la oferta desde la cotización seleccionada.', variant: 'destructive' });
              setOfferOperation(null);
              return;
            }
            const assembled = await assembleOfferFromQuote(row._id, row.cotizacionSeleccionadaId);
            draft = assembled?.data;
          }
          setOfferDraft(draft || { operationId: row._id, quoteId: row.cotizacionSeleccionadaId, items: [] });
          setOfferReadOnly(true);
          setIsOfferOpen(true);
        } catch (e) {
          toast({ title: 'Error', description: e.message || 'No se pudo cargar la oferta.', variant: 'destructive' });
          setOfferOperation(null);
        }
        break;
      case 'downloadOffer':
        try {
          // Obtener oferta (o ensamblarla temporalmente si no existe)
          const existing = await getOfferByOperation(row._id);
          let draft = existing?.data;
          if (!draft && row.cotizacionSeleccionadaId) {
            const assembled = await assembleOfferFromQuote(row._id, row.cotizacionSeleccionadaId);
            draft = assembled?.data;
          }
          if (!draft) {
            toast({ title: 'Sin oferta', description: 'Genera la oferta primero para poder descargarla.', variant: 'destructive' });
            return;
          }
          // Render básico imprimible
          const html = buildOfferPrintableHtml(row, draft);
          const w = window.open('', '_blank');
          if (w) {
            w.document.open();
            w.document.write(html);
            w.document.close();
            w.focus();
            w.print();
          } else {
            toast({ title: 'Bloqueado por el navegador', description: 'Permite ventanas emergentes para descargar/imprimir.', variant: 'destructive' });
          }
        } catch (e) {
          toast({ title: 'Error', description: e.message || 'No se pudo preparar la descarga.', variant: 'destructive' });
        }
        break;
      case 'status':
        toast({ title: 'Estatus', description: 'Próximamente: línea de tiempo de estatus.' });
        break;
      case 'close':
        toast({ title: 'Cerrar', description: 'Próximamente: cierre de operación.' });
        break;
      case 'cancel':
        toast({ title: 'Cancelar', description: 'Próximamente: cancelación de operación.' });
        break;
      default:
        break;
    }
  };

  const handleSaveOffer = async (payload) => {
    try {
      const resp = await upsertOffer(payload);
      if (resp.code === 200) {
        toast({ title: 'Oferta guardada', description: 'La oferta fue guardada exitosamente.' });
        setIsOfferOpen(false);
        setOfferOperation(null);
        setOfferDraft(null);
        fetchAndSet();
      } else {
        throw new Error(resp.message || 'Error al guardar oferta');
      }
    } catch (e) {
      toast({ title: 'Error', description: e.message || 'No se pudo guardar la oferta.', variant: 'destructive' });
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="p-4 md:p-6">
      <Card>
        <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="bg-primary/10 p-3 rounded-lg"><ClipboardList className="h-8 w-8 text-primary" /></div>
            <div>
              <CardTitle className="text-2xl">Operaciones</CardTitle>
              <CardDescription>Gestiona las operaciones.</CardDescription>
            </div>
          </div>
          <div className="w-full md:w-auto flex flex-col md:flex-row gap-3">
            <div className="flex flex-wrap gap-2 justify-end">
              <ExportExcelButton title="Operaciones" columns={columnsExcel} getData={() => exportOperations({ query: filters })} />
              <Button onClick={() => handleOpenModal('create')}><PlusCircle className="mr-2 h-4 w-4" /> Crear</Button>
              <Button onClick={() => setIsDrawerOpen(true)} className="flex items-center font-semibold bg-black hover:bg-white/20 "><FilterIcon className="mr-2 h-4 w-4" />Filtros</Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <AppliedFilters 
            filters={filters}
            fields={[{ id: 'estado', label: 'Estado', type: 'select', options: ['Pendiente', 'Tarifa Seleccionada', 'Pendiente de Aprobación', 'En curso', 'Finalizada', 'Cancelada'] }]}
            onRemoveFilter={handleRemoveFilter}
          />
          <DataTable data={data} columns={operationsColumns} isLoading={isLoading} onAction={handleAction} page={currentPage} limit={itemsPerPage} totalRecords={totalItems} onPageChange={handlePageChange} onLimitChange={handleLimitChange} />
          <FilterDrawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} fields={[{ id: 'estado', label: 'Estado', type: 'select', options: ['Pendiente', 'Tarifa Seleccionada', 'Pendiente de Aprobación', 'En curso', 'Finalizada', 'Cancelada'] }]} initialFilters={filters} onChange={handleFilterChange} onApply={handleFilterChange} />
        </CardContent>
      </Card>
      <AnimatePresence>
        {isModalOpen && (
          <OperationModal
            isOpen={isModalOpen}
            onClose={handleCloseModal}
            onSave={handleSaveItem}
            item={currentItem}
            title={currentItem ? 'Editar Operación' : 'Crear Operación'}
          />
        )}
        {isDetailsOpen && (
          <OperationDetailsModal
            isOpen={isDetailsOpen}
            onClose={() => { setIsDetailsOpen(false); setDetailsItem(null); }}
            item={detailsItem}
          />
        )}
        {isQuoteOpen && (
          <QuoteModal
            isOpen={isQuoteOpen}
            onClose={() => { setIsQuoteOpen(false); setQuoteOperation(null); }}
            onSave={handleSaveQuote}
            operation={quoteOperation}
          />
        )}
        {isQuotesListOpen && (
          <QuotesListModal
            isOpen={isQuotesListOpen}
            operation={quotesOperation}
            onClose={() => { setIsQuotesListOpen(false); setQuotesOperation(null); }}
            onSelect={async (q) => {
              try {
                const resp = await selectOperationQuote(quotesOperation?._id, q._id);
                if (resp.code === 200) {
                  toast({ title: 'Cotización seleccionada', description: `Se seleccionó la cotización (${q.totalUsd?.toFixed?.(2) ?? q.totalUsd})` });
                  setIsQuotesListOpen(false);
                  setQuotesOperation(null);
                  fetchAndSet();
                } else {
                  throw new Error(resp.message || 'Error al seleccionar cotización');
                }
              } catch (e) {
                toast({ title: 'Error', description: e.message || 'No se pudo seleccionar la cotización', variant: 'destructive' });
              }
            }}
          />
        )}
        {isOfferOpen && (
          <OfferBuilderModal
            isOpen={isOfferOpen}
            onClose={() => { setIsOfferOpen(false); setOfferOperation(null); setOfferDraft(null); }}
            operation={offerOperation}
            initialDraft={offerDraft}
            onSave={handleSaveOffer}
            readOnly={offerReadOnly}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default OperationsPage;
