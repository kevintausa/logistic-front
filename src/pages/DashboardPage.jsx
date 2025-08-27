
import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { BarChart, Users, Briefcase, AlertTriangle } from 'lucide-react';

// Mapa de estilos por color para evitar clases dinámicas no detectadas por Tailwind
const colorStyles = {
  sky: {
    header: 'text-sky-400',
    icon: 'text-sky-500',
    hover: 'hover:border-sky-500',
  },
  green: {
    header: 'text-green-400',
    icon: 'text-green-500',
    hover: 'hover:border-green-500',
  },
  purple: {
    header: 'text-purple-400',
    icon: 'text-purple-500',
    hover: 'hover:border-purple-500',
  },
  orange: {
    header: 'text-orange-400',
    icon: 'text-orange-500',
    hover: 'hover:border-orange-500',
  },
};

const StatCard = ({ title, value, icon, color = 'sky', unit }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3 }}
    className={`bg-card p-6 rounded-xl shadow-lg border border-border transition-colors duration-300 ${
      colorStyles[color]?.hover || ''
    }`}
  >
    <div className="flex items-center justify-between mb-3">
      <h3 className={`text-lg font-semibold ${colorStyles[color]?.header || ''}`}>{title}</h3>
      {React.cloneElement(icon, { size: 28, className: `${colorStyles[color]?.icon || ''}` })}
    </div>
    <p className="text-4xl font-bold text-foreground">
      {value}
      {unit && <span className="text-xl text-muted-foreground ml-1">{unit}</span>}
    </p>
  </motion.div>
);

// Hook local simple para sincronizar con localStorage
const useLocalStorage = (key, defaultValue) => {
  const [value, setValue] = useState(() => {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : defaultValue;
    } catch (e) {
      return defaultValue;
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {}
  }, [key, value]);
  return [value, setValue];
};

const DashboardPage = () => {
  const [operaciones] = useLocalStorage('operaciones', []);
  const [clientes] = useLocalStorage('clientes', []);

  const totalOperaciones = operaciones.length;
  const operacionesActivas = operaciones.filter(
    (op) => op.estado === 'Activo' || op.estado === 'En curso'
  ).length;
  const totalClientes = clientes.length;
  const operacionesPendientes = operaciones.filter((op) => op.estado === 'Pendiente').length;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="space-y-8"
    >
      <h1 className="text-4xl font-bold tracking-tight text-sky-400 mb-10">Dashboard General</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Operaciones Totales" value={totalOperaciones} icon={<BarChart />} color="sky" />
        <StatCard title="Operaciones Activas" value={operacionesActivas} icon={<Briefcase />} color="green" />
        <StatCard title="Clientes Registrados" value={totalClientes} icon={<Users />} color="purple" />
        <StatCard title="Operaciones Pendientes" value={operacionesPendientes} icon={<AlertTriangle />} color="orange" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-10">
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="bg-card p-6 rounded-xl shadow-lg border border-border"
        >
          <h2 className="text-2xl font-semibold text-pink-400 mb-4">Actividad Reciente</h2>
          {operaciones.slice(0, 5).map((op) => (
            <div key={op.id} className="py-3 border-b border-border last:border-b-0">
              <p className="text-foreground font-medium">{op.id} - {op.nombreCliente}</p>
              <p className="text-sm text-muted-foreground">{op.tipoOperacion} ({op.estado})</p>
            </div>
          ))}
          {operaciones.length === 0 && (
            <p className="text-muted-foreground">No hay actividad reciente.</p>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="bg-card p-6 rounded-xl shadow-lg border border-border"
        >
          <h2 className="text-2xl font-semibold text-teal-400 mb-4">Próximas Tareas (Simulado)</h2>
          <ul className="space-y-3 list-disc list-inside text-foreground">
            <li>Seguimiento Operación OPX001</li>
            <li>Confirmar documentación Cliente Y</li>
            <li>Revisar cotizaciones para Operación OPZ003</li>
          </ul>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default DashboardPage;
  