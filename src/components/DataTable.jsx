import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, Edit, Trash, Check, AlertCircle, LogOut, FileText, Tag, ListChecks, Lock, Ban, Plus, Download } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import Pagination from './Pagination';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const DataTable = ({ data, columns, isLoading, onAction, page, limit, totalRecords, onPageChange, onLimitChange, ...cellRenderProps }) => {
  const tableRowVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: (i) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.05,
        type: 'spring',
        stiffness: 300,
        damping: 20,
      },
    }),
    exit: { opacity: 0, y: -10, transition: { duration: 0.15 } },
  };

  if (isLoading) {
    return (
      <div className="p-4 bg-card rounded-lg">
        <div className="space-y-3">
          <div className="h-8 bg-muted rounded w-full animate-pulse"></div>
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-12 bg-muted/60 rounded w-full animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center justify-center p-6 bg-card rounded-lg shadow-md text-center min-h-[200px]"
      >
        <div className="w-14 h-14 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-4">
          <AlertCircle className="h-7 w-7" />
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-1">No hay datos disponibles</h3>
        <p className="text-muted-foreground text-sm max-w-xs">
          Intenta ajustar tus filtros o verifica si hay datos para mostrar.
        </p>
      </motion.div>
    );
  }

  return (
    <div className="overflow-x-auto w-full rounded-lg shadow-sm border border-border custom-scrollbar">
      <table className="w-full table-auto divide-y divide-muted bg-background text-sm">
        <thead className="bg-primary/50 sticky top-0 z-10 backdrop-blur-sm">
          <tr>
            {/* Encabezado para columna de opciones/acciones */}
            <th key="table-actions-header" className="px-4 py-3 font-semibold text-foreground w-[120px]">
              {columns.find(col => col.key === 'opciones' || col.id === 'opciones') ? 'Opciones' : 'Acciones'}
            </th>
            {columns.filter(column => column.key !== 'opciones' && column.id !== 'opciones').map((column, columnIndex) => (
              <th key={column.id} className="px-4 py-3 text-left font-semibold text-foreground whitespace-nowrap" style={{width: column.width || 'auto'}}>
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <AnimatePresence mode="popLayout">
            {data.map((row, rowIndex) => (
              <motion.tr
                key={row._id || `row-${rowIndex}`}
                custom={rowIndex}
                initial="hidden"
                animate="visible"
                exit="exit"
                variants={tableRowVariants}
                layoutId={`row-${row._id || rowIndex}`}
                className="transition-colors duration-200 hover:bg-muted/30"
              >
                {/* Columna de acciones personalizada */}
                {columns.some(col => col.key === 'actions' || col.id === 'actions' || col.key === 'opciones' || col.id === 'opciones') && (
                  <td className="py-2 px-2 text-center w-[120px]">
                    <div className="flex justify-center items-center gap-1 flex-wrap sm:flex-nowrap">
                      {/* Acciones dinámicas basadas en la propiedad actions de columns */}
                      {columns.find(col => col.key === 'actions' || col.id === 'actions' || col.key === 'opciones' || col.id === 'opciones')?.actions?.map(action => {
                        // Verificar si la acción debe mostrarse para esta fila
                        if (action.showWhen && !action.showWhen(row)) return null;
                        
                        // Determinar qué icono usar
                        let Icon;
                        switch(action.icon) {
                          case 'Eye': Icon = Eye; break;
                          case 'Edit': Icon = Edit; break;
                          case 'Trash': Icon = Trash; break;
                          case 'Check': Icon = Check; break;
                          case 'LogOut': Icon = LogOut; break;
                          case 'FileText': Icon = FileText; break;
                          case 'Tag': Icon = Tag; break;
                          case 'ListChecks': Icon = ListChecks; break;
                          case 'Lock': Icon = Lock; break;
                          case 'Ban': Icon = Ban; break;
                          case 'Plus': Icon = Plus; break;
                          case 'Download': Icon = Download; break;
                          default: Icon = Edit;
                        }
                        // Permitir 'key' o 'id' como identificador de acción
                        const actionKey = action.key || action.id;
                        
                        const isDisabled = typeof action.disabledWhen === 'function' ? !!action.disabledWhen(row) : false;
                        const handleClick = () => {
                          if (isDisabled) return;
                          onAction && onAction(actionKey, row);
                        };
                        return (
                          <TooltipProvider key={actionKey}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  onClick={handleClick}
                                  variant="ghost"
                                  size="icon"
                                  disabled={isDisabled}
                                  aria-disabled={isDisabled}
                                  className={`h-8 w-8 transition-colors ${isDisabled ? 'opacity-40 cursor-not-allowed hover:bg-transparent hover:text-inherit' : 'hover:bg-black hover:text-white'} ${action.className || ''}`}
                                >
                                  <Icon className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <span>{isDisabled ? (action.disabledTooltip || action.tooltip || action.label || '') : (action.tooltip || action.label || '')}</span>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        );
                      })}
                    </div>
                  </td>
                )}
                
                {/* Columna de acciones genérica */}
                {!columns.some(col => col.key === 'actions' || col.id === 'actions' || col.key === 'opciones' || col.id === 'opciones') && (
                  <td className="py-2 px-2 text-center w-[120px]">
                    <div className="flex justify-center items-center gap-1 flex-wrap sm:flex-nowrap">
                      <Button
                        onClick={() => onAction && onAction('edit', row)}
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 transition-colors hover:bg-black hover:text-white"
                      >
                        <Edit className="h-4 w-4 text-green-400" />
                      </Button>
                      <Button
                        onClick={() => onAction && onAction('delete', row)}
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 transition-colors hover:bg-black hover:text-white"
                      >
                        <Trash className="h-4 w-4 text-red-400" />
                      </Button>
                    </div>
                  </td>
                )}
                {columns.filter(column => column.key !== 'opciones' && column.id !== 'opciones').map((column) => (
                  <td key={`${row._id}-${column.id}`} className="px-4 py-2 whitespace-nowrap" style={{width: column.width || 'auto'}}>
                    {column.render ? column.render(row, column, cellRenderProps) : renderCellContent(row[column.id], column.type)}
                  </td>
                ))}
              </motion.tr>
            ))}
          </AnimatePresence>
        </tbody>
      </table>
      {totalRecords > limit && (
        <div className="p-4 bg-card border-t border-border">
          <Pagination
            currentPage={page}
            totalItems={totalRecords}
            itemsPerPage={limit}
            onPageChange={onPageChange}
            onLimitChange={onLimitChange}
          />
        </div>
      )}
    </div>
  );
};

const renderCellContent = (value, type) => {
  if (value === undefined || value === null) {
    return <span className="text-muted-foreground italic">N/A</span>;
  }

  // Si el valor es un objeto complejo
  if (typeof value === 'object' && value !== null) {
    // Si tiene propiedad nombre, mostrar esa
    if (value.nombre) {
      return <span className="text-sm">{value.nombre}</span>;
    }
    // Si es un objeto lavandería o máquina con id pero sin nombre
    if (value.id) {
      return <span className="text-sm">ID: {value.id}</span>;
    }
    // Para fechas que pueden estar en formato de objeto
    if (value instanceof Date) {
      return (
        <span className="text-sm">
          {value.toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          })}
        </span>
      );
    }
    // Para cualquier otro objeto, mostrar [Objeto] para evitar el error
    return <span className="text-muted-foreground italic">[Objeto]</span>;
  }

  try {
    switch (type) {
      case 'number':
        // Verificar que sea realmente un número antes de llamar a toLocaleString
        if (typeof value === 'number') {
          return <span className="font-medium">{value.toLocaleString()}</span>;
        } else {
          const num = Number(value);
          return <span className="font-medium">{isNaN(num) ? '0' : num.toLocaleString()}</span>;
        }
      case 'boolean':
        return value ? (
          <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-semibold border border-green-200">
            Sí
          </span>
        ) : (
          <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-xs font-semibold border border-red-200">
            No
          </span>
        );
      case 'date':
        try {
          const date = new Date(value);
          if (isNaN(date.getTime())) {
            return <span className="text-muted-foreground italic">Fecha inválida</span>;
          }
          return (
            <span className="text-sm">
              {date.toLocaleDateString('es-ES', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })}
            </span>
          );
        } catch (e) {
          return <span className="text-muted-foreground italic">Fecha inválida</span>;
        }
      case 'status':
        return (
          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${getStatusClasses(value)}`}>
            {value}
          </span>
        );
      default:
        // Asegurarse de que sea una cadena antes de mostrarla
        return <span className="text-sm">{String(value)}</span>;
    }
  } catch (error) {
    console.error('Error rendering cell content:', error);
    return <span className="text-muted-foreground italic">Error de formato</span>;
  }
};

const getStatusClasses = (status) => {
  const s = status.toLowerCase();
  if (s === 'activo') return 'bg-green-700 text-white border-green-200';
  if (s === 'inactivo') return 'bg-red-700 text-white border-red-200';
  if (s === 'pendiente') return 'bg-yellow-100 text-yellow-700 border-yellow-200';
  if (s === 'completado') return 'bg-blue-100 text-blue-700 border-blue-200';
  if (s === 'cancelado') return 'bg-gray-100 text-gray-700 border-gray-200';
  return 'bg-gray-100 text-gray-700 border-gray-200';
};

export default DataTable;
