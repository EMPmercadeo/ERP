'use client';

import { Star } from 'lucide-react';
import React from 'react';
import { Footer } from '@/components/layout/Footer';

export default function AuthLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen w-full">
            {/* MOBILE LAYOUT (< lg) - Banco General Blue Theme */}
            <div className="flex lg:hidden flex-col items-center justify-between bg-gradient-to-b from-[#0056b3] via-[#004899] to-[#003366] p-3 h-[100dvh] overflow-y-auto sm:overflow-hidden text-white">
                <div className="w-full max-w-md flex-1 flex flex-col justify-start py-1 h-full">
                    {children}
                </div>
            </div>

            {/* DESKTOP/LAPTOP LAYOUT (>= lg) - Floating Card Reference Design */}
            <div className="hidden lg:flex min-h-screen w-full bg-gradient-to-br from-[#eff0f8] via-[#e8ebf8] to-[#f4f2fb] items-center justify-center p-6 lg:p-12">
                <div className="max-w-5xl w-full bg-white rounded-[36px] p-4 shadow-2xl border border-white/80 flex gap-6 min-h-[640px]">
                    {/* Left Gradient Panel (Inspired by reference screenshot) */}
                    <div className="w-1/2 bg-gradient-to-br from-[#0052cc] via-[#5b21b6] to-[#a855f7] rounded-[28px] p-10 flex flex-col justify-between text-white relative overflow-hidden shadow-inner">
                        {/* Decorative background blurs */}
                        <div className="absolute -top-20 -right-20 w-80 h-80 bg-blue-400/20 rounded-full blur-3xl pointer-events-none" />
                        <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-purple-400/30 rounded-full blur-3xl pointer-events-none" />

                        {/* Top Logo Asterisk */}
                        <div className="flex items-center gap-2.5 relative z-10">
                            <div className="bg-white/20 p-2 rounded-2xl backdrop-blur-md border border-white/25">
                                <Star className="h-7 w-7 fill-white text-white" />
                            </div>
                            <span className="text-2xl font-black tracking-tight text-white">ERP Panamá</span>
                        </div>

                        {/* Bottom Value Proposition Text */}
                        <div className="space-y-3 relative z-10">
                            <span className="text-xs font-bold text-purple-200 uppercase tracking-widest block">
                                Puedes lograrlo fácilmente
                            </span>
                            <h1 className="text-3xl lg:text-4xl font-extrabold leading-tight text-white tracking-tight">
                                Obtén acceso a tu centro de control para mayor claridad y productividad
                            </h1>
                            <p className="text-white/80 text-sm leading-relaxed max-w-md">
                                Facturación electrónica PAC certificada, control de inventarios y cumplimiento fiscal DGI en una sola plataforma en la nube.
                            </p>
                        </div>
                    </div>

                    {/* Right Form Area */}
                    <div className="w-1/2 p-6 lg:p-10 flex flex-col justify-center text-gray-800 overflow-y-auto">
                        {children}
                    </div>
                </div>
            </div>
        </div>
    );
}
