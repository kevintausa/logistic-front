import React, { useState, useEffect, useCallback, useMemo } from 'react';

import { motion, AnimatePresence } from 'framer-motion';
import { PlusCircle, FilterIcon } from 'lucide-react';
import AppliedFilters from '@/components/AppliedFilters';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import DataTable from '@/components/DataTable';
import Pagination from '@/components/Pagination';
import DynamicFormModal from '@/components/DynamicFormModal';
import { useToast } from '@/components/ui/use-toast';
import { usersColumns, columnsExcel } from '@/pages/parametrizacion/usuarios/utils/usersColumns';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { fetchUsers, createUser, updateUser, deleteUser, exportUsers } from '@/pages/parametrizacion/usuarios/Services/users.services';
import FilterDrawer from '@/components/FilterDrawer';
import ExportExcelButton from '@/components/ExportExcelButton';

const ITEMS_PER_PAGE = 10;
const DEFAULT_FILTERS = { estado: 'Activo' };

const UsuariosPage = () => {
  const { toast } = useToast();
  const [displayedData, setDisplayedData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState(null);
  const [modalMode, setModalMode] = useState('create');

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  

  const fetchAndSetUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const offset = currentPage; // 1-based page
      const { data, totalRecords } = await fetchUsers({ limit: ITEMS_PER_PAGE, offset, query: filters });
      setDisplayedData(data);
      setTotalItems(totalRecords);
    } catch (error) {
      toast({ title: 'Error', description: error.message || 'No se pudieron obtener los usuarios.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, filters, toast]);

  useEffect(() => {
    fetchAndSetUsers();
  }, [fetchAndSetUsers]);

  const handlePageChange = (page) => setCurrentPage(page);

  const handleOpenModal = (mode, item = null) => {
    setModalMode(mode);
    setCurrentItem(item);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setCurrentItem(null);
  };

  const handleSaveItem = async (itemData) => {
    try {
      if (modalMode === 'create') {
        // Validación de confirmación de contraseña en el cliente
        if (itemData.contrasena !== itemData.contrasena2) {
          toast({ title: 'Error', description: 'Las contraseñas no coinciden', variant: 'destructive' });
          return;
        }
        // Remover campo auxiliar antes de enviar al backend
        const { contrasena2, ...payload } = itemData;
        const response = await createUser(payload);
        if (response.code === 201) {
          toast({ title: 'Éxito', description: 'Usuario creado correctamente.' });
        } else {
          toast({ title: 'Error', description: response.message || 'Error al crear usuario', variant: 'destructive' });
        }
      } else if (modalMode === 'edit') {
        await updateUser(currentItem._id, itemData);
        toast({ title: 'Éxito', description: 'Usuario actualizado correctamente.' });
      }
      handleCloseModal();
      fetchAndSetUsers();
    } catch (error) {
      console.error('Error saving user:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Ocurrió un problema al guardar el usuario.';
      toast({ title: 'Error', description: errorMessage, variant: 'destructive' });
    }
  };

  const handleDeleteConfirmation = (item) => {
    setItemToDelete(item);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteItem = async () => {
    try {
      if (itemToDelete) {
        const response = await deleteUser(itemToDelete._id);
        if (response.code === 200) {
          toast({ title: 'Usuario eliminado', description: 'El usuario fue eliminado correctamente.' });
        } else {
          throw new Error(response.message || 'Error al eliminar usuario');
        }
      }
    } catch (error) {
      toast({ title: 'Error', description: error.message || 'Ocurrió un problema al eliminar el usuario.', variant: 'destructive' });
    } finally {
      setIsDeleteDialogOpen(false);
      setItemToDelete(null);
      fetchAndSetUsers();
    }
  };

  const FILTER_FIELDS = useMemo(() => (
    [
      usersColumns.find((f) => f.id === 'estado'),
      { id: 'createdAt', label: 'Rango de fechas', type: 'daterange', defaultToday: true },
      // Puedes añadir más filtros (rol) si el backend lo soporta
    ].filter(Boolean)
  ), []);

  const columns = [
    { id: 'estado', label: 'Estado', type: 'status' },
    { id: 'nombre', label: 'Nombre' },
    { id: 'correo', label: 'Correo' },
    { id: 'rol', label: 'Rol' },
    {
      id: 'operador',
      label: 'Operador logístico',
      render: (row) => row?.operador?.nombre || '-',
    },
    {
      id: 'fecha_vencimiento_acceso',
      label: 'Fecha de vencimiento de acceso',
      render: (row) => row?.fecha_vencimiento_acceso || '-',
    },
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle className="text-2xl font-bold">Usuarios</CardTitle>
            <CardDescription>Administra la parametrización de usuarios del sistema.</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setIsDrawerOpen(true)}>
              <FilterIcon className="mr-2 h-4 w-4" /> Filtros
            </Button>
            <Button onClick={() => handleOpenModal('create')}>
              <PlusCircle className="mr-2 h-4 w-4" /> Nuevo Usuario
            </Button>
            <ExportExcelButton
              service={() => exportUsers(filters)}
              columns={columnsExcel}
              fileName={`usuarios_${new Date().toISOString().slice(0, 10)}`}
            />
          </div>
        </CardHeader>
        <CardContent>
          <AppliedFilters
            filters={filters}
            fields={FILTER_FIELDS}
            onRemoveFilter={(key) => setFilters((prev) => {
              const updated = { ...prev };
              delete updated[key];
              return updated;
            })}
          />

          <DataTable
            columns={columns}
            data={displayedData}
            isLoading={isLoading}
            onAction={(actionType, row) => {
              if (actionType === 'edit') return handleOpenModal('edit', row);
              if (actionType === 'delete') return handleDeleteConfirmation(row);
            }}
          />

          <div className="mt-4">
            <Pagination
              currentPage={currentPage}
              totalItems={totalItems}
              itemsPerPage={ITEMS_PER_PAGE}
              onPageChange={handlePageChange}
            />
          </div>
        </CardContent>
      </Card>

      <FilterDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        fields={FILTER_FIELDS}
        onApply={(applied) => { setFilters(applied); setCurrentPage(1); }}
      />

      <DynamicFormModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSave={handleSaveItem}
        fields={usersColumns}
        item={currentItem}
        title={modalMode === 'create' ? 'Crear Usuario' : 'Editar Usuario'}
      />

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar usuario?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará el usuario permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteItem}>Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
};

export default UsuariosPage;