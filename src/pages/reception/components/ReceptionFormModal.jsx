import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const ReceptionFormModal = ({ isOpen, onClose, onSave, item, fields, title }) => {
  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState({});
  const [asyncOptions, setAsyncOptions] = useState({});
  const [loadingFields, setLoadingFields] = useState({});

  // Inicializa los datos del formulario
  useEffect(() => {
    if (!isOpen) return;
    
    const initialData = fields.reduce((acc, field) => {
      // Para campos que no son asyncSelect, simplemente copiar el valor
      if (field.type !== 'asyncSelect') {
        acc[field.id] = item ? item[field.id] : '';
      }
      return acc;
    }, {});
    
    setFormData(initialData);
    setErrors({});
  }, [isOpen, item, fields]);
  
  // Manejo de opciones asíncronas
  useEffect(() => {
    if (!isOpen) return;
    
    fields.forEach(field => {
      if (field.type === 'asyncSelect' && field.fetchOptions) {
        setLoadingFields(prev => ({ ...prev, [field.id]: true }));
        
        field.fetchOptions()
          .then(options => {
            setAsyncOptions(prev => ({ ...prev, [field.id]: options }));
            
            if (item && item[field.id]) {
              let selectedOption;
              
              // Busca la opción correspondiente basada en la estructura del objeto
              if (item[field.id] && item[field.id].id) {
                // Si es un objeto con id y nombre (como lavandería)
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
              }
            }
          })
          .catch(error => console.error(`Error cargando opciones para ${field.id}:`, error))
          .finally(() => setLoadingFields(prev => ({ ...prev, [field.id]: false })));
      }
    });
  }, [isOpen, fields, item]);

  const handleChange = (id, value) => {
    // Para campos tipo asyncSelect, asegurémonos de usar el objeto completo
    const field = fields.find(f => f.id === id);
    
    setFormData(prev => ({ ...prev, [id]: value }));
    if (errors[id]) {
      setErrors(prev => ({ ...prev, [id]: null }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  if (!isOpen) return null;

  const getField = (id) => {
    const field = fields.find(f => f.id === id) || { options: [] };
    
    // Si es un campo asyncSelect, usamos las opciones cargadas
    if (field.type === 'asyncSelect') {
      return {
        ...field,
        options: asyncOptions[id] || [],
        loading: loadingFields[id] || false
      };
    }
    
    return field;
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-[#545558] p-8 rounded-xl shadow-2xl w-full max-w-4xl max-h-[95vh] overflow-y-auto border border-white/20"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold text-foreground">{title}</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Empleado */}
          <div>
            <Label htmlFor="empleado">Lavador</Label>
            <Select 
              onValueChange={(value) => handleChange('empleado', value)} 
              value={formData.empleado?.id || formData.empleado || ''}
              disabled={getField('empleado').loading}
            >
              <SelectTrigger>
                {getField('empleado').loading ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Cargando...</span>
                  </div>
                ) : (
                  <SelectValue placeholder="Seleccione un lavador" />
                )}
              </SelectTrigger>
              <SelectContent>
                {getField('empleado').options.map(opt => (
                  <SelectItem key={opt.value?.id || opt.value} value={opt.value?.id || opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {/* Cliente */}
          <div>
            <Label htmlFor="cliente">Cliente</Label>
            <Select 
              onValueChange={(value) => handleChange('cliente', value)} 
              value={formData.cliente?.id || formData.cliente || ''}
              disabled={getField('cliente').loading}
            >
              <SelectTrigger>
                {getField('cliente').loading ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Cargando...</span>
                  </div>
                ) : (
                  <SelectValue placeholder="Seleccione un cliente" />
                )}
              </SelectTrigger>
              <SelectContent>
                {getField('cliente').options.map(opt => (
                  <SelectItem key={opt.value?.id || opt.value} value={opt.value?.id || opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {/* Tipo de Prenda */}
          <div>
            <Label htmlFor="tipoPrenda">Tipo de Prenda</Label>
            <Select 
              onValueChange={(value) => handleChange('tipoPrenda', value)} 
              value={formData.tipoPrenda?.id || formData.tipoPrenda || ''}
              disabled={getField('tipoPrenda').loading}
            >
              <SelectTrigger>
                {getField('tipoPrenda').loading ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Cargando...</span>
                  </div>
                ) : (
                  <SelectValue placeholder="Seleccione un tipo de prenda" />
                )}
              </SelectTrigger>
              <SelectContent>
                {getField('tipoPrenda').options.map(opt => (
                  <SelectItem key={opt.value?.id || opt.value} value={opt.value?.id || opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {/* Maquina */}
          <div>
            <Label htmlFor="maquina">Lavadora</Label>
            <Select 
              onValueChange={(value) => handleChange('maquina', value)} 
              value={formData.maquina?.id || formData.maquina || ''}
              disabled={getField('maquina').loading}
            >
              <SelectTrigger>
                {getField('maquina').loading ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Cargando...</span>
                  </div>
                ) : (
                  <SelectValue placeholder="Seleccione una lavadora" />
                )}
              </SelectTrigger>
              <SelectContent>
                {getField('maquina').options.map(opt => (
                  <SelectItem key={opt.value?.id || opt.value} value={opt.value?.id || opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Programa de Lavado */}
          <div>
            <Label htmlFor="programaLavado">Programa de Lavado</Label>
            <Select 
              onValueChange={(value) => handleChange('programaLavado', value)} 
              value={formData.programaLavado?.id || formData.programaLavado || ''}
              disabled={getField('programaLavado').loading}
            >
              <SelectTrigger>
                {getField('programaLavado').loading ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Cargando...</span>
                  </div>
                ) : (
                  <SelectValue placeholder="Seleccione un programa" />
                )}
              </SelectTrigger>
              <SelectContent>
                {getField('programaLavado').options.map(opt => (
                  <SelectItem key={opt.value?.id || opt.value} value={opt.value?.id || opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {/* Peso (Kg) */}
          <div>
            <Label htmlFor="pesoKg">Peso (Kg)</Label>
            <Input id="pesoKg" type="number" value={formData.pesoKg || ''} onChange={(e) => handleChange('pesoKg', e.target.value)} />
          </div>

          {/* Observaciones */}
          <div className="md:col-span-2">
            <Label htmlFor="observaciones">Observaciones</Label>
            <Input id="observaciones" value={formData.observaciones || ''} onChange={(e) => handleChange('observaciones', e.target.value)} />
          </div>

          <div className="md:col-span-2 flex justify-end space-x-4 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit">{item ? 'Guardar Cambios' : 'Crear'}</Button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};

export default ReceptionFormModal;
