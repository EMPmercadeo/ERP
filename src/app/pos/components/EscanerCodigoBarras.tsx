'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Camera, X, AlertCircle } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';

/**
 * Escaneo de código de barras desde la cámara del celular/tablet (sin hardware externo).
 * Un lector USB de escritorio ya funciona "gratis" tecleando directamente en el buscador de
 * productos — esto es aparte, para cuando no hay ese hardware disponible.
 *
 * Estrategia:
 * 1. BarcodeDetector nativo del navegador (Chrome/Edge en Android y Desktop recientes) — cero
 *    dependencias, la forma más rápida y liviana cuando está disponible.
 * 2. Fallback a @zxing/browser (JS puro) para Safari/iOS y navegadores sin soporte nativo.
 * Si no hay cámara o el usuario niega el permiso, se muestra un error claro en vez de fallar
 * en silencio — el buscador manual sigue funcionando siempre como alternativa.
 */

interface DetectedBarcode {
  rawValue: string;
}
interface BarcodeDetectorLike {
  detect: (source: CanvasImageSource) => Promise<DetectedBarcode[]>;
}
declare global {
  interface Window {
    BarcodeDetector?: {
      new (options?: { formats: string[] }): BarcodeDetectorLike;
    };
  }
}

const FORMATOS_BARRAS = ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128', 'code_39', 'codabar', 'itf'];

interface EscanerCodigoBarrasProps {
  onDetectado: (codigo: string) => void;
  onCerrar: () => void;
}

export default function EscanerCodigoBarras({ onDetectado, onCerrar }: EscanerCodigoBarrasProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const zxingControlsRef = useRef<{ stop: () => void } | null>(null);
  const detectadoRef = useRef(false);

  const [error, setError] = useState('');
  const [modo, setModo] = useState<'iniciando' | 'activo' | 'error'>('iniciando');

  const detener = useCallback(() => {
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    zxingControlsRef.current?.stop();
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  useEffect(() => {
    let cancelado = false;

    async function iniciar() {
      if (!navigator.mediaDevices?.getUserMedia) {
        setError('Este dispositivo o navegador no permite acceso a la cámara (se necesita HTTPS y un navegador compatible).');
        setModo('error');
        return;
      }

      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' }
        });
      } catch {
        setError('No se pudo acceder a la cámara. Revisa que le hayas dado permiso de cámara a este sitio.');
        setModo('error');
        return;
      }
      if (cancelado) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }
      if (cancelado) return;
      setModo('activo');

      // 1. BarcodeDetector nativo
      if (typeof window !== 'undefined' && window.BarcodeDetector) {
        const detector = new window.BarcodeDetector({ formats: FORMATOS_BARRAS });
        const loop = async () => {
          if (cancelado || detectadoRef.current || !videoRef.current) return;
          try {
            const resultados = await detector.detect(videoRef.current);
            if (resultados.length > 0 && !detectadoRef.current) {
              detectadoRef.current = true;
              onDetectado(resultados[0].rawValue);
              return;
            }
          } catch {
            // Frame no decodificable todavía; se sigue intentando en el próximo cuadro.
          }
          rafRef.current = requestAnimationFrame(loop);
        };
        rafRef.current = requestAnimationFrame(loop);
        return;
      }

      // 2. Fallback: @zxing/browser (JS puro) sobre el mismo stream ya abierto
      try {
        const { BrowserMultiFormatReader } = await import('@zxing/browser');
        const reader = new BrowserMultiFormatReader();
        if (cancelado || !videoRef.current) return;
        const controls = await reader.decodeFromStream(stream, videoRef.current, (result) => {
          if (result && !detectadoRef.current) {
            detectadoRef.current = true;
            onDetectado(result.getText());
          }
        });
        zxingControlsRef.current = controls;
      } catch {
        if (!cancelado) {
          setError('No se pudo iniciar el lector de códigos de barras en este navegador.');
          setModo('error');
        }
      }
    }

    iniciar();

    return () => {
      cancelado = true;
      detener();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCerrar = () => {
    detener();
    onCerrar();
  };

  return (
    <Dialog open onOpenChange={(open) => { if (!open) handleCerrar(); }}>
      <DialogContent
        showCloseButton={false}
        className="p-0 gap-0 border-0 bg-transparent shadow-none max-w-md overflow-hidden"
      >
        <div className="bg-card border border-border rounded-xl shadow-premium-hover w-full overflow-hidden">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Camera className="h-5 w-5 text-primary" />
              <h2 className="text-sm font-bold text-foreground">Escanear código de barras</h2>
            </div>
            <button onClick={handleCerrar} aria-label="Cerrar escáner de código de barras" className="text-muted-foreground hover:text-foreground">
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="relative aspect-[4/3] bg-black">
            {modo === 'error' ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center gap-2 p-6 text-white">
                <AlertCircle className="h-8 w-8 text-warning" />
                <p className="text-xs">{error}</p>
              </div>
            ) : (
              <>
                <video ref={videoRef} className="w-full h-full object-cover" muted playsInline autoPlay />
                <div className="absolute inset-8 border-2 border-primary/70 rounded-lg pointer-events-none" />
              </>
            )}
          </div>

          <div className="p-4 text-[11px] text-muted-foreground text-center">
            {modo === 'iniciando' && 'Iniciando cámara...'}
            {modo === 'activo' && 'Apunta la cámara al código de barras del producto.'}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
