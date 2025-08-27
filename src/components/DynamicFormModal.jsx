import React, { useState, useEffect, useMemo } from 'react';

import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X, Loader2, Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';

const DynamicFormModal = ({ isOpen, onClose, onSave, item, fields, title, mode, modalClassName, twoColumns = false }) => {
  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState({});
  const [isFormValid, setIsFormValid] = useState(false);
  const [asyncOptions, setAsyncOptions] = useState({});
  const [loadingFields, setLoadingFields] = useState({});
  const [passwordVisible, setPasswordVisible] = useState({}); // por campo

  // Filtra campos según modo (crear/editar) usando flags onlyOnCreate / onlyOnEdit
  const effectiveFields = useMemo(() => {
    const isEdit = Boolean(item);
    return (fields || []).filter(f => {
      if (isEdit && f.onlyOnCreate) return false;
      if (!isEdit && f.onlyOnEdit) return false;
      return true;
    });
  }, [fields, item]);

  // Inicializa los datos del formulario (similar a ReceptionFormModal)
  useEffect(() => {
    if (!isOpen) return;
    
    const initialData = effectiveFields.reduce((acc, field) => {
      // Para campos select/inputs simples
      if (field.type !== 'asyncSelect') {
        if (item) {
          const raw = item[field.id];
          // Normalizar selects cuyo valor viene como objeto {id/_id, nombre}
          if (field.type === 'select' && raw && typeof raw === 'object') {
            acc[field.id] = raw.id || raw._id || '';
          } else if (field.type === 'select' && typeof raw === 'boolean') {
            // Normalizar boolean a string para selects (por ejemplo 'true'/'false')
            acc[field.id] = raw ? 'true' : 'false';
          } else {
            acc[field.id] = raw;
          }
        } else {
          acc[field.id] = (field.type === 'number' ? '' : '');
        }
      } else {
        // Para asyncSelect, si estamos en edición, usar el valor del item (puede ser objeto {id,nombre} o valor simple)
        acc[field.id] = item ? item[field.id] : '';
      }
      return acc;
    }, {});
    
    setFormData(initialData);
    setErrors({});
    
    // Reset form when closing
    return () => {
      if (!isOpen) {
        setFormData({});
        setErrors({});
        setIsFormValid(false);
      }
    };
  }, [isOpen, item, effectiveFields]);

  // Cuando las opciones asíncronas o pre-cargadas están disponibles, asegúrate de que el valor quede alineado
  useEffect(() => {
    if (!isOpen || !item) return;

    const updated = {};
    effectiveFields.forEach(field => {
      if (field.type === 'asyncSelect') {
        const options = (asyncOptions[field.id] !== undefined ? asyncOptions[field.id] : (field.options || []));
        const current = formData[field.id];
        if (current && options && options.length) {
          // Si current es objeto con id, buscar coincidencia; si es primitivo, también
          const match = options.find(opt => (opt.value?.id ?? opt.value) === (current?.id ?? current));
          if (match) {
            updated[field.id] = match.value; // normaliza al value del option
          }
        }
      }
    });
    if (Object.keys(updated).length) {
      setFormData(prev => ({ ...prev, ...updated }));
    }
  }, [isOpen, item, effectiveFields, asyncOptions]);

  // Efecto para cargar opciones asíncronas (usa opciones pre-cargadas si existen)
  useEffect(() => {
    if (!isOpen) return;
    
    effectiveFields.forEach(field => {
      if (field.type === 'asyncSelect' && field.fetchOptions && (!field.options || field.options.length === 0)) {
        setLoadingFields(prev => ({ ...prev, [field.id]: true }));
        
        field.fetchOptions()
          .then(options => {
            // Guardar las opciones disponibles
            setAsyncOptions(prev => ({ ...prev, [field.id]: options }));
            
            if (item && item[field.id]) {
              let selectedOption;
              
              // Busca la opción correspondiente basada en la estructura del objeto
              if (item[field.id] && item[field.id].id) {
                // Si es un objeto con id y nombre (como centro de lavado)
                selectedOption = options.find(opt => 
                  (opt.value.id && opt.value.id === item[field.id].id)
                );
              } else {
                // Si es un valor simple o un objeto con otra estructura
                selectedOption = options.find(opt => 
                  (opt.value === item[field.id]) ||
                  (opt.value.id === item[field.id])
                );
              }
              
              if (selectedOption) {
                setFormData(prev => ({ 
                  ...prev, 
                  [field.id]: selectedOption.value 
                }));
              } else {
                console.warn(`No se encontró opción para ${field.id}:`, item[field.id]);
                // Conservar el valor original como fallback
                setFormData(prev => ({ 
                  ...prev, 
                  [field.id]: item[field.id] 
                }));
              }
            }
          })
          .catch(error => console.error(`Error cargando opciones para ${field.id}:`, error))
          .finally(() => setLoadingFields(prev => ({ ...prev, [field.id]: false })));
      }
    });
  }, [isOpen, effectiveFields, item]);

  useEffect(() => {
    if (!isOpen) return;

    const validateForm = () => {
      for (const field of effectiveFields) {
        if (field.required) {
          const value = formData[field.id];
          if (value === undefined || value === null || String(value).trim() === '') {
            setIsFormValid(false);
            return; // Exit early if any required field is empty
          }
        }
      }
      setIsFormValid(true); // All required fields are filled
    };

    validateForm();
  }, [formData, effectiveFields, isOpen]);

  const validateForm = () => {
    const newErrors = {};
    let isValid = true;
    
    effectiveFields.forEach(field => {
      if (field.required) {
        const value = formData[field.id];
        if (value === undefined || value === null || String(value).trim() === '') {
          newErrors[field.id] = `${field.label} es requerido`;
          isValid = false;
        }
      }
    });
    
    setErrors(newErrors);
    setIsFormValid(isValid);
    return isValid;
  };

  const handleChange = (id, value, type) => {
    setFormData(prev => ({
      ...prev,
      [id]: type === 'number' ? (value === '' ? '' : Number(value)) : value,
    }));
    // Clear error for the field being edited
    if (errors[id]) {
      setErrors(prev => ({ ...prev, [id]: null }));
    }
    validateForm();
  };

  const handleSelectChange = (id, value) => {
    setFormData(prev => ({ ...prev, [id]: value }));
    if (errors[id]) {
      setErrors(prev => ({ ...prev, [id]: null }));
    }
    validateForm();
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      onSave(formData);
    }
  };

  // Función para obtener información del campo (similar a ReceptionFormModal)
  const getField = (id) => {
    const field = effectiveFields.find(f => f.id === id) || { options: [] };
    
    // Si es un campo asyncSelect, usamos las opciones cargadas
    if (field.type === 'asyncSelect') {
      return {
        ...field,
        options: (asyncOptions[id] !== undefined ? asyncOptions[id] : (field.options || [])),
        loading: loadingFields[id] || false
      };
    }
    
    return field;
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        className={`bg-card p-6 rounded-lg shadow-xl w-full ${modalClassName || 'max-w-lg'} max-h-[90vh] overflow-y-auto border`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold text-foreground">{title}</h2>
          <Button variant="ghost" size="icon" onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-5 w-5" />
          </Button>
        </div>
        <form onSubmit={handleSubmit} className={twoColumns ? 'grid grid-cols-1 md:grid-cols-2 gap-4' : 'space-y-4'}>
          {effectiveFields.map(field => (
            <div key={field.id} className="space-y-1.5">
              <Label htmlFor={field.id} className="text-sm font-medium text-foreground">
                {field.label}
                {field.required && <span className="text-destructive"> *</span>}
              </Label>
              {field.type === 'select' && field.options ? (
                <>
                  <Select
                    value={(typeof formData[field.id] === 'boolean')
                      ? (formData[field.id] ? 'true' : 'false')
                      : (formData[field.id] || '')}
                    onValueChange={(value) => handleSelectChange(field.id, value)}
                  >
                    <SelectTrigger id={field.id} className={cn("w-full", { "border-destructive": errors[field.id] })}>
                      <SelectValue placeholder={`Seleccionar ${field.label.toLowerCase()}`} />
                    </SelectTrigger>
                    <SelectContent>
                      {field.options.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors[field.id] && <p className="text-sm font-medium text-destructive">{errors[field.id]}</p>}
                </>
              ) : field.type === 'asyncSelect' ? (
                <>
                  <Select 
                    onValueChange={(value) => {
                      const selectedOption = getField(field.id).options.find(opt => 
                        (opt.value.id && value === opt.value.id) || 
                        (opt.value === value)
                      );
                      if (selectedOption) {
                        handleSelectChange(field.id, selectedOption.value);
                      } else {
                        // Si no encuentra la opción, usar el valor directo
                        handleSelectChange(field.id, value);
                      }
                    }} 
                    value={formData[field.id]?.id || formData[field.id] || ''}
                    disabled={getField(field.id).loading}
                  >
                    <SelectTrigger 
                      id={field.id} 
                      className={cn("w-full", { "border-destructive": errors[field.id] })}
                    >
                      {getField(field.id).loading ? (
                        <div className="flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span>Cargando...</span>
                        </div>
                      ) : (
                        <SelectValue placeholder={`Seleccionar ${field.label.toLowerCase()}`}>
                          {/* Muestra el nombre si está disponible o cualquier representación disponible */}
                        </SelectValue>
                      )}
                    </SelectTrigger>
                    <SelectContent>
                      {getField(field.id).options.map(opt => (
                        <SelectItem key={opt.value?.id || opt.value} value={opt.value?.id || opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors[field.id] && <p className="text-sm font-medium text-destructive">{errors[field.id]}</p>}
                </>
              ) : (
                <>
                  <div className="relative">
                    <Input
                      id={field.id}
                      type={field.type === 'password' ? (passwordVisible[field.id] ? 'text' : 'password') : (field.type || 'text')}
                      value={formData[field.id] || ''}
                      onChange={(e) => handleChange(field.id, e.target.value, field.type)}
                      placeholder={field.label}
                      className={cn("bg-background border-border focus:border-primary pr-10", { "border-destructive": errors[field.id] })}
                    />
                    {field.type === 'password' && (
                      <button
                        type="button"
                        className="absolute inset-y-0 right-2 flex items-center text-muted-foreground hover:text-foreground"
                        onClick={() => setPasswordVisible(prev => ({ ...prev, [field.id]: !prev[field.id] }))}
                        aria-label={passwordVisible[field.id] ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                      >
                        {passwordVisible[field.id] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    )}
                  </div>
                  {errors[field.id] && <p className="text-sm font-medium text-destructive">{errors[field.id]}</p>}
                </>
              )}
            </div>
          ))}
          <div className="flex justify-end space-x-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground" disabled={!isFormValid}>
              {item ? 'Guardar Cambios' : 'Crear'}
            </Button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};

export default DynamicFormModal;