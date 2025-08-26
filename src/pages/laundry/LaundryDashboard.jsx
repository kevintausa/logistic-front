import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Truck, 
  Package, 
  Lightbulb, 
  Clock, 
  ArrowLeft, 
  Building,
  CircleSlash,
  Calendar,
  FileText,
  ListTodo,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { fetchLaundryById } from '@/pages/parametrizacion/laundries/Services/laundries.services';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext.jsx';

const LaundryDashboard = () => {
  const { idLavanderia } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { hasPermission, MODULES } = useAuth();
  const [laundry, setLaundry] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadLaundry = async () => {
      try {
        setIsLoading(true);
        const data = await fetchLaundryById(idLavanderia);
        setLaundry(data);
      } catch (error) {
        console.error('Error cargando lavandería:', error);
        toast({
          title: 'Error',
          description: 'No se pudo cargar la información de la lavandería',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (idLavanderia) {
      loadLaundry();
    }
  }, [idLavanderia, toast]);

  const menuItems = [
    {
      title: 'Recepción Ropa Sucia',
      description: 'Registrar entrada de ropa sucia para procesar',
      icon: <Truck className="h-10 w-10 text-primary" />,
      path: `/centros-lavado/${idLavanderia}/recepcion`,
      color: 'bg-primary/10',
      isReady: true,
    },
    {
      title: 'Ciclos de lavado',
      description: 'Gestionar los ciclos de lavado',
      icon: <CircleSlash className="h-10 w-10 text-red-500" />,
      path: `/centros-lavado/${idLavanderia}/ciclos`,
      color: 'bg-red-500/10',
      isReady: true,
    },
    {
      title: 'Servicios Públicos',
      description: 'Registrar consumos y facturación de servicios',
      icon: <Lightbulb className="h-10 w-10 text-orange-500" />,
      path: `/centros-lavado/${idLavanderia}/servicios`,
      color: 'bg-orange-500/10',
      isReady: true,
    },
    {
      title: 'Registro de Entradas y Salidas de Personal',
      description: 'Control de tiempo y asistencia del personal',
      icon: <Clock className="h-10 w-10 text-blue-500" />,
      path: `/centros-lavado/${idLavanderia}/horas`,
      color: 'bg-blue-500/10',
      isReady: true,
    },
    {
      title: 'Gestion de Turnos',
      description: 'Gestionar turnos de centros de lavado',
      icon: <Calendar className="h-10 w-10 text-blue-500" />,
      path: `/centros-lavado/${idLavanderia}/turnos`,
      color: 'bg-blue-500/10',
      isReady: true,
    },
    {
      title: 'Registro de Inventarios',
      description: 'Gestionar inventario de productos y materiales',
      icon: <Package className="h-10 w-10 text-yellow-500" />,
      path: `/centros-lavado/${idLavanderia}/inventarios`,
      color: 'bg-yellow-500/10',
      isReady: true,
    },
    {
      title: 'Lista de productos y precios',
      description: 'Gestionar lista de productos y precios',
      icon: <ListTodo className="h-10 w-10 text-green-500" />,
      path: `/centros-lavado/${idLavanderia}/productos`,
      color: 'bg-green-500/10',
      isReady: true,
      requiredModule: MODULES.PRODUCTS,
    },
    {
      title: 'Documentación',
      description: 'Gestionar documentación de centros de lavado',
      icon: <FileText className="h-10 w-10 text-gray-500" />,
      path: `/centros-lavado/${idLavanderia}/documentacion`,
      color: 'bg-black/10',
      isReady: true,
    },
  ];

  const handleMenuClick = (item) => {
    if (!item.isReady) {
      toast({
        title: 'En desarrollo',
        description: 'Esta funcionalidad estará disponible próximamente',
      });
      return;
    }
    if (item.requiredModule && !hasPermission(item.requiredModule)) {
      toast({
        title: 'Permiso denegado',
        description: 'No tienes permisos para acceder a este módulo.',
        variant: 'destructive',
      });
      return;
    }
    
    navigate(item.path);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="p-4 md:p-6 lg:p-8">
      <div className="mb-4">
        <Button asChild variant="outline">
          <Link to="/centros-lavado"><ArrowLeft className="mr-2 h-4 w-4" /> Volver a Centros de Lavado</Link>
        </Button>
      </div>
      
      <Card>
        <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="bg-primary/10 p-3 rounded-lg">
              <Building className="h-8 w-8 text-primary" />
            </div>
            <div>
              <CardTitle className="text-2xl">Centro de Lavado</CardTitle>
              <CardDescription>
                {isLoading ? 'Cargando...' : laundry?.nombre || 'Centro de Lavado'}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-2">
            {menuItems.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                onClick={() => handleMenuClick(item)}
                className={`${item.color} p-6 rounded-lg border border-border shadow-sm transition-all duration-200 ${(!item.isReady || (item.requiredModule && !hasPermission(item.requiredModule))) ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer hover:shadow-md'}`}
              >
                <div className="flex flex-col items-center text-center">
                  <div className={`p-3 rounded-full ${item.color}`}>
                    {item.icon}
                  </div>
                  <h3 className="text-lg font-semibold mt-3">{item.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
                  {!item.isReady && (
                    <span className="mt-2 px-2 py-1 text-xs rounded bg-muted text-muted-foreground">
                      Próximamente
                    </span>
                  )}
                  {(item.requiredModule && !hasPermission(item.requiredModule)) && (
                    <span className="mt-2 px-2 py-1 text-xs rounded bg-red-500/10 text-red-600">
                      Sin permiso
                    </span>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default LaundryDashboard;
