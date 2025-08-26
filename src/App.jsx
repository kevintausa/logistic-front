import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import HomePage from '@/pages/HomePage';
import DashboardPage from '@/pages/DashboardPage';
import WorkplacesPage from '@/pages/WorkplacesPage';
import EmployeesPage from '@/pages/parametrizacion/employees/EmployeesPage';
import ProductsPage from '@/pages/parametrizacion/products/ProductsPage';
import ServicesPage from '@/pages/parametrizacion/services/ServicesPage';
import ProvidersPage from '@/pages/parametrizacion/providers/ProvidersPage';

import LaundriesPage from '@/pages/parametrizacion/laundries/LaundriesPage';
import ClientsParametrizationPage from '@/pages/parametrizacion/clients/ClientsPage';
import MachinesPage from './pages/parametrizacion/machines/MachinesPage';
import GarmentTypesPage from './pages/parametrizacion/garmentTypes/GarmentTypesPage';
import WashingProgramsPage from './pages/parametrizacion/washingPrograms/WashingProgramsPage';
import ClientsPage from '@/pages/ClientsPage';
import TimeClockPage from '@/pages/TimeClockPage';
import HoursTrackingPage from '@/pages/HoursTrackingPage';
import LaundryReceptionPage from '@/pages/LaundryReceptionPage';
import InventoryReturnsPage from '@/pages/InventoryReturnsPage';
import LoginPage from '@/pages/LoginPage';
import UnauthorizedPage from '@/pages/UnauthorizedPage';
import UsuariosPage from '@/pages/parametrizacion/usuarios/UsuariosPage';
import DirtyClothesReceptionPage from '@/pages/reception/DirtyClothesReceptionPage';
import WashingCyclesPage from '@/pages/washingCycles/WashingCyclesPage';
import UtilityServicesPage from '@/pages/utilityServices/UtilityServicesPage';
import WorkedHoursPage from '@/pages/workedHours/WorkedHoursPage';
import InventoryRegistriesPage from '@/pages/inventoryRegistries/InventoryRegistriesPage';
import ShiftManagementPage from '@/pages/shiftManagement/ShiftManagementPage';
import WeeklyOverviewPage from '@/pages/shiftManagement/WeeklyOverviewPage';
import LaundryDashboard from '@/pages/laundry/LaundryDashboard';
import OperatorDashboard from '@/pages/operator/OperatorDashboard';
import OperatorClockInPage from '@/pages/operator/OperatorClockInPage';
import OperatorRecordsPage from '@/pages/operator/OperatorRecordsPage';
import OperatorShiftsPage from '@/pages/operator/OperatorShiftsPage';
import OperatorDocumentsPage from '@/pages/operator/OperatorDocumentsPage';
import ForgotPasswordPage from '@/pages/ForgotPasswordPage';
import ResetPasswordPage from '@/pages/ResetPasswordPage';
import ChangePasswordPage from '@/pages/profile/ChangePasswordPage';
import { Toaster } from '@/components/ui/toaster';
import { DataProvider } from '@/contexts/DataContext';
import { AuthProvider, useAuth, ProtectedRoute, MODULES } from '@/contexts/AuthContext';
import ReportsPage from '@/pages/reports/ReportsPage';
import LaundryProductsPage from '@/pages/laundry/LaundryProductsPage';
import EmployeeDocumentsPage from '@/pages/documents/EmployeeDocumentsPage';
import LaundryCenterDocumentsPage from '@/pages/documents/LaundryCenterDocumentsPage';
import DocumentationHomePage from '@/pages/documents/DocumentationHomePage';
import EmployeesDocsHome from '@/pages/documents/EmployeesDocsHome';
import CentersDocsHome from '@/pages/documents/CentersDocsHome';
import DocumentTypesPage from '@/pages/parametrizacion/documentTypes/DocumentTypesPage';

// Utilidad: detectar si el usuario es operario/operador
const isOperarioUser = (user) => {
  if (!user) return false;
  // roles en array
  if (Array.isArray(user.roles)) {
    const roles = user.roles.map((r) => String(r || '').toLowerCase().trim());
    if (roles.includes('operario') || roles.includes('operador')) return true;
  }
  // rol/role en string
  const primary = String(user.rol ?? user.role ?? '').toLowerCase().trim();
  return primary === 'operario' || primary === 'operador';
};

// Componente para rutas públicas que redirigen si el usuario ya está autenticado
const PublicRoute = ({ children }) => {
  const { user } = useAuth();
  if (!user) return children;
  const isOperario = isOperarioUser(user);
  return <Navigate to={isOperario ? '/operario-dashboard' : '/dashboard'} replace />;
};

// Landing por defecto según rol
const DefaultLanding = () => {
  const { user } = useAuth();
  const isOperario = isOperarioUser(user);
  return <Navigate to={isOperario ? '/operario-dashboard' : '/dashboard'} replace />;
};

function AppContent() {
  return (
    <Layout>
      <Routes>
        {/* Rutas públicas */}
        <Route path="/login" element={
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        } />
        <Route path="/forgot-password" element={
          <PublicRoute>
            <ForgotPasswordPage />
          </PublicRoute>
        } />
        <Route path="/reset-password" element={
          <PublicRoute>
            <ResetPasswordPage />
          </PublicRoute>
        } />
        
        {/* Ruta raíz redirige según rol si autenticado, sino a login */}
        <Route path="/" element={
          <ProtectedRoute>
            <DefaultLanding />
          </ProtectedRoute>
        } />

        {/* Rutas protegidas */}
        <Route path="/dashboard" element={
          <ProtectedRoute requiredModule="dashboard">
            <DashboardPage />
          </ProtectedRoute>
        } />
        
        <Route path="/centros-lavado" element={
          <ProtectedRoute requiredModule="workplaces">
            <WorkplacesPage />
          </ProtectedRoute>
        } />
        
        <Route path="/parametrizacion/empleados" element={
          <ProtectedRoute requiredModule="employees">
            <EmployeesPage />
          </ProtectedRoute>
        } />
        
        <Route path="/parametrizacion/productos" element={
          <ProtectedRoute requiredModule="products">
            <ProductsPage />
          </ProtectedRoute>
        } />

        <Route path="/parametrizacion/proveedores" element={
          <ProtectedRoute requiredModule="providers">
            <ProvidersPage />
          </ProtectedRoute>
        } />
        
        <Route path="/parametrizacion/centros-lavado" element={
          <ProtectedRoute requiredModule="laundries">
            <LaundriesPage />
          </ProtectedRoute>
        } />

        <Route path="/parametrizacion/clientes" element={
          <ProtectedRoute requiredModule="clients">
            <ClientsParametrizationPage />
          </ProtectedRoute>
        } />

        <Route path="/parametrizacion/lavadoras" element={
          <ProtectedRoute requiredModule="machines">
            <MachinesPage />
          </ProtectedRoute>
        } />
        
        <Route path="/parametrizacion/tipos-prenda" element={
          <ProtectedRoute requiredModule="garment_types">
            <GarmentTypesPage />
          </ProtectedRoute>
        } />
        
        <Route path="/parametrizacion/programas-lavado" element={
          <ProtectedRoute requiredModule="washing_programs">
            <WashingProgramsPage />
          </ProtectedRoute>
        } />
        
        <Route path="/parametrizacion/tipos-archivo" element={
          <ProtectedRoute requiredModule="document_types">
            <DocumentTypesPage />
          </ProtectedRoute>
        } />
        
        <Route path="/parametrizacion/servicios" element={
          <ProtectedRoute requiredModule="services">
            <ServicesPage />
          </ProtectedRoute>
        } />
        
        <Route path="/parametrizacion/usuarios" element={
          <ProtectedRoute requiredModule="users">
            <UsuariosPage />
          </ProtectedRoute>
        } />
        
        <Route path="/clientes" element={
          <ProtectedRoute requiredModule="clients">
            <ClientsPage />
          </ProtectedRoute>
        } />
        
        <Route path="/fichaje" element={
          <ProtectedRoute>
            <TimeClockPage />
          </ProtectedRoute>
        } />
        
        <Route path="/horas" element={
          <ProtectedRoute>
            <HoursTrackingPage />
          </ProtectedRoute>
        } />
        
        <Route path="/centros-lavado/:idLavanderia" element={
          <ProtectedRoute requiredModule="workplaces">
            <LaundryDashboard />
          </ProtectedRoute>
        } />
        
        <Route path="/centros-lavado/:idLavanderia/recepcion" element={
          <ProtectedRoute requiredModule="workplaces">
            <DirtyClothesReceptionPage />
          </ProtectedRoute>
        } />
        
        <Route path="/centros-lavado/:idLavanderia/ciclos" element={
          <ProtectedRoute requiredModule="workplaces">
            <WashingCyclesPage />
          </ProtectedRoute>
        } />
        
        <Route path="/centros-lavado/:idLavanderia/servicios" element={
          <ProtectedRoute requiredModule="workplaces">
            <UtilityServicesPage />
          </ProtectedRoute>
        } />
        
        <Route path="/centros-lavado/:idLavanderia/productos" element={
          <ProtectedRoute requiredModule="workplaces">
            <LaundryProductsPage />
          </ProtectedRoute>
        } />
        
        {/* Reportes */}
        <Route path="/reportes" element={
          <ProtectedRoute requiredModule="reports">
            <ReportsPage />
          </ProtectedRoute>
        } />

        {/* Operario */}
        <Route path="/operario-dashboard" element={
          <ProtectedRoute requiredModule="operario">
            <OperatorDashboard />
          </ProtectedRoute>
        } />
        <Route path="/operario/llegada" element={
          <ProtectedRoute requiredModule="operario">
            <OperatorClockInPage />
          </ProtectedRoute>
        } />
        <Route path="/operario/registros" element={
          <ProtectedRoute requiredModule="operario">
            <OperatorRecordsPage />
          </ProtectedRoute>
        } />
        <Route path="/operario/turnos" element={
          <ProtectedRoute requiredModule="operario">
            <OperatorShiftsPage />
          </ProtectedRoute>
        } />
        <Route path="/operario/documentos" element={
          <ProtectedRoute requiredModule="operario">
            <OperatorDocumentsPage />
          </ProtectedRoute>
        } />
        
        <Route path="/centros-lavado/:idLavanderia/horas" element={
          <ProtectedRoute requiredModule="workplaces">
            <WorkedHoursPage />
          </ProtectedRoute>
        } />
        
        <Route path="/centros-lavado/:idLavanderia/inventarios" element={
          <ProtectedRoute requiredModule="workplaces">
            <InventoryRegistriesPage />
          </ProtectedRoute>
        } />

        {/* Documentos */}
        <Route path="/documentacion" element={
          <ProtectedRoute requiredModule={MODULES.DOCUMENTATION}>
            <DocumentationHomePage />
          </ProtectedRoute>
        } />
        <Route path="/documentacion/empleados" element={
          <ProtectedRoute requiredModule={MODULES.DOCUMENTATION}>
            <EmployeesDocsHome />
          </ProtectedRoute>
        } />
        <Route path="/documentacion/centros" element={
          <ProtectedRoute requiredModule={MODULES.DOCUMENTATION}>
            <CentersDocsHome />
          </ProtectedRoute>
        } />
        <Route path="/documentacion/empleados/:idEmpleado" element={
          <ProtectedRoute requiredModule="employees">
            <EmployeeDocumentsPage />
          </ProtectedRoute>
        } />
        <Route path="/documentacion/centros/:idLavanderia" element={
          <ProtectedRoute requiredModule="workplaces">
            <LaundryCenterDocumentsPage />
          </ProtectedRoute>
        } />
        <Route path="/parametrizacion/empleados/:idEmpleado/documentos" element={
          <ProtectedRoute requiredModule="employees">
            <EmployeeDocumentsPage />
          </ProtectedRoute>
        } />
        <Route path="/centros-lavado/:idLavanderia/documentos" element={
          <ProtectedRoute requiredModule="workplaces">
            <LaundryCenterDocumentsPage />
          </ProtectedRoute>
        } />
        {/* Alias para compatibilidad con tarjetas existentes */}
        <Route path="/centros-lavado/:idLavanderia/documentacion" element={
          <ProtectedRoute requiredModule="workplaces">
            <LaundryCenterDocumentsPage />
          </ProtectedRoute>
        } />
        
        <Route path="/centros-lavado/:idLavanderia/turnos" element={
          <ProtectedRoute requiredModule="workplaces">
            <ShiftManagementPage />
          </ProtectedRoute>
        } />

        <Route path="/supervision/turnos" element={
          <ProtectedRoute requiredModule="workplaces">
            <WeeklyOverviewPage />
          </ProtectedRoute>
        } />
        
        <Route path="/inventario" element={
          <ProtectedRoute>
            <InventoryReturnsPage />
          </ProtectedRoute>
        } />
        
        {/* Perfil */}
        <Route path="/perfil/cambiar-contrasena" element={
          <ProtectedRoute>
            <ChangePasswordPage />
          </ProtectedRoute>
        } />
        
        <Route path="/unauthorized" element={<UnauthorizedPage />} />
        
        {/* Ruta por defecto para páginas no encontradas */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <DataProvider>
          <AppContent />
          <Toaster />
        </DataProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;