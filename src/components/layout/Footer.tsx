'use client';

import Link from 'next/link';

export function Footer() {
    return (
        <footer className="w-full bg-transparent py-6 border-t border-border mt-auto">
            <div className="max-w-4xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
                <div>
                    &copy; {new Date().getFullYear()} ERP Panamá. Todos los derechos reservados.
                </div>
                <div className="flex flex-wrap justify-center gap-x-6 gap-y-2">
                    <Link href="/terms" className="hover:text-foreground hover:underline transition-colors">
                        Términos de Servicio
                    </Link>
                    <Link href="/privacy" className="hover:text-foreground hover:underline transition-colors">
                        Política de Privacidad
                    </Link>
                    <Link href="/cookies" className="hover:text-foreground hover:underline transition-colors">
                        Política de Cookies
                    </Link>
                </div>
            </div>
        </footer>
    );
}
