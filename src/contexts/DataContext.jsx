import React, { createContext, useState, useEffect, useContext } from 'react';
import { useToast } from '@/components/ui/use-toast';

const DataContext = createContext();

export const useData = () => useContext(DataContext);

const initialWorkplaces = [
  { id: 'wp1', name: 'Lavandería Central', address: 'Calle Principal 123', dailyGarments: 120, dailyKilos: 300, employees: 7 },
  { id: 'wp2', name: 'Sucursal Norte', address: 'Avenida Norte 456', dailyGarments: 80, dailyKilos: 200, employees: 2 },
];

const initialEmployees = [
  { id: 'emp1', name: 'Ana Pérez', workplaceId: 'wp1', schedule: 'L-V 8:00-17:00' },
  { id: 'emp2', name: 'Luis García', workplaceId: 'wp2', schedule: 'L-V 9:00-18:00' },
  { id: 'emp3', name: 'Maria Rodriguez', workplaceId: 'wp1', schedule: 'S-D 10:00-16:00' },
];

const initialClients = [
  { id: 'cli1', name: 'Hotel Paraíso Azul', contact: 'reservas@paraiso.com', currentInventory: 50 },
  { id: 'cli2', name: 'Resort Solymar', contact: 'info@solymar.es', currentInventory: 75 },
];

const initialLaundryReceptions = [
  { id: 'rec1', date: '2025-05-15', clientId: 'cli1', garments: 50, kilos: 12.5, photoUrl: null, invoiceId: 'inv1' },
  { id: 'rec2', date: '2025-05-16', clientId: 'cli2', garments: 75, kilos: 20.0, photoUrl: null, invoiceId: 'inv2' },
];

const initialTimeClockEntries = [
    {id: 'tc1', employeeId: 'emp1', workplaceId: 'wp1', entryTime: new Date('2025-05-16T08:00:00').toISOString(), exitTime: new Date('2025-05-16T17:00:00').toISOString(), date: '2025-05-16'},
    {id: 'tc2', employeeId: 'emp2', workplaceId: 'wp2', entryTime: new Date('2025-05-16T09:00:00').toISOString(), exitTime: new Date('2025-05-16T18:00:00').toISOString(), date: '2025-05-16'},
];

const initialInventoryReturns = [
    {id: 'ret1', date: '2025-05-16', clientId: 'cli1', garmentsReturned: 30, photoUrl: null, receiptId: 'rcpt1'},
];


export const DataProvider = ({ children }) => {
  const { toast } = useToast();

  const loadFromLocalStorage = (key, initialData) => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialData;
    } catch (error) {
      console.error(`Error loading ${key} from localStorage`, error);
      return initialData;
    }
  };

  const saveToLocalStorage = (key, data) => {
    try {
      window.localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.error(`Error saving ${key} to localStorage`, error);
    }
  };

  const [workplaces, setWorkplaces] = useState(() => loadFromLocalStorage('workplaces', initialWorkplaces));
  const [employees, setEmployees] = useState(() => loadFromLocalStorage('employees', initialEmployees));
  const [clients, setClients] = useState(() => loadFromLocalStorage('clients', initialClients));
  const [laundryReceptions, setLaundryReceptions] = useState(() => loadFromLocalStorage('laundryReceptions', initialLaundryReceptions));
  const [timeClockEntries, setTimeClockEntries] = useState(() => loadFromLocalStorage('timeClockEntries', initialTimeClockEntries));
  const [inventoryReturns, setInventoryReturns] = useState(() => loadFromLocalStorage('inventoryReturns', initialInventoryReturns));

  useEffect(() => saveToLocalStorage('workplaces', workplaces), [workplaces]);
  useEffect(() => saveToLocalStorage('employees', employees), [employees]);
  useEffect(() => saveToLocalStorage('clients', clients), [clients]);
  useEffect(() => saveToLocalStorage('laundryReceptions', laundryReceptions), [laundryReceptions]);
  useEffect(() => saveToLocalStorage('timeClockEntries', timeClockEntries), [timeClockEntries]);
  useEffect(() => saveToLocalStorage('inventoryReturns', inventoryReturns), [inventoryReturns]);

  const generateId = () => `id_${new Date().getTime()}_${Math.random().toString(36).substr(2, 9)}`;

  const crudOperations = (state, setState, itemName) => ({
    getAll: () => state,
    getById: (id) => state.find(item => item.id === id),
    create: (newItemData) => {
      const newItem = { ...newItemData, id: generateId() };
      setState(prev => [...prev, newItem]);
      toast({ title: `${itemName} Creado`, description: `${itemName} "${newItem.name || newItem.id}" ha sido añadido.` });
      return newItem;
    },
    update: (id, updatedData) => {
      setState(prev => prev.map(item => (item.id === id ? { ...item, ...updatedData } : item)));
      const updatedItem = state.find(item => item.id === id);
      toast({ title: `${itemName} Actualizado`, description: `${itemName} "${updatedItem?.name || id}" ha sido modificado.` });
    },
    delete: (id) => {
      const itemToDelete = state.find(item => item.id === id);
      setState(prev => prev.filter(item => item.id !== id));
      toast({ title: `${itemName} Eliminado`, description: `${itemName} "${itemToDelete?.name || id}" ha sido eliminado.`, variant: 'destructive' });
    }
  });

  const workplaceActions = crudOperations(workplaces, setWorkplaces, 'Lugar de Trabajo');
  const employeeActions = crudOperations(employees, setEmployees, 'Empleado');
  const clientActions = {
    ...crudOperations(clients, setClients, 'Cliente'),
    updateInventory: (clientId, amount) => {
        setClients(prevClients => 
            prevClients.map(client => 
                client.id === clientId 
                ? { ...client, currentInventory: (client.currentInventory || 0) + amount } 
                : client
            )
        );
    }
  };
  const laundryReceptionActions = {
    ...crudOperations(laundryReceptions, setLaundryReceptions, 'Recepción de Ropa'),
    create: (newItemData) => {
        const newItem = { ...newItemData, id: generateId(), invoiceId: `inv_${generateId()}` };
        setLaundryReceptions(prev => [...prev, newItem]);
        clientActions.updateInventory(newItem.clientId, newItem.garments);
        toast({ title: `Recepción Creada`, description: `Recepción para cliente "${clients.find(c=>c.id === newItem.clientId)?.name}" ha sido añadida. Factura: ${newItem.invoiceId}` });
        return newItem;
    }
  };
  
  const timeClockActions = crudOperations(timeClockEntries, setTimeClockEntries, 'Fichaje');
  const inventoryReturnActions = {
    ...crudOperations(inventoryReturns, setInventoryReturns, 'Devolución de Ropa'),
    create: (newItemData) => {
        const newItem = { ...newItemData, id: generateId(), receiptId: `rcpt_${generateId()}` };
        setInventoryReturns(prev => [...prev, newItem]);
        clientActions.updateInventory(newItem.clientId, -newItem.garmentsReturned);
        toast({ title: `Devolución Registrada`, description: `Devolución para cliente "${clients.find(c=>c.id === newItem.clientId)?.name}" registrada. Comprobante: ${newItem.receiptId}` });
        return newItem;
    }
  };


  const value = {
    workplaces, workplaceActions,
    employees, employeeActions,
    clients, clientActions,
    laundryReceptions, laundryReceptionActions,
    timeClockEntries, timeClockActions,
    inventoryReturns, inventoryReturnActions,
    generateId,
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};