import React from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const UnauthorizedPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full space-y-6">
        <Alert variant="destructive">
          <AlertCircle className="h-5 w-5" />
          <AlertTitle className="ml-2">Acceso no autorizado</AlertTitle>
          <AlertDescription className="mt-2">
            No tienes los permisos necesarios para acceder a esta página.
            Por favor, contacta al administrador si crees que esto es un error.
          </AlertDescription>
        </Alert>
        
        <div className="flex justify-center gap-4 pt-2">
          <Button variant="outline" onClick={() => navigate(-1)}>
            Volver atrás
          </Button>
          <Button onClick={() => navigate('/dashboard')}>
            Ir al inicio
          </Button>
        </div>
      </div>
    </div>
  );
};

export default UnauthorizedPage;
