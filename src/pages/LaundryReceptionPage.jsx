import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PlusCircle, Edit, Trash2, Camera, FileText, Shirt, Package, Weight } from 'lucide-react';
import { useData } from '@/contexts/DataContext';
import { useToast } from "@/components/ui/use-toast";

const ReceptionForm = ({ reception, onSubmit, onCancel }) => {
  const { clients } = useData();
  const [date, setDate] = useState(reception?.date || new Date().toISOString().split('T')[0]);
  const [clientId, setClientId] = useState(reception?.clientId || '');
  const [garments, setGarments] = useState(reception?.garments || '');
  const [kilos, setKilos] = useState(reception?.kilos || '');
  const [photoUrl, setPhotoUrl] = useState(reception?.photoUrl || null);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!clientId) {
        alert("Por favor, seleccione un cliente.");
        return;
    }
    onSubmit({ date, clientId, garments: parseInt(garments), kilos: parseFloat(kilos), photoUrl });
  };
  
  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoUrl(reader.result); 
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="rec-date" className="text-primary-foreground/80">Fecha de Recepción</Label>
          <Input id="rec-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} required className="bg-background/50 border-border focus:border-primary" />
        </div>
        <div>
          <Label htmlFor="rec-client" className="text-primary-foreground/80">Cliente Asociado</Label>
          <Select value={clientId} onValueChange={setClientId}>
            <SelectTrigger id="rec-client" className="w-full bg-background/50 border-border focus:border-primary">
              <SelectValue placeholder="Seleccionar cliente" />
            </SelectTrigger>
            <SelectContent className="bg-popover text-popover-foreground">
              {clients.map(cli => (
                <SelectItem key={cli.id} value={cli.id}>{cli.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="rec-garments" className="text-primary-foreground/80">Cantidad de Prendas</Label>
          <Input id="rec-garments" type="number" value={garments} onChange={(e) => setGarments(e.target.value)} placeholder="Ej: 150" required className="bg-background/50 border-border focus:border-primary" />
        </div>
        <div>
          <Label htmlFor="rec-kilos" className="text-primary-foreground/80">Peso en Kilos</Label>
          <Input id="rec-kilos" type="number" step="0.1" value={kilos} onChange={(e) => setKilos(e.target.value)} placeholder="Ej: 25.5" required className="bg-background/50 border-border focus:border-primary" />
        </div>
      </div>
      <div>
        <Label htmlFor="rec-photo" className="text-primary-foreground/80">Registro Fotográfico (Opcional)</Label>
        <div className="flex items-center gap-2">
            <Input id="rec-photo" type="file" onChange={handlePhotoUpload} className="bg-background/50 border-border focus:border-primary flex-grow" accept="image/*" />
            <Button type="button" variant="outline" size="icon" className="border-primary text-primary hover:bg-primary/10">
            <Camera className="h-5 w-5" />
            </Button>
        </div>
        {photoUrl && <img  src={photoUrl} alt="Vista previa" class="mt-2 max-h-32 rounded" src="https://images.unsplash.com/photo-1595872018818-97555653a011" />}
      </div>
      <DialogFooter>
        <DialogClose asChild>
            <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
        </DialogClose>
        <Button type="submit" className="bg-green-600 hover:bg-green-700 text-white">
          <FileText className="mr-2 h-5 w-5" /> Guardar Recepción
        </Button>
      </DialogFooter>
    </form>
  );
};

const LaundryReceptionPage = () => {
  const { laundryReceptions, laundryReceptionActions, clients } = useData();
  const { toast } = useToast();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingReception, setEditingReception] = useState(null);

  const handleAddReception = () => {
    setEditingReception(null);
    setIsFormOpen(true);
  };

  const handleEditReception = (reception) => {
    toast({ title: "Info", description: "La edición de recepciones aún no está implementada para mantener la integridad de las facturas y el inventario. Puede eliminar y crear una nueva." });
  };

  const handleDeleteReception = (id) => {
    const reception = laundryReceptions.find(r => r.id === id);
    if (reception) {
      // Revert inventory change
      laundryReceptionActions.delete(id); // this will internally call clientActions.updateInventory if set up
      // This might require a more complex logic if items can be partially returned, etc.
      // For now, simple deletion and toast
       toast({ title: "Recepción Eliminada", description: `La recepción ${id} ha sido eliminada. Ajuste el inventario manualmente si es necesario.` });
    }
  };

  const handleFormSubmit = (data) => {
    if (editingReception) {
      laundryReceptionActions.update(editingReception.id, data);
    } else {
      laundryReceptionActions.create(data);
    }
    setIsFormOpen(false);
    setEditingReception(null);
  };

  const getClientName = (clientId) => {
    const client = clients.find(cli => cli.id === clientId);
    return client ? client.name : 'Cliente Desconocido';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold gradient-text">Registro de Ropa Recibida y Facturación</h1>
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
            <DialogTrigger asChild>
                <Button onClick={handleAddReception} className="bg-primary hover:bg-primary/90 text-primary-foreground w-full sm:w-auto">
                    <PlusCircle className="mr-2 h-5 w-5" /> Nueva Recepción
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg bg-card border-border">
                <DialogHeader>
                    <DialogTitle className="text-primary-foreground">{editingReception ? 'Editar' : 'Registrar Nueva'} Recepción de Ropa</DialogTitle>
                    <DialogDescription className="text-muted-foreground">
                         {editingReception ? 'Modifica los detalles.' : 'Completa los detalles de la entrega.'}
                    </DialogDescription>
                </DialogHeader>
                <ReceptionForm
                    reception={editingReception}
                    onSubmit={handleFormSubmit}
                    onCancel={() => { setIsFormOpen(false); setEditingReception(null); }}
                />
            </DialogContent>
        </Dialog>
      </div>
      
      <p className="text-muted-foreground">
        Registra ropa recibida de clientes, incluyendo fecha, cantidad, peso y fotos. Se generará una factura y se actualizará el inventario.
      </p>

      {laundryReceptions.length === 0 ? (
        <div className="card-gradient-bg p-8 rounded-lg shadow-xl text-center">
            <img  alt="Pilas de ropa limpia y doblada" class="w-full md:w-3/4 lg:w-1/2 mx-auto mb-4 rounded" src="https://images.unsplash.com/photo-1619032209422-fc090f6a3f5f" />
            <h2 className="text-2xl font-semibold text-primary-foreground mb-2">No hay recepciones registradas.</h2>
            <p className="text-muted-foreground mb-4">Comienza registrando la primera recepción de ropa.</p>
            <Button onClick={handleAddReception} variant="secondary">
                <PlusCircle className="mr-2 h-5 w-5" /> Registrar Recepción
            </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {laundryReceptions.map((rec) => (
            <motion.div key={rec.id} layout>
                <Card className="card-gradient-bg shadow-lg hover:shadow-purple-500/30 transition-shadow duration-300">
                <CardHeader>
                    <CardTitle className="text-primary-foreground text-lg sm:text-xl flex flex-col sm:flex-row justify-between items-start sm:items-center">
                        <span>Cliente: {getClientName(rec.clientId)}</span>
                        <span className="text-sm text-muted-foreground mt-1 sm:mt-0">Factura: {rec.invoiceId}</span>
                    </CardTitle>
                    <CardDescription className="text-muted-foreground">Fecha: {new Date(rec.date).toLocaleDateString()}</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-4 text-sm">
                    <div className="flex items-center text-primary-foreground/80"><Shirt className="mr-2 h-4 w-4 text-accent" /> Prendas: {rec.garments}</div>
                    <div className="flex items-center text-primary-foreground/80"><Weight className="mr-2 h-4 w-4 text-accent" /> Kilos: {rec.kilos}</div>
                    {rec.photoUrl && <img  src={rec.photoUrl} alt={`Foto recepción ${rec.id}`} class="max-h-16 rounded col-span-2 sm:col-span-1 mt-2 sm:mt-0" src="https://images.unsplash.com/photo-1666697821630-07d7bd46f75a" />}
                </CardContent>
                 <CardFooter className="flex justify-end gap-2 pt-4">
                    <Button variant="outline" size="sm" onClick={() => handleEditReception(rec)} className="border-blue-500 text-blue-500 hover:bg-blue-500/10">
                        <Edit className="mr-1 h-4 w-4" /> Editar
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleDeleteReception(rec.id)} className="border-red-500 text-red-500 hover:bg-red-500/10">
                        <Trash2 className="mr-1 h-4 w-4" /> Eliminar
                    </Button>
                </CardFooter>
                </Card>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
};

export default LaundryReceptionPage;