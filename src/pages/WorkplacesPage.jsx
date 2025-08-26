import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { Truck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { fetchLaundries } from '@/pages/parametrizacion/laundries/Services/laundries.services';
import { useAuth, ROLES } from '@/contexts/AuthContext';

const WorkplacesPage = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [laundries, setLaundries] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadLaundries = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetchLaundries({ query: { estado: 'Activo' } });
      if (response.data) {
        let data = response.data;
        // Si el rol es CENTRO_LAVADO, solo mostrar su propia lavandería
        if (user?.role === ROLES.CENTRO_LAVADO) {
          const myId = user?.lavanderia?._id || user?.lavanderia?.id;
          if (myId) {
            data = data.filter((l) => String(l._id) === String(myId));
          } else {
            data = [];
          }
        }
        setLaundries(data);
      } else {
        setLaundries([]);
      }

    } catch (error) {
      toast({
        title: 'Error al cargar lavanderías',
        description: error.message,
        variant: 'destructive',
      });
      setLaundries([]);
    } finally {
      setIsLoading(false);
    }
  }, [toast, user]);

  useEffect(() => {
    loadLaundries();
  }, [loadLaundries, user]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="p-4 md:p-6 lg:p-8"
    >
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Centros de Lavado</h1>
      </div>

      {isLoading ? (
        <div className="text-center text-muted-foreground mt-8">Cargando centros de lavado...</div>
      ) : laundries.length === 0 ? (
        <div className="text-center text-muted-foreground mt-8">
          <p>No se encontraron centros de lavado activos.</p>
          <p>Puedes registrarlos en el módulo de parametrización de lavanderías.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {laundries.map((laundry) => (
            <WorkplaceCard key={laundry._id} laundry={laundry} />
          ))}
        </div>
      )}
    </motion.div>
  );
};

const WorkplaceCard = ({ laundry }) => {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="rounded-lg border bg-card text-card-foreground card-gradient-bg shadow-lg hover:shadow-purple-500/30 transition-shadow duration-300 flex flex-col h-full">
        <CardHeader>
          <CardTitle className="text-xl font-bold">{laundry.nombre}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 flex-grow">
          <div>
            <p className="text-sm text-muted-foreground">Dirección</p>
            <p className="text-md font-semibold">{laundry.direccion || 'No especificada'}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Teléfono</p>
            <p className="text-md font-semibold">{laundry.telefono || 'No especificado'}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Supervisor</p>
            <p className="text-md font-semibold">{laundry.supervisor || 'No asignado'}</p>
          </div>
        </CardContent>
        <CardFooter>
          <Button asChild className="w-full bg-primary/90 hover:bg-primary text-primary-foreground">
            <Link to={`/centros-lavado/${laundry._id}`} state={{ workplaceName: laundry.nombre, workplaceId: laundry._id }}>
              <Truck className="mr-2 h-4 w-4" /> GESTIONAR CENTRO
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  );
};

export default WorkplacesPage;