import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Plane, Ship, Truck, Landmark, Boxes, Shuffle, Tags } from 'lucide-react';

const tiles = [
  { name: 'Aéreo', description: 'Gestión de operaciones aéreas', path: '/operaciones/aereo', icon: Plane, color: 'text-sky-600', bg: 'bg-sky-500/10' },
  { name: 'LCL', description: 'Consolidado de carga suelta en contenedores', path: '/operaciones/lcl', icon: Boxes, color: 'text-slate-600', bg: 'bg-slate-500/10' },
  { name: 'FCL', description: 'Gestión de contenedores completos', path: '/operaciones/fcl', icon: Ship, color: 'text-indigo-600', bg: 'bg-indigo-500/10' },
  { name: 'Aduana', description: 'Trámites y procesos aduaneros', path: '/operaciones/aduana', icon: Landmark, color: 'text-amber-600', bg: 'bg-amber-500/10' },
  { name: 'Transporte Terrestre', description: 'Movilización de mercancía por carretera', path: '/operaciones/transporte-terrestre', icon: Truck, color: 'text-rose-600', bg: 'bg-rose-500/10' },
  { name: 'Triangulación', description: 'Operaciones de triangulación de mercancía', path: '/operaciones/triangulacion', icon: Shuffle, color: 'text-purple-600', bg: 'bg-purple-500/10' },
  { name: 'Tarifas', description: 'Gestión de tarifas por tipo de operación', path: '/operaciones/tarifas', icon: Tags, color: 'text-teal-600', bg: 'bg-teal-500/10' },
];

export default function OperationsModulesPage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="p-4 md:p-6 lg:p-8"
    >
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Módulos</CardTitle>
          <CardDescription>
            Selecciona un módulo para gestionar sus operaciones, pasos y propiedades.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mt-2">
            {tiles.map((t, index) => (
              <Link key={t.name} to={t.path} className="block">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`${t.bg} p-6 rounded-lg border border-border shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-0.5`}
                >
                  <div className="flex flex-col items-center text-center">
                    <t.icon className={`h-10 w-10 ${t.color}`} />
                    <h3 className="text-lg font-semibold mt-3">{t.name}</h3>
                    {t.description && (
                      <p className="text-sm text-muted-foreground mt-1">{t.description}</p>
                    )}
                  </div>
                </motion.div>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
