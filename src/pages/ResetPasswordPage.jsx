import React, { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';

const ResetPasswordPage = () => {
  const [params] = useSearchParams();
  const email = useMemo(() => params.get('email') || '', [params]);
  const token = useMemo(() => params.get('token') || '', [params]);
  const [nueva, setNueva] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [showNueva, setShowNueva] = useState(false);
  const [showConfirmar, setShowConfirmar] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { resetPassword } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !token) return;
    if (nueva !== confirmar) return;
    setIsLoading(true);
    const ok = await resetPassword({ email, token, nueva });
    setIsLoading(false);
    if (ok) navigate('/login');
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
          <CardTitle className="text-2xl font-bold text-center">Restablecer contraseña</CardTitle>
          <CardDescription className="text-center text-slate-200/80">
            Define tu nueva contraseña para el correo indicado
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-1 text-sm">
              <div><span className="font-medium">Correo: </span>{email || 'No provisto'}</div>
              <div className="truncate"><span className="font-medium">Token: </span>{token || 'No provisto'}</div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="nueva">Nueva contraseña</Label>
              <div className="relative">
                <Input id="nueva" type={showNueva ? 'text' : 'password'} value={nueva} onChange={(e) => setNueva(e.target.value)} required className="pr-24" />
                <button
                  type="button"
                  onClick={() => setShowNueva((v) => !v)}
                  className="absolute inset-y-0 right-2 my-auto h-9 px-3 rounded-md text-xs font-medium bg-white/10 hover:bg-white/20 text-white border border-white/10 transition"
                  aria-label={showNueva ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {showNueva ? 'Ocultar' : 'Mostrar'}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmar">Confirmar contraseña</Label>
              <div className="relative">
                <Input id="confirmar" type={showConfirmar ? 'text' : 'password'} value={confirmar} onChange={(e) => setConfirmar(e.target.value)} required className="pr-24" />
                <button
                  type="button"
                  onClick={() => setShowConfirmar((v) => !v)}
                  className="absolute inset-y-0 right-2 my-auto h-9 px-3 rounded-md text-xs font-medium bg-white/10 hover:bg-white/20 text-white border border-white/10 transition"
                  aria-label={showConfirmar ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {showConfirmar ? 'Ocultar' : 'Mostrar'}
                </button>
              </div>
              {confirmar && confirmar !== nueva && (
                <div className="text-xs text-destructive">Las contraseñas no coinciden</div>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-3">
            <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-500 text-white" disabled={isLoading || !email || !token || !nueva || nueva !== confirmar}>
              {isLoading ? 'Actualizando...' : 'Restablecer contraseña'}
            </Button>
            <Button type="button" variant="link" onClick={() => navigate('/login')}>
              Volver al inicio de sesión
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default ResetPasswordPage;
