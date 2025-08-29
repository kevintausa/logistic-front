import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

const Row = ({ label, value }) => {
  const isEmpty = value === undefined || value === null || value === '' || value === '—';
  if (isEmpty) return null;
  return (
    <div className="flex flex-col">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm font-medium">{value}</span>
    </div>
  );
};

const OperationDetailsModal = ({ isOpen, onClose, item }) => {
  if (!isOpen || !item) return null;
  const safe = (obj, key, fallback = '—') => (obj && obj[key]) ? obj[key] : fallback;
  const esp = item.especifico || {};
  const det = esp.detalles || {};
  const tipoId = ((item?.tipoOperacion?.id) || '').toLowerCase();
  const isTerrestreOrLCL = tipoId === 'transporte_terrestre' || tipoId === 'importacion_lcl' || tipoId === 'exportacion_lcl';
  const isFCL = tipoId === 'importacion_fcl' || tipoId === 'exportacion_fcl';
  const isAerea = tipoId === 'importacion_aerea' || tipoId === 'exportacion_aerea';
  const isAgenciamiento = tipoId === 'agenciamiento_aduanero';

  const formatNumberWithCommas = (val) => {
    if (val === undefined || val === null || val === '') return '—';
    const str = String(val);
    const cleaned = str.replace(/[^0-9.]/g, '');
    if (!cleaned) return '—';
    const [intPart, decPart] = cleaned.split('.');
    const withCommas = intPart ? intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',') : '';
    return decPart !== undefined ? `${withCommas}.${decPart}` : withCommas;
  };
  const money = (v, cur) => {
    const n = formatNumberWithCommas(v);
    return n === '—' ? '—' : `${n}${cur ? ` ${cur}` : ''}`;
  };
  const dim = (l, a, h, u) => {
    const hasAny = l || a || h;
    if (!hasAny) return '—';
    return `${l || '—'} x ${a || '—'} x ${h || '—'}${u ? ` ${u}` : ''}`;
  };
  const weight = (v, u) => {
    if (v === undefined || v === null || v === '') return '—';
    return `${v} ${u || 'kg'}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        className="bg-card p-6 rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto border border-blue-100 border-t-[6px] border-t-blue-600"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold text-blue-700">Detalle de Operación {item.codigo || ''}</h3>
          <Button variant="ghost" size="icon" onClick={onClose} className="text-blue-600 hover:text-blue-700 hover:bg-blue-50">
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Row label="Código" value={item.codigo} />
          <Row label="Estado" value={item.estado} />
          <Row label="Cliente" value={safe(item, 'cliente')?.nombre || safe(item, 'clienteNombre')} />
          <Row label="NIT" value={safe(item.cliente, 'nit')} />
          <Row label="Tipo Operación" value={safe(item.tipoOperacion || {}, 'nombre')} />
          <Row label="Vía" value={safe(item.via || {}, 'nombre')} />
          <Row label="Puerto Carga" value={safe(item.puertoCarga || {}, 'nombre')} />
          <Row label="Puerto Descarga" value={safe(item.puertoDescarga || {}, 'nombre')} />
          <Row label="Incoterm" value={item.incoterm} />
          <Row label="Piezas" value={item.piezas} />
          <Row label="Peso" value={weight(item.pesoKg, 'kg')} />
          <Row label="Volumen (m3)" value={item.m3} />
          <Row label="Asesor" value={item.asesorNombre} />
          <Row label="Correo asesor" value={item.asesorCorreo} />
          <div className="md:col-span-2">
            <span className="text-xs text-muted-foreground">Descripción</span>
            <div className="mt-1 text-sm whitespace-pre-wrap bg-muted/30 border border-border rounded p-3 min-h-[72px]">{item.descripcion || '—'}</div>
          </div>
        </div>

        {/* Específico por tipo */}
        <div className="mt-6">
          <h4 className="text-sm font-semibold text-blue-700 mb-2">Específico</h4>
          {isAgenciamiento && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Row label="Partida arancelaria" value={esp.partidaArancelaria} />
              <Row label="Valor mercancía" value={money(esp.valorMercancia, esp.moneda)} />
              <Row label="Uso" value={esp.uso} />
              <Row label="Tipo mercancía" value={esp.tipoMercancia} />
            </div>
          )}
          {isTerrestreOrLCL && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Row label="Valor mercancía" value={money(esp.valorMercancia, esp.moneda)} />
              <Row label="Piezas (detalles)" value={det.piezas} />
              <Row label="Dimensiones" value={dim(det.largo, det.ancho, det.alto, det.unidadMedida)} />
              <Row label="Peso (detalles)" value={weight(det.peso, det.pesoUnidad)} />
              <Row label="Tipo bulto" value={det.tipo} />
              <Row label="Apilable" value={esp.apilable === true ? 'Sí' : (esp.apilable === false ? 'No' : '—')} />
            </div>
          )}
          {isFCL && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Row label="Valor mercancía" value={money(esp.valorMercancia, esp.moneda)} />
              <Row label="Nº contenedores" value={esp.numeroContenedores} />
              <Row label="Tipo contenedor" value={det.tipoContenedor} />
              <Row label="Peso (detalles)" value={weight(det.peso, det.pesoUnidad)} />
              <Row label="Tipo bulto" value={det.tipo} />
              <Row label="Incoterm" value={item.incoterm} />
            </div>
          )}
          {isAerea && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Row label="Piezas (detalles)" value={det.piezas} />
              <Row label="Dimensiones" value={dim(det.largo, det.ancho, det.alto, det.unidadMedida)} />
              <Row label="Peso (detalles)" value={weight(det.peso, det.pesoUnidad)} />
              <Row label="Tipo mercancía" value={esp.tipoMercancia} />
              <Row label="Apilable" value={esp.apilable === true ? 'Sí' : (esp.apilable === false ? 'No' : '—')} />
              <Row label="Incoterm" value={item.incoterm} />
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-end">
          <Button onClick={onClose} className="bg-blue-600 hover:bg-blue-700 text-white">Cerrar</Button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default OperationDetailsModal;
