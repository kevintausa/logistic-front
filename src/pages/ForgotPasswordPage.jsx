import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [devToken, setDevToken] = useState('');
  const { forgotPassword } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    const res = await forgotPassword(email);
    if (res?.ok) {
      // Solo para DEV: si backend devuelve token, lo mostramos y permitimos ir a la pantalla de reset
      if (res.token) setDevToken(res.token);
    }
    setIsLoading(false);
  };

  const goToReset = () => {
    if (!devToken) return;
    // En un entorno real, este token llegaría por correo como enlace
    navigate(`/reset-password?email=${encodeURIComponent(email)}&token=${encodeURIComponent(devToken)}`);
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-800">
      {/* Decoración de fondo */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-32 -right-20 h-72 w-72 rounded-full bg-indigo-500/20 blur-3xl" />
        <div className="absolute -bottom-24 -left-10 h-72 w-72 rounded-full bg-fuchsia-500/10 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(transparent_1px,_rgba(255,255,255,0.04)_1px)] [background-size:16px_16px]" />
      </div>

      <Card className="w-full max-w-md shadow-2xl border-0 backdrop-blur supports-[backdrop-filter]:bg-white/10 bg-white/10 text-white">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Recuperar contraseña</CardTitle>
          <CardDescription className="text-center text-slate-200/80">
            Ingresa tu correo y te enviaremos instrucciones para restablecer tu contraseña
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
              />
            </div>
            {!!devToken && (
              <div className="text-xs p-3 rounded bg-white/10 border border-white/10">
                <div className="font-medium">Token DEV (solo en desarrollo)</div>
                <div className="break-all">{devToken}</div>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex flex-col space-y-3">
            <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-500 text-white" disabled={isLoading}>
              {isLoading ? 'Enviando...' : 'Enviar instrucciones'}
            </Button>
            {!!devToken && (
              <Button type="button" variant="secondary" onClick={goToReset} className="bg-white/10 hover:bg-white/20 text-white border border-white/10">
                Usar token DEV para restablecer ahora
              </Button>
            )}
            <Button type="button" variant="link" onClick={() => navigate('/login')} className="text-indigo-200 hover:text-white">
              Volver al inicio de sesión
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default ForgotPasswordPage;
