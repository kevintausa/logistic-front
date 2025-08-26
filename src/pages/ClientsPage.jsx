import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import {  Briefcase, AtSign, Truck, Map } from 'lucide-react';
import { fetchClients, createClient, updateClient, deleteClient, fetchDailyClientStats } from './parametrizacion/clients/Services/clients.services';
import { useToast } from "@/components/ui/use-toast";

const ClientForm = ({ client, onSubmit, onCancel }) => {
  const [name, setName] = useState(client?.name || '');
  const [contact, setContact] = useState(client?.contact || '');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ name, contact, currentInventory: client?.currentInventory || 0 });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="client-name" className="text-primary-foreground/80">Nombre del Cliente (Hotel)</Label>
        <Input id="client-name" value={name} onChange={(e) => setName(e.target.value)} required className="bg-background/50 border-border focus:border-primary" />
      </div>
      <div>
        <Label htmlFor="client-contact" className="text-primary-foreground/80">Contacto (Email/Teléfono)</Label>
        <Input id="client-contact" value={contact} onChange={(e) => setContact(e.target.value)} required className="bg-background/50 border-border focus:border-primary" />
      </div>
      <DialogFooter>
        <DialogClose asChild>
          <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
        </DialogClose>
        <Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground">Guardar Cliente</Button>
      </DialogFooter>
    </form>
  );
};

const ClientsPage = () => {
  const { toast } = useToast();
  const [clients, setClients] = useState([]);
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingClient, setEditingClient] = useState(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [clientsResponse, statsResponse] = await Promise.all([
        fetchClients({ limit: 1000, offset: 1, query: {} }),
        fetchDailyClientStats(),
      ]);
      setClients(clientsResponse.data || []);
      setStats(statsResponse || []);
    } catch (error) {
      toast({ title: 'Error', description: 'No se pudieron cargar los datos.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);


  const handleEditClient = (client) => {
    setEditingClient(client);
    setIsFormOpen(true);
  };

  const handleDeleteClient = async (id) => {
    try {
      await deleteClient(id);
      toast({ title: 'Éxito', description: 'Cliente eliminado.' });
      loadData();
    } catch (error) {
      toast({ title: 'Error', description: 'No se pudo eliminar el cliente.', variant: 'destructive' });
    }
  };

  const handleFormSubmit = async (data) => {
    try {
      if (editingClient) {
        await updateClient(editingClient._id, data);
        toast({ title: 'Éxito', description: 'Cliente actualizado.' });
      } else {
        await createClient(data);
        toast({ title: 'Éxito', description: 'Cliente creado.' });
      }
      setIsFormOpen(false);
      setEditingClient(null);
      loadData();
    } catch (error) {
      toast({ title: 'Error', description: 'No se pudo guardar el cliente.', variant: 'destructive' });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold gradient-text">Gestión de Clientes</h1>
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogContent className="sm:max-w-[425px] bg-card border-border">
            <DialogHeader>
              <DialogTitle className="text-primary-foreground">{editingClient ? 'Editar' : 'Añadir Nuevo'} Cliente</DialogTitle>
              <DialogDescription className="text-muted-foreground">
                {editingClient ? 'Modifica los detalles del cliente.' : 'Completa la información del nuevo cliente.'}
              </DialogDescription>
            </DialogHeader>
            <ClientForm
              client={editingClient}
              onSubmit={handleFormSubmit}
              onCancel={() => { setIsFormOpen(false); setEditingClient(null); }}
            />
          </DialogContent>
        </Dialog>
      </div>

      <p className="text-muted-foreground">
        Gestiona la información de tus clientes. Asocia ropa recibida y visualiza informes detallados.
      </p>

      {loading ? (
        <p>Cargando clientes...</p>
      ) : clients.length === 0 ? (
        <div className="card-gradient-bg p-8 rounded-lg shadow-xl text-center">
          <img alt="Icono de un hotel elegante" class="w-1/4 mx-auto mb-4 text-primary" src="https://images.unsplash.com/photo-1703457425307-9d75c949f146" />
          <h2 className="text-2xl font-semibold text-primary-foreground mb-2">No hay clientes registrados.</h2>
          <p className="text-muted-foreground mb-4">Comienza añadiendo tus clientes para llevar un control.</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {clients.map((cli) => {
            const clientStat = stats.find(s => s.cliente.id === cli._id);
            const dailyWeight = clientStat ? clientStat.totalWeight.toFixed(2) : 0;

            return (
              <motion.div key={cli._id} layout>
                <Card className="card-gradient-bg shadow-lg hover:shadow-purple-500/30 transition-shadow duration-300 flex flex-col h-full">
                  <CardHeader>
                    <CardTitle className="text-primary-foreground text-xl flex items-center"><Briefcase className="mr-2 h-5 w-5 " />{cli.nombre}</CardTitle>
                  </CardHeader>
                  <CardContent className="flex-grow space-y-2">

                    <div className="flex items-center text-sm text-primary-foreground/80">
                      <Truck className="mr-2 h-4 w-4 text-primary" /> Kilos recepcionados hoy: {dailyWeight} kg
                    </div>
                    <div className="flex items-center text-sm text-primary-foreground/80">
                      <AtSign className="mr-2 h-4 w-4 text-primary" /> Contacto: {cli?.telefono}
                    </div>
                    <div className="flex items-center text-sm text-primary-foreground/80">
                      <Map className="mr-2 h-4 w-4 text-primary" /> Dirección: {cli?.direccion}
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-end gap-2 pt-4">
                    {/*       <Button variant="outline" size="sm" onClick={() => handleEditClient(cli)} className="border-blue-500 text-blue-500 hover:bg-blue-500/10">
                        <Edit className="mr-1 h-4 w-4" /> Editar
                    </Button> */}

                  </CardFooter>
                </Card>
              </motion.div>
            )
          })}
        </div>
      )}
    </motion.div>
  );
};

export default ClientsPage;