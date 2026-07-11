'use client';

import { useEffect, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';

/**
 * Botón de Pago Yappy V2 (Banco General) — carga el web component oficial desde el CDN de
 * Yappy y orquesta el flujo documentado: click -> crear orden en nuestro backend -> avisarle
 * al botón los datos de la orden -> esperar confirmación -> el llamador consulta el estado
 * real en el servidor antes de dar la venta por buena.
 *
 * ADVERTENCIA IMPORTANTE: esto NO se pudo probar contra credenciales reales de Yappy (el
 * usuario todavía no las tiene, y no hay forma de simular el widget sin una cuenta Yappy
 * Comercial real). La documentación oficial describe los eventos del botón (`eventClick`,
 * `eventSuccess`, `eventError`) en prosa pero no da un ejemplo de código de cómo exactamente
 * se le "inyecta" el resultado de crear la orden (solo dice que "recibe un objeto con los
 * campos transactionId, token, documentName"). Aquí se interpreta como un CustomEvent
 * `eventPayment` despachado sobre el propio elemento <btn-yappy>, que es el patrón más común
 * para web components de este tipo — pero HAY QUE VERIFICARLO Y AJUSTARLO con el ambiente de
 * Pruebas (UAT) de Yappy antes de usar esto con clientes reales. Si algo no coincide, revisa
 * la consola del navegador (los eventos disponibles se pueden inspeccionar con
 * getEventListeners en devtools) y ajusta el nombre/forma del evento aquí.
 */

const CDN_JS = {
  produccion: 'https://bt-cdn.yappy.cloud/v1/cdn/web-component-btn-yappy.js',
  pruebas: 'https://bt-cdn-uat.yappycloud.com/v1/cdn/web-component-btn-yappy.js'
};

interface YappyBotonPagoProps {
  ambiente: 'produccion' | 'pruebas';
  subtotal: number;
  itbms: number;
  total: number;
  onPagoConfirmado: (orderId: string) => void;
  onError: (mensaje: string) => void;
}

const scriptCargado: Record<string, boolean> = {};

function cargarScriptYappy(ambiente: 'produccion' | 'pruebas'): Promise<void> {
  const src = CDN_JS[ambiente];
  if (scriptCargado[src] || document.querySelector(`script[src="${src}"]`)) {
    scriptCargado[src] = true;
    return Promise.resolve();
  }
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.onload = () => { scriptCargado[src] = true; resolve(); };
    script.onerror = () => reject(new Error('No se pudo cargar el botón de Yappy desde el CDN.'));
    document.head.appendChild(script);
  });
}

export default function YappyBotonPago({ ambiente, subtotal, itbms, total, onPagoConfirmado, onError }: YappyBotonPagoProps) {
  const contenedorRef = useRef<HTMLDivElement>(null);
  const botonElRef = useRef<HTMLElement | null>(null);
  const [estado, setEstado] = useState<'cargando' | 'listo' | 'procesando' | 'error'>('cargando');

  useEffect(() => {
    let cancelado = false;
    let pollTimer: ReturnType<typeof setInterval> | null = null;

    async function onEventClick() {
      setEstado('procesando');
      try {
        const res = await fetch('/api/pos/yappy/crear-orden', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ subtotal, itbms, total })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'No se pudo crear la orden de cobro con Yappy.');

        // Best-effort: le pasamos al web component el resultado de crear la orden mediante un
        // CustomEvent -- ver advertencia arriba, esto necesita verificarse con credenciales
        // reales.
        botonElRef.current?.dispatchEvent(new CustomEvent('eventPayment', {
          detail: { transactionId: data.transactionId, token: data.token, documentName: data.documentName }
        }));

        // Defensa en profundidad: no confiamos solo en el evento eventSuccess del botón (que
        // corre en el navegador del cajero) -- hacemos polling al servidor, que es quien
        // realmente valida el hash de la notificación IPN de Yappy.
        let intentos = 0;
        pollTimer = setInterval(async () => {
          intentos++;
          if (cancelado) { if (pollTimer) clearInterval(pollTimer); return; }
          try {
            const r = await fetch(`/api/pos/yappy/consultar?orderId=${encodeURIComponent(data.orderId)}`);
            const d = await r.json();
            if (d.estado === 'EJECUTADO') {
              if (pollTimer) clearInterval(pollTimer);
              setEstado('listo');
              onPagoConfirmado(data.orderId);
            } else if (['RECHAZADO', 'CANCELADO', 'EXPIRADO'].includes(d.estado)) {
              if (pollTimer) clearInterval(pollTimer);
              setEstado('error');
              onError('El cliente no completó el pago en Yappy (o fue rechazado/cancelado).');
            }
          } catch {
            // Error de red puntual en un intento de polling: se reintenta en el próximo tick.
          }
          // Los pedidos de Yappy vencen a los 5 minutos (100 intentos * 3s ≈ 5 min).
          if (intentos > 100 && pollTimer) {
            clearInterval(pollTimer);
            setEstado('error');
            onError('El tiempo para pagar con Yappy venció.');
          }
        }, 3000);
      } catch (err) {
        setEstado('error');
        onError(err instanceof Error ? err.message : 'Error al iniciar el cobro con Yappy.');
      }
    }

    function onEventError() {
      setEstado('error');
      onError('El widget de Yappy reportó un error en la transacción.');
    }

    cargarScriptYappy(ambiente)
      .then(() => {
        if (cancelado || !contenedorRef.current) return;
        const boton = document.createElement('btn-yappy');
        boton.setAttribute('theme', 'blue');
        boton.setAttribute('rounded', 'true');
        boton.addEventListener('eventClick', onEventClick);
        boton.addEventListener('eventError', onEventError);
        contenedorRef.current.appendChild(boton);
        botonElRef.current = boton;
        setEstado('listo');
      })
      .catch((err) => {
        if (!cancelado) {
          setEstado('error');
          onError(err instanceof Error ? err.message : 'No se pudo cargar el botón de Yappy.');
        }
      });

    return () => {
      cancelado = true;
      if (pollTimer) clearInterval(pollTimer);
      if (botonElRef.current) {
        botonElRef.current.removeEventListener('eventClick', onEventClick);
        botonElRef.current.removeEventListener('eventError', onEventError);
        botonElRef.current.remove();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex flex-col items-center gap-2">
      <div ref={contenedorRef} />
      {estado === 'cargando' && (
        <p className="text-[11px] text-muted-foreground flex items-center gap-1.5"><Loader2 className="h-3 w-3 animate-spin" /> Cargando botón de Yappy...</p>
      )}
      {estado === 'procesando' && (
        <p className="text-[11px] text-muted-foreground flex items-center gap-1.5"><Loader2 className="h-3 w-3 animate-spin" /> Esperando confirmación del cliente en Yappy (5 min)...</p>
      )}
    </div>
  );
}
