'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ShieldCheck } from 'lucide-react';

export default function ClaimSuperAdminPage() {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState<{ tipo: 'ok' | 'error'; texto: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMensaje(null);
    try {
      const res = await fetch('/api/claim-superadmin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code })
      });
      const data = await res.json();
      if (res.ok) {
        setMensaje({ tipo: 'ok', texto: data.message });
      } else {
        setMensaje({ tipo: 'error', texto: data.error || 'No se pudo procesar la solicitud.' });
      }
    } catch {
      setMensaje({ tipo: 'error', texto: 'Error de conexión. Intenta de nuevo.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-brand-1" />
            Reclamar acceso de Super Admin
          </CardTitle>
          <CardDescription>
            Debes haber iniciado sesión primero. Ingresa el código configurado en la variable de entorno
            <code className="mx-1 px-1 py-0.5 rounded bg-muted text-foreground">SUPERADMIN_CLAIM_CODE</code>
            para promover tu cuenta actual a super_admin. Solo funciona una vez, mientras no exista ya un super_admin.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Código</label>
              <Input
                type="password"
                required
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Código secreto"
                autoFocus
              />
            </div>

            {mensaje && (
              <div
                className={
                  mensaje.tipo === 'ok'
                    ? 'p-3 rounded bg-success-bg border border-success/30 text-success text-sm'
                    : 'p-3 rounded bg-danger-bg border border-destructive/30 text-destructive text-sm'
                }
              >
                {mensaje.texto}
              </div>
            )}

            <Button type="submit" disabled={loading} className="w-full bg-brand-1 hover:bg-brand-2 text-white">
              {loading ? 'Verificando...' : 'Reclamar Super Admin'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
