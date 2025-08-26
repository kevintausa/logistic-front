import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { X, Trash2 } from 'lucide-react';

const variants = {
  hidden: { x: '100%' },
  visible: { x: 0 },
  exit: { x: '100%' }
};

const today = () => new Date().toISOString().split('T')[0];

const FilterDrawer = ({ isOpen, onClose, fields, onChange, initialDay = false, initialFilters, onApply }) => {
  // Normalizamos initialFilters para que sea una referencia estable
  const normalizedInitialFilters = useMemo(() => initialFilters ?? {}, [initialFilters]);
  const getInitialValues = () => {
    const values = { ...normalizedInitialFilters };
    fields.forEach(field => {
      if (field.type === 'daterange' && initialDay) {
        values[`${field.id}_from`] ??= today();
        values[`${field.id}_to`] ??= today();
      }
    });
 
    Object.keys(values).forEach(key => {
      if (values[key] === '') {
        delete values[key]; 
      }
    });
    return values;
  };

  const [formValues, setFormValues] = useState(getInitialValues);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    setFormValues(getInitialValues());
  }, [normalizedInitialFilters, fields]);

  const validate = (values) => {
    const newErrors = {};

    fields.forEach(field => {
      if (field.type === 'daterange') {
        const from = values[`${field.id}_from`];
        const to = values[`${field.id}_to`];
        if (from && to && from > to) {
          newErrors[`${field.id}_range`] = 'La fecha inicial no puede ser mayor que la final';
        }
      }
    });

    return newErrors;
  };

  const handleInputChange = (id, value) => {
    const updatedValues = { ...formValues, [id]: value };
    setFormValues(updatedValues);
    const newErrors = validate(updatedValues);
    setErrors(newErrors);
  };

  const handleClear = () => {
    const cleared = {};
    fields.forEach(f => {
      if (f.type === 'daterange') {
        cleared[`${f.id}_from`] = undefined; // Asigna undefined en vez de ""
        cleared[`${f.id}_to`] = undefined;   // Asigna undefined en vez de ""
      } else {
        cleared[f.id] = undefined;  // Asigna undefined en vez de ""
      }
    });
    setFormValues(cleared);
    setErrors({});
  };
  const transformFilters = (values) => {
    const transformed = {};
  
    fields.forEach(field => {
      if (field.type === 'daterange') {
        const from = values[`${field.id}_from`];
        const to = values[`${field.id}_to`];
  
        if (from && to) {
          // Ajustamos rango a zona horaria completa del día
          transformed[field.id] = {
            $gte: new Date(`${from}T00:00:00.000`),
            $lte: new Date(`${to}T23:59:59.999`)
          };
        }
      } else {
        const val = values[field.id];
        if (val !== '' && val !== undefined) {
          transformed[field.id] = val;
        }
      }
    });
  
    return transformed;
  };

  const hasErrors = Object.keys(errors).length > 0;


  const handleApply = () => {
    const parsedValues = transformFilters(formValues);
    onApply(parsedValues);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed top-0 right-0 h-full w-96 bg-white shadow-lg border-l z-50 flex flex-col"
          initial="hidden"
          animate="visible"
          exit="exit"
          variants={variants}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        >
          <div className="flex justify-between items-center p-4 border-b text-primary">
            <h2 className="text-lg font-bold">Filtros</h2>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {fields.map(field => {
              if (field.type === 'daterange') {
                const errorKey = `${field.id}_range`;
                return (
                  <div key={field.id} className="flex flex-col gap-1 text-primary">
                    <label className="text-sm font-medium">{field.label}</label>
                    <div className="flex gap-2">
                      <input
                        type="date"
                        className="border p-2 rounded w-full"
                        value={formValues[`${field.id}_from`] || ''}
                        onChange={(e) => handleInputChange(`${field.id}_from`, e.target.value)}
                      />
                      <input
                        type="date"
                        className="border p-2 rounded w-full"
                        value={formValues[`${field.id}_to`] || ''}
                        onChange={(e) => handleInputChange(`${field.id}_to`, e.target.value)}
                      />
                    </div>
                    {errors[errorKey] && (
                      <span className="text-red-500 text-xs">{errors[errorKey]}</span>
                    )}
                  </div>
                );
              }

              return (
                <div key={field.id} className="flex flex-col text-primary">
                  <label className="text-sm font-medium">{field.label}</label>
                  {field.type === 'select' ? (
                    <select
                      className="border p-2 rounded"
                      value={formValues[field.id] || ''}
                      onChange={(e) => handleInputChange(field.id, e.target.value)}
                    >
                      <option value="">-- Selecciona --</option>
                      {field.options?.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type={field.type}
                      className="border p-2 rounded"
                      value={formValues[field.id] || ''}
                      onChange={(e) => handleInputChange(field.id, e.target.value)}
                    />
                  )}
                </div>
              );
            })}
          </div>

          <div className="p-4 border-t flex justify-between">
            <Button variant="outline" onClick={handleClear}>
              <Trash2 className="w-4 h-4 mr-2" /> Limpiar
            </Button>
            <Button onClick={handleApply} disabled={hasErrors}>
              Aplicar
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default FilterDrawer;
