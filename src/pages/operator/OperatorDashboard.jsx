import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, ClipboardCheck, Camera, Calendar, FileDown, List } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';

// Nota: Esta es una primera versión (scaffold) del Dashboard de Operario.
// Pendiente de integrar: datos del usuario autenticado, idLavanderia, endpoints de turnos y documentos.
const OperatorDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();

  const displayName = user?.raw?.nombre && user?.raw?.apellido
    ? `${user.raw.nombre} ${user.raw.apellido}`
    : (user?.name || 'Operario');
  const displayCedula = user?.raw?.cedula || user?.cedula || null;

  const menuItems = [
    {
      title: 'Registrar Llegada',
      description: 'Captura una foto y registra tu hora de entrada',
      icon: <Camera className="h-10 w-10 text-primary" />,
      path: '/operario/llegada',
      color: 'bg-primary/10',
      isReady: true,
    },
    {
      title: 'Mis Registros',
      description: 'Consulta tu historial de horas trabajadas',
      icon: <List className="h-10 w-10 text-blue-500" />,
      path: '/operario/registros',
      color: 'bg-blue-500/10',
      isReady: true,
    },
    {
      title: 'Mis Turnos',
      description: 'Revisa los turnos asignados por tu supervisor',
      icon: <Calendar className="h-10 w-10 text-emerald-500" />,
      path: '/operario/turnos',
      color: 'bg-emerald-500/10',
      isReady: true,
    },
    {
      title: 'Documentación',
      description: 'Descarga tus certificados y documentos',
      icon: <FileDown className="h-10 w-10 text-orange-500" />,
      path: '/operario/documentos',
      color: 'bg-orange-500/10',
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
    if (item.path === '/operario/llegada') {
      navigate(item.path, { state: { cedula: displayCedula, nombre: displayName } });
    } else {
      navigate(item.path);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="p-4 md:p-6 lg:p-8">
      <div className="mb-4">
        <Button asChild variant="outline">
          <Link to="/"><ArrowLeft className="mr-2 h-4 w-4" /> Volver</Link>
        </Button>
      </div>
      <Card>
        <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="bg-primary/10 p-3 rounded-lg">
              <ClipboardCheck className="h-8 w-8 text-primary" />
            </div>
            <div>
              <CardTitle className="text-2xl">Panel de Operario</CardTitle>
              <CardDescription>
                {displayName}{displayCedula ? ` • Cédula ${displayCedula}` : ''}
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
                className={`${item.color} p-6 rounded-lg border border-border shadow-sm cursor-pointer hover:shadow-md transition-all duration-200 ${!item.isReady ? 'opacity-70' : ''}`}
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
                </div>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default OperatorDashboard;
