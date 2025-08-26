import React from 'react';
import { motion } from 'framer-motion';
import { Filter, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';

const FilterPanel = ({ filters, values, onChange, onClose }) => {

  const handleReset = () => {
    filters.forEach(filter => {
      onChange(filter.id, null);
    });
  };

  return (
    <div className="filter-container h-full flex flex-col">
      <div className="flex justify-between items-center mb-6 p-4 border-b">
        <div className="flex items-center">
          <Filter className="h-6 w-6 mr-3 text-primary" />
          <h2 className="text-xl font-semibold">Filtros</h2>
        </div>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={onClose}
        >
          <X className="h-5 w-5" />
        </Button>
      </div>

      <motion.div 
        className="filter-grid flex-grow overflow-y-auto px-4 pb-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        {filters.map((filter) => (
          <div key={filter.id} className="filter-item mb-6">
            <Label htmlFor={filter.id} className="text-md mb-2 block">{filter.label}</Label>
            {renderFilterInput(filter, values[filter.id], (value) => {
              onChange(filter.id, value);
            })}
          </div>
        ))}
      </motion.div>

      <div className="p-4 border-t mt-auto">
        <Button 
          variant="outline" 
          className="w-full"
          onClick={handleReset}
        >
          <X className="h-4 w-4 mr-2" />
          Limpiar Filtros
        </Button>
      </div>
    </div>
  );
};

const renderFilterInput = (filter, value, onChange) => {
  switch (filter.type) {
    case 'text':
      return (
        <Input
          id={filter.id}
          placeholder={filter.placeholder || `Buscar por ${filter.label.toLowerCase()}`}
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          className="w-full"
        />
      );
    
    case 'select':
      return (
        <Select
          value={value || ''}
          onValueChange={onChange}
        >
          <SelectTrigger>
            <SelectValue placeholder={filter.placeholder || `Seleccionar ${filter.label.toLowerCase()}`} />
          </SelectTrigger>
          <SelectContent>
            {filter.options.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    
    case 'multiselect':
      return (
        <div className="space-y-2 max-h-40 overflow-y-auto p-2 border rounded-md bg-background">
          {filter.options.map((option) => (
            <div key={option.value} className="flex items-center space-x-2 p-1 hover:bg-accent rounded-md">
              <Checkbox
                id={`${filter.id}-${option.value}`}
                checked={(value || []).includes(option.value)}
                onCheckedChange={(checked) => {
                  const newValue = [...(value || [])];
                  if (checked) {
                    newValue.push(option.value);
                  } else {
                    const index = newValue.indexOf(option.value);
                    if (index !== -1) {
                      newValue.splice(index, 1);
                    }
                  }
                  onChange(newValue);
                }}
              />
              <Label htmlFor={`${filter.id}-${option.value}`} className="text-sm font-normal cursor-pointer flex-grow">
                {option.label}
              </Label>
            </div>
          ))}
        </div>
      );
    
    case 'range':
      const rangeValue = value || [filter.min, filter.max];
      return (
        <div className="space-y-4 pt-2">
          <Slider
            value={rangeValue}
            min={filter.min}
            max={filter.max}
            step={filter.step || 1}
            onValueChange={onChange}
          />
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>{rangeValue[0]}</span>
            <span>{rangeValue[1]}</span>
          </div>
        </div>
      );
    
    default:
      return null;
  }
};

export default FilterPanel;
