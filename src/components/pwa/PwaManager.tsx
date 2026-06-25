'use client';

import { useEffect, useState } from 'react';
import { Download, Wifi, WifiOff, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export function PwaManager() {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [isInstallable, setIsInstallable] = useState(false);
    const [isDismissed, setIsDismissed] = useState(false);

    useEffect(() => {
        // Register Service Worker
        if ('serviceWorker' in navigator && window.location.protocol === 'https:' || window.location.hostname === 'localhost') {
            window.addEventListener('load', () => {
                navigator.serviceWorker.register('/sw.js')
                    .then((reg) => {
                        console.log('Service Worker registrado con éxito:', reg.scope);
                    })
                    .catch((err) => {
                        console.error('Error al registrar Service Worker:', err);
                    });
            });
        }

        // Listen for Install Prompt
        const handleBeforeInstallPrompt = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e);
            setIsInstallable(true);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

        // Listen for Network Changes
        const handleOnline = () => {
            toast.success('Conexión restablecida. Trabajando en línea.', {
                icon: <Wifi className="h-4 w-4 text-emerald-600" />,
                duration: 4000
            });
        };

        const handleOffline = () => {
            toast.error('Sin conexión a internet. Ciertas funciones pueden no estar disponibles.', {
                icon: <WifiOff className="h-4 w-4 text-rose-600" />,
                duration: 5000
            });
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    const handleInstallClick = async () => {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        console.log(`User response to install prompt: ${outcome}`);
        setDeferredPrompt(null);
        setIsInstallable(false);
    };

    if (!isInstallable || isDismissed) return null;

    return (
        <div className="fixed bottom-20 left-4 right-4 z-50 md:bottom-6 md:left-auto md:right-6 md:w-80 rounded-xl bg-white border border-slate-200 p-4 shadow-xl animate-in slide-in-from-bottom-5 duration-300 font-sans">
            <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Instalar Aplicación</h4>
                    <p className="text-[11px] text-slate-500 mt-1 leading-normal">Instala ERP Panamá en tu dispositivo móvil para un acceso rápido y mejor rendimiento.</p>
                </div>
                <button 
                    onClick={() => setIsDismissed(true)}
                    className="text-slate-400 hover:text-slate-600 rounded p-0.5 hover:bg-slate-100 transition-colors"
                >
                    <X className="h-4 w-4" />
                </button>
            </div>
            <div className="mt-3 flex gap-2">
                <Button 
                    onClick={handleInstallClick} 
                    className="flex-1 h-9 bg-brand-1 hover:bg-brand-2 text-white font-bold text-xs rounded-lg flex items-center justify-center gap-1.5 active:scale-95 transition-all shadow-sm"
                >
                    <Download className="h-3.5 w-3.5" />
                    <span>Instalar Ahora</span>
                </Button>
                <Button 
                    variant="ghost" 
                    onClick={() => setIsDismissed(true)} 
                    className="h-9 text-xs text-slate-500 font-semibold px-3"
                >
                    Quizás luego
                </Button>
            </div>
        </div>
    );
}
