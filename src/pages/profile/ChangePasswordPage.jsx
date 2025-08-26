import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';

const ChangePasswordPage = () => {
  const { changePassword, user } = useAuth();
  const [actual, setActual] = useState('');
  const [nueva, setNueva] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!nueva || nueva !== confirmar) return;
    setIsLoading(true);
    await changePassword({ actual, nueva });
    setIsLoading(false);
    setActual('');
    setNueva('');
    setConfirmar('');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Cambiar contraseña</CardTitle>
          <CardDescription className="text-center">
            Usuario: <span className="font-medium">{user?.email}</span>
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="actual">Contraseña actual</Label>
              <Input id="actual" type="password" value={actual} onChange={(e) => setActual(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nueva">Nueva contraseña</Label>
              <Input id="nueva" type="password" value={nueva} onChange={(e) => setNueva(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmar">Confirmar contraseña</Label>
              <Input id="confirmar" type="password" value={confirmar} onChange={(e) => setConfirmar(e.target.value)} required />
              {confirmar && confirmar !== nueva && (
                <div className="text-xs text-destructive">Las contraseñas no coinciden</div>
              )}
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" disabled={isLoading || !actual || !nueva || nueva !== confirmar}>
              {isLoading ? 'Guardando...' : 'Actualizar contraseña'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default ChangePasswordPage;
