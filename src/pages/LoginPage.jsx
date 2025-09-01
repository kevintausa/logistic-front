import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const loggedUser = await login(email, password);
      if (loggedUser) {
        // Decidir ruta por rol directamente con el usuario devuelto
        const rolesArr = Array.isArray(loggedUser?.roles) ? loggedUser.roles.map((r) => String(r || '').toLowerCase().trim()) : [];
        const primary = String(loggedUser?.rol ?? loggedUser?.role ?? '').toLowerCase().trim();
        const isOperario = rolesArr.includes('operario') || rolesArr.includes('operador') || primary === 'operario' || primary === 'operador';
        navigate(isOperario ? '/operario-dashboard' : '/dashboard', { replace: true });
      }
    } catch (error) {
      console.error('Error during login:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen">
      {/* Fondo de página full-bleed con soporte claro/oscuro */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-white via-indigo-50 to-slate-50 dark:from-slate-900 dark:via-indigo-900 dark:to-slate-800" />
        <div className="absolute -top-32 -right-20 h-72 w-72 rounded-full bg-indigo-400/20 dark:bg-indigo-500/20 blur-3xl" />
        <div className="absolute -bottom-24 -left-10 h-72 w-72 rounded-full bg-fuchsia-400/10 dark:bg-fuchsia-500/10 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(rgba(0,0,0,0.03)_1px,_transparent_1px)] dark:bg-[radial-gradient(transparent_1px,_rgba(255,255,255,0.04)_1px)] [background-size:16px_16px]" />
      </div>

      <div className="relative z-10 min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md shadow-2xl border bg-white text-slate-900 dark:border-0 dark:backdrop-blur dark:supports-[backdrop-filter]:bg-white/10 dark:bg-white/10 dark:text-white">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Iniciar sesión</CardTitle>
          <CardDescription className="text-center text-slate-600 dark:text-slate-200/80">
            Ingresa tus credenciales para acceder al sistema
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Correo electrónico</Label>
              <Input
                id="email"
                type="email"
                placeholder="usuario@ejemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-white text-slate-900 placeholder:text-slate-400 dark:bg-white/10 dark:text-white"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Contraseña</Label>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="pr-24 bg-white text-slate-900 placeholder:text-slate-400 dark:bg-white/10 dark:text-white"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute inset-y-0 right-2 my-auto h-9 px-3 rounded-md text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition dark:bg-white/10 dark:hover:bg-white/20 dark:text-white dark:border-white/10"
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {showPassword ? 'Ocultar' : 'Mostrar'}
                </button>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-500 text-white" disabled={isLoading}>
              {isLoading ? 'Iniciando sesión...' : 'Iniciar sesión'}
            </Button>
            <button
                  type="button"
                  onClick={() => navigate('/forgot-password')}
                  className="text-sm text-indigo-600 hover:text-indigo-700 hover:underline dark:text-indigo-200 dark:hover:text-white"
                >
                  Olvidé mi contraseña
                </button>
            <div className="text-sm text-muted-foreground text-center">
              <span className="text-slate-600 dark:text-slate-200/80">¿No tienes una cuenta? </span>
              <span className="text-indigo-600 cursor-pointer hover:text-indigo-700 hover:underline dark:text-indigo-200 dark:hover:text-white">
                Contacta al administrador
              </span>
            </div>
          </CardFooter>
        </form>
      </Card>
      </div>
    </div>
  );
};

export default LoginPage;
