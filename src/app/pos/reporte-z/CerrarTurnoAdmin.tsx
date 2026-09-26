'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function CerrarTurnoAdmin({ turnoId, cajero }: { turnoId: string; cajero: string }) {
  const router = useRouter();
  const [abierto, setAbierto] = useState(false);
  const [monto, setMonto] = useState('');
  const [error, setError] = useState('');
  const [ocupado, setOcupado] = useState(false);

  if (!abierto)
    return (
      <Button variant="outline" size="sm" onClick={() => setAbierto(true)}>
        Cerrar turno de {cajero}
      </Button>
    );
  return (
    <div className="flex flex-wrap items-end gap-2 rounded-md border border-border p-3">
      <div>
        <label htmlFor={`contado-${turnoId}`} className="text-xs text-muted-foreground">
          Efectivo contado de {cajero} ($)
        </label>
        <Input
          id={`contado-${turnoId}`}
          type="number"
          min="0"
          step="0.01"
          value={monto}
          onChange={(e) => setMonto(e.target.value)}
          className="mt-1 w-40"
        />
      </div>
      <Button
        size="sm"
        disabled={ocupado || monto === '' || !Number.isFinite(Number(monto)) || Number(monto) < 0}
        onClick={async () => {
          setError('');
          setOcupado(true);
          try {
            const res = await fetch('/api/pos/turno/cerrar', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ turnoId, montoContadoCierre: Number(monto) }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error ?? 'No se pudo cerrar el turno.');
            router.refresh();
          } catch (e) {
            setError(e instanceof Error ? e.message : 'Error de conexión.');
          } finally {
            setOcupado(false);
          }
        }}
      >
        {ocupado ? 'Cerrando...' : 'Confirmar cierre'}
      </Button>
      <Button size="sm" variant="ghost" disabled={ocupado} onClick={() => setAbierto(false)}>
        Cancelar
      </Button>
      {error && (
        <p role="alert" className="w-full text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
