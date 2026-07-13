'use client';

import Link from 'next/link';
import { FileQuestion, ArrowLeft, Home } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-radial from-slate-900 to-slate-950 px-4 text-center font-sans">
      <div className="max-w-md w-full rounded-3xl bg-slate-900/40 border border-slate-800/80 p-8 shadow-2xl backdrop-blur-xl relative space-y-6">
        {/* Decorative background glow */}
        <div className="absolute -top-12 -left-12 w-48 h-48 rounded-full bg-brand-1/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-12 -right-12 w-48 h-48 rounded-full bg-success/5 blur-3xl pointer-events-none" />

        {/* Big icon indicator */}
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-slate-800/50 border border-slate-700/50 text-brand-1 mb-2 shadow-inner">
          <FileQuestion className="h-10 w-10 text-brand-1 animate-pulse" />
        </div>

        <div className="space-y-2">
          <h1 className="text-4xl font-extrabold tracking-tight text-white bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
            404
          </h1>
          <h2 className="text-xl font-bold text-slate-200">
            Página No Encontrada
          </h2>
          <p className="text-sm text-slate-400 leading-relaxed">
            Lo sentimos, el recurso que estás buscando no existe o fue trasladado a otra sección.
          </p>
        </div>

        <div className="pt-4 flex flex-col gap-3">
          <Link
            href="/dashboard"
            className="w-full h-11 bg-brand-1 hover:bg-brand-2 text-white font-semibold text-sm rounded-xl flex items-center justify-center gap-2 active:scale-95 transition-all shadow-lg shadow-brand-1/20"
          >
            <Home className="h-4 w-4" />
            <span>Volver al Panel</span>
          </Link>
          <button
            onClick={() => window.history.back()}
            className="w-full h-11 bg-slate-800/50 hover:bg-slate-800 border border-slate-700/80 text-slate-300 font-semibold text-sm rounded-xl flex items-center justify-center gap-2 active:scale-95 transition-all"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Página Anterior</span>
          </button>
        </div>

        <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">
          ERP PANAMÁ · SISTEMA CONTABLE FISCAL
        </p>
      </div>
    </div>
  );
}
