
import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Users, Building2, Shirt, Clock } from 'lucide-react';

const StatCard = ({ title, value, icon, description, color }) => (
  <Card className="card-gradient-bg shadow-lg hover:shadow-xl transition-shadow duration-300">
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium text-primary-foreground">{title}</CardTitle>
      {React.cloneElement(icon, { className: `h-5 w-5 ${color || 'text-accent'}` })}
    </CardHeader>
    <CardContent>
      <div className="text-3xl font-bold gradient-text">{value}</div>
      <p className="text-xs text-muted-foreground pt-1">{description}</p>
    </CardContent>
  </Card>
);

const DashboardPage = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-8"
    >
      <h1 className="text-4xl font-bold gradient-text">Panel de Control</h1>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard 
          title="Lugares Activos" 
          value="5" 
          icon={<Building2 />} 
          description="Total de centros operativos"
          color="text-purple-400"
        />
        <StatCard 
          title="Empleados Registrados" 
          value="25" 
          icon={<Users />} 
          description="Personal total en la plataforma"
          color="text-sky-400"
        />
        <StatCard 
          title="Prendas Procesadas (Hoy)" 
          value="1,250" 
          icon={<Shirt />} 
          description="+15% vs ayer"
          color="text-pink-400"
        />
        <StatCard 
          title="Horas Registradas (Hoy)" 
          value="180" 
          icon={<Clock />} 
          description="Total de horas trabajadas"
          color="text-green-400"
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="card-gradient-bg shadow-lg">
          <CardHeader>
            <CardTitle className="text-primary-foreground">Actividad Reciente</CardTitle>
            <CardDescription className="text-muted-foreground">Últimos movimientos en el sistema.</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              <li className="text-sm text-primary-foreground/90">Nuevo cliente 'Hotel Paraíso' añadido.</li>
              <li className="text-sm text-primary-foreground/90">Empleado 'Ana Pérez' completó turno de 8h.</li>
              <li className="text-sm text-primary-foreground/90">Recepción de 200kg de ropa de 'Resort Solymar'.</li>
            </ul>
          </CardContent>
        </Card>
        <Card className="card-gradient-bg shadow-lg">
          <CardHeader>
            <CardTitle className="text-primary-foreground">Alertas y Notificaciones</CardTitle>
            <CardDescription className="text-muted-foreground">Información importante que requiere tu atención.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-amber-400">Mantenimiento de máquina #3 programado para mañana.</p>
            <p className="text-sm text-red-400 mt-2">Bajo stock de detergente XYZ.</p>
          </CardContent>
        </Card>
      </div>
      {/*  <img  
        alt="Gráfico de barras mostrando el rendimiento de la lavandería" 
        class="w-full h-auto rounded-lg shadow-xl mt-8"
       src="https://images.unsplash.com/photo-1675193915025-7901f1992d1d" /> */}
    </motion.div>
  );
};

export default DashboardPage;
  