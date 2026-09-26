'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

export function CerrarZButton({ fecha }: { fecha: string }) {
  const router = useRouter();
  const [ocupado, setOcupado] = useState(false);
  const [error, setError] = useState('');
  return (
    <div className="space-y-1">
      <Button
        disabled={ocupado}
        onClick={async () => {
          setOcupado(true);
          setError('');
          try {
            const res = await fetch('/api/pos/reporte-z/cerrar', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ fecha }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error ?? 'No se pudo firmar el cierre Z.');
            router.refresh();
          } catch (e) {
            setError(e instanceof Error ? e.message : 'Error de conexión.');
          } finally {
            setOcupado(false);
          }
        }}
      >
        {ocupado ? 'Guardando...' : 'Registrar cierre Z'}
      </Button>
      {error && (
        <p role="alert" className="max-w-xs text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
