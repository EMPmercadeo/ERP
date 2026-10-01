'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { ReceiptText, Store, UtensilsCrossed } from 'lucide-react';
import { cn } from '@/lib/utils';

const MostradorPOS = dynamic(() => import('./MostradorPOS'), {
  loading: () => <p className="px-4 py-8 text-sm text-muted-foreground">Cargando mostrador...</p>,
});
const MesasClient = dynamic(() => import('./mesas/MesasClient'), {
  loading: () => <p className="px-4 py-8 text-sm text-muted-foreground">Cargando salón...</p>,
});

type Modo = 'mostrador' | 'salon';

export default function POSWorkspace({
  modoInicial,
  puedeSalon,
  puedeMostrador,
  puedeCerrarZ,
}: {
  modoInicial: Modo;
  puedeSalon: boolean;
  puedeMostrador: boolean;
  puedeCerrarZ: boolean;
}) {
  const [modo, setModo] = useState<Modo>(modoInicial);
  const [abiertos, setAbiertos] = useState<Modo[]>([modoInicial]);

  const cambiarModo = (siguiente: Modo) => {
    if (siguiente === modo) return;
    setAbiertos((actual) => (actual.includes(siguiente) ? actual : [...actual, siguiente]));
    setModo(siguiente);
    const url = new URL(window.location.href);
    url.searchParams.set('modo', siguiente);
    window.history.replaceState(window.history.state, '', url);
  };

  useEffect(() => {
    const sincronizar = () => {
      const pedido = new URLSearchParams(window.location.search).get('modo');
      const siguiente: Modo =
        pedido === 'salon' && puedeSalon
          ? 'salon'
          : pedido === 'mostrador' && puedeMostrador
            ? 'mostrador'
            : modoInicial;
      setAbiertos((actual) => (actual.includes(siguiente) ? actual : [...actual, siguiente]));
      setModo(siguiente);
    };
    window.addEventListener('popstate', sincronizar);
    return () => window.removeEventListener('popstate', sincronizar);
  }, [modoInicial, puedeSalon, puedeMostrador]);

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-3 px-3 py-3 sm:px-5 lg:flex-row lg:items-center lg:justify-between lg:gap-6">
          <div className="min-w-0">
            <p className="label-caps text-muted-foreground">Ventas / Operación</p>
            <h1 className="text-xl font-semibold tracking-tight">Punto de venta</h1>
          </div>
          <div className="flex min-w-0 flex-wrap items-center gap-2 sm:gap-3">
            {puedeSalon && puedeMostrador && (
              <div
                aria-label="Forma de atención"
                className="inline-grid h-10 grid-cols-2 gap-1 rounded-md border border-border bg-secondary p-1"
              >
                <button
                  type="button"
                  aria-pressed={modo === 'mostrador'}
                  onClick={() => cambiarModo('mostrador')}
                  className={cn(
                    'flex min-w-28 items-center justify-center gap-2 rounded px-3 text-xs font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-primary',
                    modo === 'mostrador'
                      ? 'bg-card text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  <Store className="h-4 w-4" aria-hidden="true" />
                  Mostrador
                </button>
                <button
                  type="button"
                  aria-pressed={modo === 'salon'}
                  onClick={() => cambiarModo('salon')}
                  className={cn(
                    'flex min-w-28 items-center justify-center gap-2 rounded px-3 text-xs font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-primary',
                    modo === 'salon'
                      ? 'bg-card text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  <UtensilsCrossed className="h-4 w-4" aria-hidden="true" />
                  Salón
                </button>
              </div>
            )}
            {puedeCerrarZ && (
              <Link
                href="/pos/reporte-z"
                className="inline-flex h-10 items-center gap-2 rounded-md px-3 text-xs font-semibold text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground focus-visible:outline-2 focus-visible:outline-primary"
              >
                <ReceiptText className="h-4 w-4" aria-hidden="true" />
                Cierre Z
              </Link>
            )}
          </div>
        </div>
      </header>

      {puedeMostrador && abiertos.includes('mostrador') && (
        <div hidden={modo !== 'mostrador'}>
          <MostradorPOS
            active={modo === 'mostrador'}
            onOpenSalon={puedeSalon ? () => cambiarModo('salon') : undefined}
          />
        </div>
      )}
      {puedeSalon && abiertos.includes('salon') && (
        <div hidden={modo !== 'salon'}>
          <MesasClient active={modo === 'salon'} />
        </div>
      )}
    </div>
  );
}
