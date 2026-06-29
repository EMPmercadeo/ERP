'use client';

import { Home } from 'lucide-react';
import Link from 'next/link';

import { Footer } from '@/components/layout/Footer';

export default function AuthLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex min-h-screen lg:h-screen overflow-hidden">
            {/* Left side - Form panel (blue on mobile, white on desktop) */}
            <div className="flex w-full lg:w-1/2 flex-col items-center justify-between bg-gradient-to-b from-[#0056b3] via-[#004899] to-[#003366] lg:bg-none lg:bg-white p-3 sm:p-8 h-[100dvh] lg:h-full overflow-y-auto sm:overflow-hidden text-white lg:text-foreground">
                <div className="w-full max-w-md flex-1 flex flex-col justify-center py-1 sm:py-6">
                    {children}
                </div>
                <div className="hidden lg:block w-full">
                    <Footer />
                </div>
            </div>

            {/* Right side - Brand panel (dark blue) */}
            <div className="hidden lg:flex lg:w-1/2 flex-col justify-between bg-foreground p-12 text-white">
                {/* Logo */}
                {/* Logo - Static for Auth */}
                <div className="flex items-center gap-2">
                    <Home className="h-6 w-6" />
                    <span className="text-xl font-semibold">ERP Panamá</span>
                </div>

                {/* Tagline */}
                <div className="space-y-4">
                    <h1 className="text-4xl font-bold leading-tight">
                        Gestiona tu Negocio.
                        <br />
                        Exporta más Rápido.
                        <br />
                        Cumple con la DGI.
                    </h1>
                    <p className="text-white/70 text-lg">
                        La plataforma fiscal #1 para empresas panameñas.
                        <br />
                        Facturación electrónica, inventario y contabilidad en un solo lugar.
                    </p>
                </div>

                {/* Decorative line */}
                <div className="w-12 h-1 bg-white/30 rounded" />
            </div>
        </div>
    );
}

