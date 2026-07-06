'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

const NAV_LINKS = [
    { href: '#funcionalidades', label: 'Funcionalidades' },
    { href: '#rubros', label: 'Rubros' },
    { href: '#como-funciona', label: 'Cómo funciona' },
    { href: '#glosario', label: 'Glosario' },
    { href: '#precios', label: 'Precios' },
];

export function LandingHeader() {
    const [isMobileOpen, setIsMobileOpen] = useState(false);

    return (
        <header className="sticky top-0 z-50 w-full border-b border-brand-3/10 bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/80">
            <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
                <Link href="/" className="flex items-center gap-2 select-none">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-1">
                        <span className="text-xs font-bold text-white font-mono">EP</span>
                    </div>
                    <span className="text-base font-bold tracking-tight text-brand-3">
                        ERP Panamá
                    </span>
                </Link>

                {/* Nav central - desktop */}
                <nav className="hidden lg:flex lg:items-center lg:gap-8">
                    {NAV_LINKS.map((link) => (
                        <a
                            key={link.href}
                            href={link.href}
                            className="text-sm font-medium text-slate-600 transition-colors hover:text-brand-1"
                        >
                            {link.label}
                        </a>
                    ))}
                </nav>

                {/* Derecha - desktop */}
                <div className="hidden lg:flex lg:items-center lg:gap-3">
                    <Link href="/login" className="text-sm font-medium text-slate-600 transition-colors hover:text-brand-1">
                        Iniciar sesión
                    </Link>
                    <Button asChild className="bg-brand-1 hover:bg-brand-2">
                        <Link href="/register">Crear cuenta gratis</Link>
                    </Button>
                </div>

                {/* Mobile hamburger */}
                <button
                    type="button"
                    className="inline-flex items-center justify-center rounded-md p-2 text-slate-600 lg:hidden"
                    onClick={() => setIsMobileOpen((v) => !v)}
                    aria-label={isMobileOpen ? 'Cerrar menú' : 'Abrir menú'}
                    aria-expanded={isMobileOpen}
                >
                    {isMobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                </button>
            </div>

            {/* Mobile menu */}
            {isMobileOpen && (
                <div className="border-t border-brand-3/10 bg-white lg:hidden">
                    <nav className="flex flex-col gap-1 px-4 py-4">
                        {NAV_LINKS.map((link) => (
                            <a
                                key={link.href}
                                href={link.href}
                                className="rounded-md px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                                onClick={() => setIsMobileOpen(false)}
                            >
                                {link.label}
                            </a>
                        ))}
                        <div className="mt-3 flex flex-col gap-2 border-t border-brand-3/10 pt-4">
                            <Link
                                href="/login"
                                className="rounded-md px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                                onClick={() => setIsMobileOpen(false)}
                            >
                                Iniciar sesión
                            </Link>
                            <Button asChild className="bg-brand-1 hover:bg-brand-2">
                                <Link href="/register" onClick={() => setIsMobileOpen(false)}>
                                    Crear cuenta gratis
                                </Link>
                            </Button>
                        </div>
                    </nav>
                </div>
            )}
        </header>
    );
}
