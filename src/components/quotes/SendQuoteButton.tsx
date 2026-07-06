'use client';

import { Button } from '@/components/ui/button';
import { Send } from 'lucide-react';
import { toast } from 'sonner';

// Antes este botón no tenía ningún onClick — parecía funcional (no estaba
// deshabilitado) pero no hacía absolutamente nada al hacer click. El envío de
// cotizaciones por correo depende de tener un proveedor de email real configurado
// (ver Fase 4, Item 3 — Resend/SMTP), que todavía no está conectado. Mientras tanto
// es más honesto avisar explícitamente que la función no está disponible aún, en vez
// de dejar un botón que no hace nada sin explicación.
export function SendQuoteButton() {
    const handleClick = () => {
        toast.info('Envío de cotizaciones por correo no disponible todavía', {
            description: 'Esta función requiere configurar un proveedor de email (Resend). Por ahora podés descargar el PDF y enviarlo manualmente.',
        });
    };

    return (
        <Button variant="outline" onClick={handleClick}>
            <Send className="mr-2 h-4 w-4" />
            Enviar
        </Button>
    );
}
