
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X } from 'lucide-react';

const ItemModal = ({ isOpen, onClose, onSave, item, fields, title, mode }) => {
  const [formData, setFormData] = useState({});

  useEffect(() => {
    if (mode === 'edit' && item) {
      setFormData(item);
    } else {
      const initialData = {};
      fields.forEach(field => {
        initialData[field.id] = field.type === 'number' ? 0 : '';
      });
      setFormData(initialData);
    }
  }, [item, fields, mode]);

  const handleChange = (id, value, type) => {
    setFormData(prev => ({
      ...prev,
      [id]: type === 'number' ? (value === '' ? '' : Number(value)) : value,
    }));
  };

  const handleSelectChange = (id, value) => {
    setFormData(prev => ({
      ...prev,
      [id]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  if (!isOpen) return null;

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
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        className="bg-card p-6 rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold text-foreground">{title}</h2>
          <Button variant="ghost" size="icon" onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-5 w-5" />
          </Button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          {fields.map(field => (
            <div key={field.id} className="space-y-1.5">
              <Label htmlFor={field.id} className="text-sm font-medium text-foreground">
                {field.label}
              </Label>
              {field.type === 'select' && field.options ? (
                 <Select
                    value={formData[field.id] || ''}
                    onValueChange={(value) => handleSelectChange(field.id, value)}
                  >
                    <SelectTrigger id={field.id} className="w-full">
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
              ) : (
                <Input
                  id={field.id}
                  type={field.type || 'text'}
                  value={formData[field.id] || ''}
                  onChange={(e) => handleChange(field.id, e.target.value, field.type)}
                  placeholder={field.label}
                  className="bg-background border-border focus:border-primary"
                />
              )}
            </div>
          ))}
          <div className="flex justify-end space-x-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground">
              {mode === 'create' ? 'Crear' : 'Guardar Cambios'}
            </Button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};

export default ItemModal;
