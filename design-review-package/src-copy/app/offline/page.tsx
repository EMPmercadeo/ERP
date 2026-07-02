'use client';

import { WifiOff, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function OfflinePage() {
    const handleRetry = () => {
        window.location.reload();
    };

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 text-center font-sans">
            <div className="max-w-md w-full rounded-2xl bg-white border border-slate-200 p-8 shadow-xl">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-rose-50 text-rose-500 mb-6">
                    <WifiOff className="h-8 w-8 animate-pulse" />
                </div>
                
                <h1 className="text-xl font-bold text-slate-800">Sin Conexión a Internet</h1>
                <p className="text-sm text-slate-500 mt-2 leading-relaxed">
                    No pudimos cargar esta página porque tu dispositivo no está conectado a la red. Revisa tu señal Wi-Fi o datos móviles y vuelve a intentarlo.
                </p>
                
                <div className="mt-8 space-y-3">
                    <Button 
                        onClick={handleRetry} 
                        className="w-full h-11 bg-brand-1 hover:bg-brand-2 text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 active:scale-95 transition-all shadow-sm"
                    >
                        <RefreshCw className="h-4 w-4" />
                        <span>Reintentar Conexión</span>
                    </Button>
                </div>
                
                <p className="text-[10px] text-slate-400 mt-6 font-semibold uppercase tracking-wider">
                    ERP PANAMÁ · MODO FUERA DE LÍNEA
                </p>
            </div>
        </div>
    );
}
