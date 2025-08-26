import React from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const formatDate = (dateString) => {
  if (!dateString) return '';
  try {
    return format(new Date(dateString), 'PPP', { locale: es });
  } catch (e) {
    return dateString;
  }
};

const formatValue = (field, value) => {
  if (!value) return '';
  
  if (field.type === 'daterange') {
    const from = value.$gte ? new Date(value.$gte) : null;
    const to = value.$lte ? new Date(value.$lte) : null;
    
    if (from && to) {
      return `${format(from, 'd MMM yyyy', { locale: es })} - ${format(to, 'd MMM yyyy', { locale: es })}`;
    } else if (from) {
      return `Desde ${format(from, 'd MMM yyyy', { locale: es })}`;
    } else if (to) {
      return `Hasta ${format(to, 'd MMM yyyy', { locale: es })}`;
    }
  }
  
  if (field.type === 'select') {
    const option = field.options?.find(opt => opt.value === value);
    return option?.label || value;
  }
  
  return value.toString();
};

const AppliedFilters = ({ filters, fields, onRemoveFilter }) => {
  if (!filters || Object.keys(filters).length === 0) {
    return null;
  }

  const getFieldById = (id) => fields.find(field => field.id === id);

  return (
    <div className="flex flex-wrap gap-2 mb-4">
      {Object.entries(filters).map(([key, value]) => {
        if (!value) return null;
        
        // Manejar rangos de fechas
        if (typeof value === 'object' && (value.$gte || value.$lte)) {
          const field = getFieldById(key);
          if (!field) return null;
          
          return (
            <div 
              key={key}
              className="inline-flex items-center gap-2 px-3 py-1 text-sm font-medium rounded-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200"
            >
              <span className="font-semibold">{field.label}:</span>
              <span>{formatValue(field, value)}</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5 p-0 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
                onClick={(e) => {
                  e.stopPropagation();
                  onRemoveFilter(key);
                }}
                aria-label={`Eliminar filtro de ${field.label}`}
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          );
        }
        
        // Manejar otros tipos de filtros
        const field = getFieldById(key);
        if (!field) return null;
        
        return (
          <div 
            key={key}
            className="inline-flex items-center gap-2 px-3 py-1 text-sm font-medium rounded-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200"
          >
            <span className="font-semibold">{field.label}:</span>
            <span>{formatValue(field, value)}</span>
            <Button
              variant="ghost"
              size="icon"
              className="h-5 w-5 p-0 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
              onClick={(e) => {
                e.stopPropagation();
                onRemoveFilter(key);
              }}
              aria-label={`Eliminar filtro de ${field.label}`}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        );
      })}
    </div>
  );
};

export default AppliedFilters;
