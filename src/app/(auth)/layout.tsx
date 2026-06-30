'use client';

import { Home, Star } from 'lucide-react';
import React from 'react';
import { Footer } from '@/components/layout/Footer';

export default function AuthLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen w-full flex">
            {/* =========================================================
                VISTA MÓVIL (< lg) - Tema Azul Banco General 100% Pantalla
            ========================================================= */}
            <div className="flex lg:hidden w-full flex-col items-center justify-center bg-gradient-to-b from-[#0056b3] via-[#004899] to-[#003366] p-3 min-h-[100dvh] max-h-[100dvh] overflow-hidden text-white">
                <div className="w-full max-w-md flex flex-col justify-between h-full my-auto py-1">
                    {children}
                </div>
            </div>

            {/* =========================================================
                VISTA ESCRITORIO / LAPTOP (>= lg) - Pantalla Completa Dividida
            ========================================================= */}
            <div className="hidden lg:flex w-full min-h-screen">
                {/* Panel Izquierdo - Formulario en Blanco con Footer */}
                <div className="w-1/2 bg-white flex flex-col justify-between p-8 lg:p-12 text-gray-900 border-r border-gray-100">
                    <div className="w-full max-w-md mx-auto flex-1 flex flex-col justify-center py-6">
                        {children}
                    </div>
                    <div className="w-full pt-4 border-t border-gray-100 text-xs text-gray-500">
                        <Footer />
                    </div>
                </div>

                {/* Panel Derecho - Degradado Institucional Azul DGI */}
                <div className="w-1/2 bg-gradient-to-br from-[#073674] via-[#052550] to-[#001835] p-12 lg:p-16 text-white flex flex-col justify-between relative overflow-hidden shadow-2xl">
                    {/* Brillo decorativo sutil */}
                    <div className="absolute top-0 right-0 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl pointer-events-none" />
                    <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

                    {/* Logo Superior */}
                    <div className="flex items-center gap-2.5 relative z-10">
                        <div className="bg-white/10 p-2 rounded-xl backdrop-blur-md border border-white/20">
                            <Home className="h-6 w-6 text-white" />
                        </div>
                        <span className="text-xl font-bold tracking-wide text-white">ERP Panamá</span>
                    </div>

                    {/* Titular Principal Institucional */}
                    <div className="space-y-6 relative z-10 my-auto py-12">
                        <h1 className="text-4xl lg:text-5xl font-extrabold leading-tight text-white tracking-tight">
                            Gestiona tu Negocio.
                            <br />
                            Exporta más Rápido.
                            <br />
                            Cumple con la DGI.
                        </h1>
                        <p className="text-white/80 text-lg leading-relaxed max-w-lg font-normal">
                            La plataforma fiscal #1 para empresas panameñas.
                            <br />
                            Facturación electrónica, inventario y contabilidad en un solo lugar.
                        </p>
                    </div>

                    {/* Barra decorativa inferior */}
                    <div className="w-12 h-1 bg-white/40 rounded-full relative z-10" />
                </div>
            </div>
        </div>
    );
}
