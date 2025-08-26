import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PlusCircle, Edit, Trash2, Camera, FileText, PackageSearch, PackageCheck, FolderArchive as ArchiveBox } from 'lucide-react';
import { useData } from '@/contexts/DataContext';
import { useToast } from "@/components/ui/use-toast";

const ReturnForm = ({ returnEntry, onSubmit, onCancel }) => {
  const { clients } = useData();
  const [date, setDate] = useState(returnEntry?.date || new Date().toISOString().split('T')[0]);
  const [clientId, setClientId] = useState(returnEntry?.clientId || '');
  const [garmentsReturned, setGarmentsReturned] = useState(returnEntry?.garmentsReturned || '');
  const [photoUrl, setPhotoUrl] = useState(returnEntry?.photoUrl || null);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!clientId) {
        alert("Por favor, seleccione un cliente.");
        return;
    }
    const client = clients.find(c => c.id === clientId);
    if (client && parseInt(garmentsReturned) > (client.currentInventory || 0)) {
        alert(`No se pueden devolver ${garmentsReturned} prendas. El cliente solo tiene ${client.currentInventory || 0} en inventario.`);
        return;
    }
    onSubmit({ date, clientId, garmentsReturned: parseInt(garmentsReturned), photoUrl });
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
          <Label htmlFor="ret-date" className="text-primary-foreground/80">Fecha de Devolución</Label>
          <Input id="ret-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} required className="bg-background/50 border-border focus:border-primary" />
        </div>
        <div>
          <Label htmlFor="ret-client" className="text-primary-foreground/80">Cliente</Label>
          <Select value={clientId} onValueChange={setClientId}>
            <SelectTrigger id="ret-client" className="w-full bg-background/50 border-border focus:border-primary">
              <SelectValue placeholder="Seleccionar cliente" />
            </SelectTrigger>
            <SelectContent className="bg-popover text-popover-foreground">
              {clients.map(cli => (
                <SelectItem key={cli.id} value={cli.id}>{cli.name} (Inv: {cli.currentInventory || 0})</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div>
        <Label htmlFor="ret-garments" className="text-primary-foreground/80">Cantidad de Prendas Devueltas</Label>
        <Input id="ret-garments" type="number" value={garmentsReturned} onChange={(e) => setGarmentsReturned(e.target.value)} placeholder="Ej: 100" required className="bg-background/50 border-border focus:border-primary" />
      </div>
      <div>
        <Label htmlFor="ret-photo" className="text-primary-foreground/80">Foto del Comprobante (Opcional)</Label>
        <div className="flex items-center gap-2">
            <Input id="ret-photo" type="file" onChange={handlePhotoUpload} className="bg-background/50 border-border focus:border-primary flex-grow" accept="image/*" />
            <Button type="button" variant="outline" size="icon" className="border-primary text-primary hover:bg-primary/10">
            <Camera className="h-5 w-5" />
            </Button>
        </div>
        {photoUrl && <img  src={photoUrl} alt="Vista previa comprobante" class="mt-2 max-h-32 rounded" src="https://images.unsplash.com/photo-1697992350118-9e19c604d808" />}
      </div>
      <DialogFooter>
        <DialogClose asChild>
            <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
        </DialogClose>
        <Button type="submit" className="bg-green-600 hover:bg-green-700 text-white">
          <PackageCheck className="mr-2 h-5 w-5" /> Registrar Devolución
        </Button>
      </DialogFooter>
    </form>
  );
};

const InventoryReturnsPage = () => {
  const { inventoryReturns, inventoryReturnActions, clients } = useData();
  const { toast } = useToast();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingReturn, setEditingReturn] = useState(null);

  const handleAddReturn = () => {
    setEditingReturn(null);
    setIsFormOpen(true);
  };

  const handleEditReturn = (returnEntry) => {
    toast({ title: "Info", description: "La edición de devoluciones aún no está implementada para mantener la integridad de los comprobantes y el inventario. Puede eliminar y crear una nueva." });
  };

  const handleDeleteReturn = (id) => {
     inventoryReturnActions.delete(id);
     toast({ title: "Devolución Eliminada", description: `La devolución ${id} ha sido eliminada. Ajuste el inventario manualmente si es necesario.` });
  };

  const handleFormSubmit = (data) => {
    if (editingReturn) {
      inventoryReturnActions.update(editingReturn.id, data);
    } else {
      inventoryReturnActions.create(data);
    }
    setIsFormOpen(false);
    setEditingReturn(null);
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
        <h1 className="text-3xl font-bold gradient-text">Control de Inventario y Devoluciones</h1>
         <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
            <DialogTrigger asChild>
                <Button onClick={handleAddReturn} className="bg-primary hover:bg-primary/90 text-primary-foreground w-full sm:w-auto">
                    <PlusCircle className="mr-2 h-5 w-5" /> Registrar Devolución
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg bg-card border-border">
                <DialogHeader>
                    <DialogTitle className="text-primary-foreground">{editingReturn ? 'Editar' : 'Registrar Nueva'} Devolución</DialogTitle>
                    <DialogDescription className="text-muted-foreground">
                         {editingReturn ? 'Modifica los detalles de la devolución.' : 'Completa los detalles de la devolución de prendas.'}
                    </DialogDescription>
                </DialogHeader>
                <ReturnForm
                    returnEntry={editingReturn}
                    onSubmit={handleFormSubmit}
                    onCancel={() => { setIsFormOpen(false); setEditingReturn(null); }}
                />
            </DialogContent>
        </Dialog>
      </div>
      
      <p className="text-muted-foreground">
        Lleva un control del inventario de prendas por cliente y registra las devoluciones. Las prendas devueltas se descontarán del inventario.
      </p>

      <Card className="card-gradient-bg shadow-lg">
        <CardHeader>
            <CardTitle className="text-primary-foreground flex items-center"><PackageSearch className="mr-2 h-6 w-6 text-accent" />Inventario Estimado por Cliente</CardTitle>
            <CardDescription className="text-muted-foreground">Total de prendas de cada cliente actualmente en la lavandería.</CardDescription>
        </CardHeader>
        <CardContent>
            {clients.length > 0 ? (
                <ul className="space-y-2">
                    {clients.map(client => (
                        <li key={client.id} className="flex justify-between items-center p-2 bg-background/30 rounded">
                            <span className="text-primary-foreground/90">{client.name}</span>
                            <span className="font-semibold text-accent">{client.currentInventory || 0} prendas</span>
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="text-muted-foreground">No hay clientes registrados para mostrar inventario.</p>
            )}
        </CardContent>
      </Card>


      {inventoryReturns.length === 0 && clients.length > 0 ? (
        <div className="card-gradient-bg p-8 rounded-lg shadow-xl text-center mt-8">
            <img  alt="Cajas de ropa listas para entrega" class="w-full md:w-1/2 mx-auto mb-4 rounded" src="https://images.unsplash.com/photo-1637904731042-2ef367b8c00c" />
            <h2 className="text-2xl font-semibold text-primary-foreground mb-2">No hay devoluciones registradas.</h2>
            <p className="text-muted-foreground mb-4">Registra la primera devolución de prendas a un cliente.</p>
            <Button onClick={handleAddReturn} variant="secondary">
                <PackageCheck className="mr-2 h-5 w-5" /> Registrar Devolución
            </Button>
        </div>
      ) : inventoryReturns.length > 0 ? (
        <div className="space-y-4 mt-8">
            <h2 className="text-2xl font-semibold gradient-text">Historial de Devoluciones</h2>
          {inventoryReturns.map((ret) => (
            <motion.div key={ret.id} layout>
                <Card className="card-gradient-bg shadow-lg hover:shadow-purple-500/30 transition-shadow duration-300">
                <CardHeader>
                    <CardTitle className="text-primary-foreground text-lg sm:text-xl flex flex-col sm:flex-row justify-between items-start sm:items-center">
                        <span>Cliente: {getClientName(ret.clientId)}</span>
                        <span className="text-sm text-muted-foreground mt-1 sm:mt-0">Comprobante: {ret.receiptId}</span>
                    </CardTitle>
                    <CardDescription className="text-muted-foreground">Fecha: {new Date(ret.date).toLocaleDateString()}</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-4 text-sm">
                    <div className="flex items-center text-primary-foreground/80"><ArchiveBox className="mr-2 h-4 w-4 text-accent" /> Prendas Devueltas: {ret.garmentsReturned}</div>
                    {ret.photoUrl && <img  src={ret.photoUrl} alt={`Foto devolución ${ret.id}`} class="max-h-16 rounded col-span-2 sm:col-span-1 mt-2 sm:mt-0" src="https://images.unsplash.com/photo-1697992350118-9e19c604d808" />}
                </CardContent>
                 <CardFooter className="flex justify-end gap-2 pt-4">
                    <Button variant="outline" size="sm" onClick={() => handleEditReturn(ret)} className="border-blue-500 text-blue-500 hover:bg-blue-500/10">
                        <Edit className="mr-1 h-4 w-4" /> Editar
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleDeleteReturn(ret.id)} className="border-red-500 text-red-500 hover:bg-red-500/10">
                        <Trash2 className="mr-1 h-4 w-4" /> Eliminar
                    </Button>
                </CardFooter>
                </Card>
            </motion.div>
          ))}
        </div>
      ) : null}
    </motion.div>
  );
};

export default InventoryReturnsPage;