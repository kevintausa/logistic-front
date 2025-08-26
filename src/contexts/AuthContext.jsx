import React, { createContext, useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/components/ui/use-toast';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// Definir roles y permisos
export const ROLES = {
  ADMIN: 'admin',
  SUPERVISOR: 'supervisor',
  EMPLOYEE: 'operador',
  CLIENT: 'cliente',
  LAUNDRY: 'lavanderia',
  CENTRO_LAVADO: 'centro_lavado',
  DOCUMENTATION: 'documentacion'
};

// Módulos de la aplicación
export const MODULES = {
  DASHBOARD: 'dashboard',
  USERS: 'users',
  DOCUMENT_TYPES: 'document_types',
  CLIENTS: 'clients',
  PROVIDERS: 'providers',
  DOCUMENTATION: 'documentation',
  EMPLOYEES: 'employees',
};

// Permisos por rol
const ROLE_PERMISSIONS = {
  [ROLES.ADMIN]: Object.values(MODULES),
  [ROLES.SUPERVISOR]: [
    MODULES.DASHBOARD,
    MODULES.CLIENTS,
    MODULES.PROVIDERS,
    MODULES.DOCUMENT_TYPES,
  ],
  [ROLES.EMPLOYEE]: [
    MODULES.DASHBOARD,
  ],
  [ROLES.CLIENT]: [
    MODULES.DASHBOARD,
  ],
  [ROLES.LAUNDRY]: [
    MODULES.DASHBOARD,
  ],
  [ROLES.CENTRO_LAVADO]: [
    MODULES.DASHBOARD,
  ],
  [ROLES.DOCUMENTATION]: [
    MODULES.DASHBOARD,
    MODULES.DOCUMENTATION,
    MODULES.EMPLOYEES,
    MODULES.DOCUMENT_TYPES,
  ],
};

// Solo los administradores pueden gestionar usuarios
ROLE_PERMISSIONS[ROLES.ADMIN].push(MODULES.USERS);

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Cargar usuario desde localStorage al iniciar
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const storedToken = localStorage.getItem('token');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error('Error parsing user data', error);
        localStorage.removeItem('user');
      }
    }
    // Si no hay token válido, mantén la app sin sesión (algunos servicios lo usan desde localStorage)
    if (!storedToken) {
      localStorage.removeItem('token');
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      // Contrato esperado: { token | accessToken, user }
      const resp = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ correo: email, contrasena: password }),
      });

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        const message = err.message || 'Credenciales inválidas';
        toast({ title: 'Error de autenticación', description: message, variant: 'destructive' });
        return false;
      }

      const data = await resp.json();
      const token = data.token || data.accessToken;
      const backendUser = data.user || data.usuario || data.data || {};

      // Normalización a la estructura usada por el front
      const normalizedUser = {
        id: backendUser._id || backendUser.id,
        email: backendUser.correo || backendUser.email,
        name: backendUser.nombre || backendUser.name,
        role: backendUser.rol || backendUser.role,
        lavanderia: backendUser.lavanderia || null,
        estado: backendUser.estado,
        raw: backendUser, // opcional para depuración
      };

      if (!normalizedUser.role) {
        // Evitar sesión sin rol válido
        toast({ title: 'Error de autenticación', description: 'Usuario sin rol asignado', variant: 'destructive' });
        return false;
      }

      if (token) localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(normalizedUser));
      setUser(normalizedUser);

      toast({ title: 'Inicio de sesión exitoso', description: `Bienvenido ${normalizedUser.name}` });
      return normalizedUser;
    } catch (error) {
      console.error('Login error:', error);
      toast({
        title: 'Error de autenticación',
        description: 'No fue posible iniciar sesión. Intenta nuevamente.',
        variant: 'destructive',
      });
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    navigate('/login');
  };

  // Solicitar token de recuperación por correo
  const forgotPassword = async (email) => {
    try {
      const resp = await fetch(`${API_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ correo: email }),
      });
      const data = await resp.json().catch(() => ({}));
      if (!resp.ok) {
        const message = data.message || 'No fue posible procesar la solicitud';
        toast({ title: 'Recuperación de contraseña', description: message, variant: 'destructive' });
        return { ok: false };
      }
      // En DEV el backend devuelve token; lo exponemos para pruebas
      const tokenDev = data.token;
      toast({ title: 'Recuperación de contraseña', description: 'Si el correo existe, se enviaron instrucciones.' });
      return { ok: true, token: tokenDev };
    } catch (e) {
      toast({ title: 'Recuperación de contraseña', description: 'Error de red', variant: 'destructive' });
      return { ok: false };
    }
  };

  // Resetear contraseña con token (de enlace de correo)
  const resetPassword = async ({ email, token, nueva }) => {
    try {
      const resp = await fetch(`${API_URL}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ correo: email, token, nueva }),
      });
      const data = await resp.json().catch(() => ({}));
      if (!resp.ok) {
        const message = data.message || 'Token inválido o expirado';
        toast({ title: 'Restablecer contraseña', description: message, variant: 'destructive' });
        return false;
      }
      toast({ title: 'Restablecer contraseña', description: 'Contraseña actualizada' });
      return true;
    } catch (e) {
      toast({ title: 'Restablecer contraseña', description: 'Error de red', variant: 'destructive' });
      return false;
    }
  };

  // Cambio de contraseña estando autenticado
  const changePassword = async ({ actual, nueva }) => {
    try {
      const email = user?.email;
      if (!email) {
        toast({ title: 'Cambiar contraseña', description: 'Sesión inválida', variant: 'destructive' });
        return false;
      }
      const resp = await fetch(`${API_URL}/auth/change-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ correo: email, actual, nueva }),
      });
      const data = await resp.json().catch(() => ({}));
      if (!resp.ok) {
        const message = data.message || 'No fue posible actualizar la contraseña';
        toast({ title: 'Cambiar contraseña', description: message, variant: 'destructive' });
        return false;
      }
      toast({ title: 'Cambiar contraseña', description: 'Contraseña actualizada correctamente' });
      return true;
    } catch (e) {
      toast({ title: 'Cambiar contraseña', description: 'Error de red', variant: 'destructive' });
      return false;
    }
  };

  const hasPermission = (module) => {
    if (!user) return false;
    return ROLE_PERMISSIONS[user.role]?.includes(module) || false;
  };
  
  // Verificar si el usuario es administrador
  const isAdmin = () => {
    if (!user) return false;
    return user.role === ROLES.ADMIN;
  };

  const value = {
    user,
    loading,
    login,
    logout,
    forgotPassword,
    resetPassword,
    changePassword,
    hasPermission,
    isAdmin,
    ROLES,
    MODULES,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};

// Componente de protección de rutas
export const ProtectedRoute = ({ children, requiredModule }) => {
  const { user, loading, hasPermission } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
    } else if (!loading && requiredModule && !hasPermission(requiredModule)) {
      navigate('/unauthorized');
    }
  }, [user, loading, hasPermission, requiredModule, navigate]);

  if (loading || !user || (requiredModule && !hasPermission(requiredModule))) {
    return <div>Cargando...</div>; // Todo: Implementar un componente de carga
  }

  return children;
};
