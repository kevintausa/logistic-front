import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Eye } from 'lucide-react';
import { motion } from 'framer-motion';

// Mapeo de tipos de rechazo a etiquetas
const tiposRechazoMap = {
  'arrastre': 'Arrastre',
  'cloro': 'Amarilla',
  'grasa': 'Grasa',
  'tintas': 'Tintas',
  'oxido': 'Oxido',
  'otro': 'Otro'
};

const VerRechazosModal = ({ isOpen, onClose, item }) => {
  if (!item || !item.rechazos) return null;
  
  const rechazos = item.rechazos || [];
  const pesoOriginal = item?.pesoKg || 0;
  const kilosLimpios = item?.kilosLimpios || 0;
  const totalRechazo = item?.totalRechazoKilos || 0;
  
  const porcentajeLimpios = pesoOriginal > 0 ? Math.round((kilosLimpios / pesoOriginal) * 100) : 0;
  const porcentajeRechazo = pesoOriginal > 0 ? Math.round((totalRechazo / pesoOriginal) * 100) : 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5 text-amber-500" />
            Detalles de Rechazos
            <span className="text-sm font-normal text-muted-foreground ml-2">
              Lote: {item.numeroLote}
            </span>
          </DialogTitle>
        </DialogHeader>
        <div className="py-2">
          <div className="bg-muted/30 p-4 rounded-md mb-4">
            <h3 className="text-sm font-medium mb-2">Resumen de Lavado</h3>
            <div className="grid grid-cols-2 gap-x-6 gap-y-2">
              <div className="flex justify-between">
                <span className="text-sm">Peso original:</span>
                <span className="font-medium">{pesoOriginal} kg</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Kilos limpios:</span>
                <span className="font-medium text-green-600">{kilosLimpios} kg ({porcentajeLimpios}%)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Total rechazo:</span>
                <span className="font-medium text-rose-600">{totalRechazo} kg ({porcentajeRechazo}%)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Fecha finalización:</span>
                <span className="font-medium">{new Date(item.fechaFinalizacion).toLocaleString()}</span>
              </div>
            </div>
          </div>

          <h3 className="text-sm font-medium mb-2">Detalle de Rechazos</h3>
          <div className="space-y-3 bg-inherit">
            {rechazos.map((rechazo, index) => (
              <motion.div 
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-inherit border  rounded-md p-3 bg-blue-50"
              >
                <div className="flex items-center justify-between bg-inherit  ">
                  <div className="flex items-center gap-2 ">
                    <Eye className="h-4 w-4 text-amber-500" />
                    <h4 className="font-medium">{tiposRechazoMap[rechazo.tipo] || rechazo.tipo}</h4>
                  </div>
                  <div className="text-right ">
                    <span className="text-rose-600 font-medium">{rechazo.kilos} kg</span>
                    <span className="text-xs text-muted-foreground ml-1">
                      ({rechazo.porcentaje || Math.round(rechazo.kilos / pesoOriginal * 100)}%)
                    </span>
                  </div>
                </div>
                
                {rechazo.observaciones && (
                  <div className="mt-1 text-sm text-muted-foreground">
                    {rechazo.observaciones}
                  </div>
                )}
              </motion.div>
            ))}
            
            {rechazos.length === 0 && (
              <div className="text-center py-6 text-muted-foreground">
                No hay información de rechazos disponible
              </div>
            )}
          </div>
        </div>

        <Separator className="my-2" />
        
        <DialogFooter>
          <Button onClick={onClose}>
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default VerRechazosModal;
