import React from 'react';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/components/ui/avatar';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

const getInitials = (name = '') => {
  const names = name.split(' ').filter(Boolean);
  if (names.length > 1) {
    return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};

const ActiveEmployees = ({ employees }) => {
  if (!employees || employees.length === 0) {
    return null; // No mostrar nada si no hay empleados activos
  }

  return (
    <div className="p-4 ">
    <h3 className="text-sm font-semibold mb-3 text-muted-foreground">EMPLEADOS ACTIVOS ({employees.length})</h3>
    <div className="flex flex-wrap -space-x-2 overflow-hidden p-1">
        <TooltipProvider delayDuration={100}>
          {employees.map((record) => (
            <Tooltip key={record._id}>
              <TooltipTrigger asChild>
                <Avatar className="border-2 border-white dark:border-slate-900 hover:z-10 transition-transform hover:scale-110">
                  <AvatarImage src={record?.empleado?.foto || ''} alt={record?.empleado?.nombre || 'Empleado'} />
                  <AvatarFallback className="bg-primary/80 text-primary-foreground font-semibold">{getInitials(record?.empleado?.nombre || '')}</AvatarFallback>
                </Avatar>
              </TooltipTrigger>
              <TooltipContent>
                <p>{record?.empleado?.nombre || 'Empleado'}</p>
              </TooltipContent>
            </Tooltip>
          ))}
        </TooltipProvider>
      </div>
    </div>
  );
};

export default ActiveEmployees;
