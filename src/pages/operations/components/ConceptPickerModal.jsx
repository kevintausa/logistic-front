import React, { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const groups = [
  { id: 'transporte', label: 'Transporte internacional' },
  { id: 'aduana', label: 'Gastos de Aduana' },
  { id: 'terrestre', label: 'Transporte Terrestre' },
  { id: 'seguro', label: 'Seguros' },
];

const ConceptPickerModal = ({ isOpen, onClose, conceptsMap, defaultGroup = 'transporte', onConfirm, readOnly = false }) => {
  const [activeGroup, setActiveGroup] = useState(defaultGroup);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(new Set());

  const list = conceptsMap?.[activeGroup] || [];
  const filtered = useMemo(() => {
    const q = (search || '').toLowerCase();
    if (!q) return list;
    return list.filter((c) => (c.concepto || '').toLowerCase().includes(q));
  }, [list, search]);

  const toggle = (id, checked) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (checked) next.add(String(id)); else next.delete(String(id));
      return next;
    });
  };

  const selectAll = (checked) => {
    setSelected((prev) => {
      if (!checked) return new Set();
      const next = new Set(filtered.map((c) => String(c._id)));
      return next;
    });
  };

  const handleConfirm = () => {
    const ids = Array.from(selected);
    const chosen = list.filter((c) => ids.includes(String(c._id)));
    onConfirm?.(activeGroup, chosen);
    onClose?.();
    // reset
    setSelected(new Set());
    setSearch('');
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
        <motion.div className="bg-white w-[95vw] max-w-3xl max-h-[85vh] rounded-lg shadow-lg p-4 md:p-6 flex flex-col" initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Seleccionar conceptos</h3>
            <Button variant="ghost" onClick={onClose}>Cerrar</Button>
          </div>

          <div className="flex gap-2 mb-3 flex-wrap">
            {groups.map((g) => (
              <Button key={g.id} size="sm" variant={activeGroup === g.id ? 'default' : 'outline'} onClick={() => setActiveGroup(g.id)}>
                {g.label}
              </Button>
            ))}
          </div>

          <div className="flex items-center gap-2 mb-2">
            <Input className="h-8" placeholder="Buscar concepto" value={search} onChange={(e) => setSearch(e.target.value)} />
            <label className="flex items-center gap-2 text-xs">
              <input type="checkbox" onChange={(e) => selectAll(e.target.checked)} /> Seleccionar todos
            </label>
          </div>

          <div className="flex-1 overflow-auto border rounded">
            {filtered.map((c) => (
              <label key={c._id} className="flex items-center justify-between px-3 py-2 text-sm hover:bg-gray-50 border-b">
                <div className="flex items-center gap-2">
                  <input type="checkbox" checked={selected.has(String(c._id))} onChange={(e) => toggle(c._id, e.target.checked)} />
                  <span>{c.concepto}</span>
                </div>
                <span className="text-xs text-gray-500">${Number(c.montoUsd || 0).toFixed(2)} {c.tipo ? `(${c.tipo})` : ''}</span>
              </label>
            ))}
          </div>

          <div className="mt-4 flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>Cancelar</Button>
            <Button onClick={handleConfirm} disabled={readOnly || selected.size === 0}>Agregar</Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ConceptPickerModal;
