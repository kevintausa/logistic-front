import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
// Eliminamos la importación de Textarea ya que no está disponible y no lo estamos usando
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { CheckCircle, AlertTriangle, Plus, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const tiposRechazo = [
  { value: 'sin_rechazo', label: 'Sin Rechazo' },
  { value: 'arrastre', label: 'Arrastre' },
  { value: 'cloro', label: 'Amarilla' },
  { value: 'grasa', label: 'Grasa' },
  { value: 'tintas', label: 'Tintas' },
  { value: 'oxido', label: 'Oxido' },
  { value: 'otro', label: 'Otro' }
];

const FinalizarLavadoModal = ({ isOpen, onClose, onSave, item }) => {
  // Estados
  const [rechazos, setRechazos] = useState([
    { tipo: 'sin_rechazo', kilos: 0, observaciones: '' }
  ]);
  const [error, setError] = useState('');
  const [calculosValid, setCalculosValid] = useState(true);

  // Valores derivados
  const pesoOriginal = item?.pesoKg || 0;
  const totalRechazo = rechazos.reduce((sum, r) => sum + (parseFloat(r.kilos) || 0), 0);
  // Cálculo automático de kilos limpios como pesoOriginal - totalRechazo
  const kilosLimpios = Math.max(0, parseFloat((pesoOriginal - totalRechazo).toFixed(2)));
  const kilosTotales = kilosLimpios + totalRechazo;
  const diferenciaKilos = parseFloat((pesoOriginal - kilosTotales).toFixed(2));
  const porcentajeLimpios = pesoOriginal > 0 ? Math.round((kilosLimpios / pesoOriginal) * 100) : 0;
  const porcentajeRechazo = pesoOriginal > 0 ? Math.round((totalRechazo / pesoOriginal) * 100) : 0;

  // Efecto para inicializar rechazos cuando se abre el modal
  useEffect(() => {
    if (isOpen && item) {
      setRechazos([
        { tipo: 'sin_rechazo', kilos: 0, observaciones: '' }
      ]);
    }
  }, [isOpen, item]);

  // Efecto para validar cálculos
  useEffect(() => {
    // Tolerancia de 0.1kg para errores de redondeo
    const esValido = Math.abs(diferenciaKilos) <= 0.1;
    setCalculosValid(esValido);

    if (!esValido) {
      if (diferenciaKilos > 0.1) {
        setError(`Faltan ${diferenciaKilos}kg por distribuir. La suma debe ser igual al peso original.`);
      } else if (diferenciaKilos < -0.1) {
        setError(`Excedido por ${Math.abs(diferenciaKilos)}kg. La suma no puede ser mayor al peso original.`);
      }
    } else {
      setError('');
    }
  }, [totalRechazo, pesoOriginal, diferenciaKilos]);

  // Manejadores

  // Manejar cambios en los rechazos
  const handleRechazoChange = (index, field, value) => {
    const newRechazos = [...rechazos];
    newRechazos[index] = { ...newRechazos[index], [field]: value };
    setRechazos(newRechazos);
  };

  // Añadir un nuevo rechazo
  const handleAddRechazo = () => {
    setRechazos([...rechazos, { tipo: '', kilos: 0, observaciones: '' }]);
  };

  // Eliminar un rechazo
  const handleRemoveRechazo = (index) => {
    if (rechazos.length > 1) {
      const newRechazos = [...rechazos];
      newRechazos.splice(index, 1);
      setRechazos(newRechazos);
    }
  };

  // Validar si hay rechazos incompletos o inválidos
  const hayRechazosIncompletos = () => {
    // Si hay exactamente un rechazo con tipo vacío o "sin_rechazo" y 0 kilos, lo consideramos como "sin rechazos" (válido)
    if (rechazos.length === 1 && 
        (rechazos[0].tipo === '' || rechazos[0].tipo === 'sin_rechazo') && 
        parseFloat(rechazos[0].kilos) === 0) {
      return false;
    }
    
    // Verificar si hay algún rechazo incompleto
    return rechazos.some(r => {
      // Si es "sin_rechazo", debe tener 0 kilos
      if (r.tipo === 'sin_rechazo') {
        return parseFloat(r.kilos) !== 0;
      }
      // Caso normal: debe tener tipo y kilos > 0
      return (r.tipo && r.tipo !== 'sin_rechazo' && !parseFloat(r.kilos)) || // Tiene tipo pero no kilos
             (!r.tipo && parseFloat(r.kilos) > 0) || // Tiene kilos pero no tipo
             (r.tipo === '' && parseFloat(r.kilos) === 0 && rechazos.length > 1); // Rechazos vacíos adicionales (después del primero)
    });
  };

  const handleSubmit = () => {
    rechazos.forEach((rechazo) => {
      rechazo.kilos = Number(rechazo.kilos);
    });
    
    // Filtrar rechazos con kilos > 0 y tipo seleccionado
    const rechazosValidos = rechazos.filter(
      r => (parseFloat(r.kilos) > 0) && r.tipo
    );

    if (!calculosValid) {
      setError('No se puede guardar. La suma de kilos limpios y rechazos debe ser igual al peso original.');
      return;
    }
    
    if (hayRechazosIncompletos()) {
      setError('No se puede guardar. Todos los rechazos deben tener tipo y kilos o ser eliminados.');
      return;
    }

    onSave({
      kilosLimpios: parseFloat(kilosLimpios),
      rechazos: rechazosValidos
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Finalizar Lavado</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Información de la recepción */}
          <div className="bg-primary/5 p-3 rounded-md">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div><span className="font-medium">Lote:</span> {item?.numeroLote}</div>
              <div><span className="font-medium">Cliente:</span> {item?.cliente?.nombre}</div>
              <div><span className="font-medium">Tipo de prenda:</span> {item?.tipoPrenda?.nombre}</div>
              <div><span className="font-medium">Peso original:</span> {item?.pesoKg} kg</div>
            </div>
          </div>

          {/* Input para kilos limpios (calculado automáticamente) */}
          <div className="space-y-2">
            <Label htmlFor="kilosLimpios">Kilos limpios (calculado automáticamente)</Label>
            <div className="flex items-center gap-2">
              <Input
                id="kilosLimpios"
                type="number"
                min="0"
                max={pesoOriginal}
                step="0.1"
                value={kilosLimpios}
                readOnly
                className="bg-gray-100 border-gray-200 text-gray-700 font-medium"
              />
              <div className="text-xs text-gray-500">
                <span className="font-medium">{porcentajeLimpios}%</span> del total
              </div>
            </div>
          </div>

          <Separator className="my-4" />

          {/* Sección de rechazos */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <div className="flex items-center">
                <div className="w-5 h-5 rounded-full bg-rose-500/20 flex items-center justify-center mr-2">
                  <AlertTriangle className="w-3 h-3 text-rose-600" />
                </div>
                <h3 className="text-sm font-medium">Rechazos</h3>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="flex items-center gap-1 text-xs h-7 px-2 py-1 text-rose-600 border-rose-200 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-300"
                onClick={handleAddRechazo}
              >
                <Plus className="w-3 h-3" /> Añadir rechazo
              </Button>
            </div>

            <div className="space-y-4">
              <AnimatePresence>
                {rechazos.map((rechazo, index) => (
                  <motion.div
                    key={index}
                    className="grid grid-cols-12 gap-2 items-start p-3 rounded-md border border-rose-100 shadow-sm"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="col-span-4">
                      <Label htmlFor={`tipo-${index}`} className="text-xs mb-1 block">
                        Tipo de rechazo
                      </Label>
                      <Select
                        value={rechazo.tipo}
                        onValueChange={(value) => handleRechazoChange(index, 'tipo', value)}
                      >
                        <SelectTrigger id={`tipo-${index}`}>
                          <SelectValue placeholder="Tipo de rechazo" />
                        </SelectTrigger>
                        <SelectContent>
                          {tiposRechazo.map((tipo) => (
                            <SelectItem key={tipo.value} value={tipo.value}>
                              {tipo.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="col-span-3">
                      <Label htmlFor={`kilos-${index}`} className="text-xs mb-1 block">
                        Kilos
                      </Label>
                      {/* Usamos input de texto para permitir punto y coma */}
                      <Input
                        id={`kilos-${index}`}
                        type="text"
                        placeholder="0.0"
                        value={rechazo.kilos}
                        onChange={(e) => {
                          const inputValue = e.target.value.replace(/[^0-9.,]/g, '');
                          handleRechazoChange(index, 'kilos', inputValue);
                        }}
                      />
                    </div>

                    <div className="col-span-4">
                      <Label htmlFor={`observaciones-${index}`} className="text-xs mb-1 block">
                        Observaciones
                      </Label>
                      <Input
                        id={`observaciones-${index}`}
                        value={rechazo.observaciones}
                        onChange={(e) => handleRechazoChange(index, 'observaciones', e.target.value)}
                      />
                    </div>

                    <div className="col-span-1 flex items-end justify-center pb-1">
                      {rechazos.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition-colors duration-200"
                          onClick={() => handleRemoveRechazo(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>

          <Separator className="my-4" />

          {/* Resumen */}
          <div className="bg-muted/30 p-4 rounded-md">
            <h3 className="text-sm font-medium mb-2">Resumen</h3>
            <div className="grid grid-cols-2 gap-x-6 gap-y-2">
              <div className="flex justify-between">
                <span className="text-sm">Peso original:</span>
                <span className="font-medium">{pesoOriginal} kg</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Kilos limpios:</span>
                <span className="font-medium">{kilosLimpios} kg ({porcentajeLimpios}%)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Total rechazo:</span>
                <span className="font-medium">{totalRechazo} kg ({porcentajeRechazo}%)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Total procesado:</span>
                <span className={`font-medium ${calculosValid ? 'text-green-600' : 'text-red-600'}`}>
                  {kilosTotales} kg
                </span>
              </div>
            </div>

            <AnimatePresence>
              {!calculosValid && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mt-3 flex items-center text-red-600 bg-red-50 p-2 rounded"
                >
                  <AlertTriangle className="h-4 w-4 mr-1" />
                  <span className="text-xs">{error}</span>
                </motion.div>
              )}

              {calculosValid && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mt-3 flex items-center text-green-600 bg-green-50 p-2 rounded"
                >
                  <CheckCircle className="h-4 w-4 mr-1" />
                  <span className="text-xs">Los valores están balanceados correctamente.</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!calculosValid || kilosLimpios <= 0 || hayRechazosIncompletos()}
          >
            Finalizar Lavado
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default FinalizarLavadoModal;
