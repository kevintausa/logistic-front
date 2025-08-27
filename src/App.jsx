import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import DashboardPage from '@/pages/DashboardPage';
import ProvidersPage from '@/pages/parametrizacion/providers/ProvidersPage';
import ClientsParametrizationPage from '@/pages/parametrizacion/clients/ClientsPage';
import OperatorsPage from '@/pages/parametrizacion/operators/OperatorsPage';
import OperationTypesPage from '@/pages/parametrizacion/operation-types/OperationTypesPage';
import ViasPage from '@/pages/parametrizacion/vias/ViasPage';
import LoadingPortsPage from '@/pages/parametrizacion/loading-ports/LoadingPortsPage';
import LoginPage from '@/pages/LoginPage';
import UnauthorizedPage from '@/pages/UnauthorizedPage';
import UsuariosPage from '@/pages/parametrizacion/usuarios/UsuariosPage';
import ForgotPasswordPage from '@/pages/ForgotPasswordPage';
import ResetPasswordPage from '@/pages/ResetPasswordPage';
import ChangePasswordPage from '@/pages/profile/ChangePasswordPage';
import { Toaster } from '@/components/ui/toaster';
import { DataProvider } from '@/contexts/DataContext';
import { AuthProvider, useAuth, ProtectedRoute, MODULES } from '@/contexts/AuthContext';
import EmployeeDocumentsPage from '@/pages/documents/EmployeeDocumentsPage';
import DocumentationHomePage from '@/pages/documents/DocumentationHomePage';
import EmployeesDocsHome from '@/pages/documents/EmployeesDocsHome';
import CentersDocsHome from '@/pages/documents/CentersDocsHome';
import DocumentTypesPage from '@/pages/parametrizacion/documentTypes/DocumentTypesPage';

// Redirecciones simples al dashboard cuando el usuario está autenticado

// Componente para rutas públicas que redirigen si el usuario ya está autenticado
const PublicRoute = ({ children }) => {
  const { user } = useAuth();
  if (!user) return children;
  return <Navigate to={'/dashboard'} replace />;
};

// Landing por defecto según rol
const DefaultLanding = () => {
  const { user } = useAuth();
  return <Navigate to={'/dashboard'} replace />;
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
        
        <Route path="/parametrizacion/proveedores" element={
          <ProtectedRoute requiredModule="providers">
            <ProvidersPage />
          </ProtectedRoute>
        } />

        <Route path="/parametrizacion/clientes" element={
          <ProtectedRoute requiredModule="clients">
            <ClientsParametrizationPage />
          </ProtectedRoute>
        } />
        <Route path="/parametrizacion/operadores" element={
          <ProtectedRoute requiredModule="operators">
            <OperatorsPage />
          </ProtectedRoute>
        } />
        
        <Route path="/parametrizacion/tipos-archivo" element={
          <ProtectedRoute requiredModule="document_types">
            <DocumentTypesPage />
          </ProtectedRoute>
        } />
        
        <Route path="/parametrizacion/usuarios" element={
          <ProtectedRoute requiredModule="users">
            <UsuariosPage />
          </ProtectedRoute>
        } />

        {/* Parametrización adicionales */
        }
        <Route path="/parametrizacion/tipos-operacion" element={
          <ProtectedRoute requiredModule={MODULES.OPERATION_TYPES}>
            <OperationTypesPage />
          </ProtectedRoute>
        } />
        <Route path="/parametrizacion/vias" element={
          <ProtectedRoute requiredModule={MODULES.VIAS}>
            <ViasPage />
          </ProtectedRoute>
        } />
        <Route path="/parametrizacion/puertos-carga" element={
          <ProtectedRoute requiredModule={MODULES.LOADING_PORTS}>
            <LoadingPortsPage />
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