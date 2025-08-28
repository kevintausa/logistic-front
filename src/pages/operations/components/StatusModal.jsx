import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { CheckCircle2, XCircle } from 'lucide-react';

const StatusModal = ({ isOpen, onClose, operation, onApprove, onReject }) => {
  if (!isOpen) return null;
  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <div className="absolute inset-0 bg-black/50" onClick={onClose} />
        <motion.div
          className="relative w-full max-w-lg"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 10, opacity: 0 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Estatus de la operación</CardTitle>
              <CardDescription>
                Operación {operation?.codigo || operation?._id}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Registra el resultado de la oferta para continuar con la trazabilidad de la mercancía.
                </p>
                <div className="flex gap-3 flex-wrap">
                  <Button onClick={onApprove} className="bg-emerald-600 hover:bg-emerald-700">
                    <CheckCircle2 className="h-4 w-4 mr-2" /> Aprobada la oferta
                  </Button>
                  <Button onClick={onReject} variant="destructive" className="bg-red-600 hover:bg-red-700">
                    <XCircle className="h-4 w-4 mr-2" /> Rechazada la oferta
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default StatusModal;
