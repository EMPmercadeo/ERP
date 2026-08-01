import type { Metadata } from "next";
import { Instrument_Sans, JetBrains_Mono } from "next/font/google";
import { Suspense } from "react";
import "./globals.css";

// Design System v2 — solo cambia la familia tipográfica.
// Los nombres de variable CSS (--font-geist-sans / --font-geist-mono) se conservan a
// propósito: globals.css y las utilidades font-sans / font-mono los usan, así que
// cambiar solo la familia evita tocar decenas de componentes.
const geistSans = Instrument_Sans({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = JetBrains_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "ERP Panamá - Sistema de Facturación Electrónica",
  description: "Sistema ERP con integración DGI para facturación electrónica en Panamá",
  keywords: ["ERP", "Panamá", "DGI", "Facturación Electrónica", "CUFE"],
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "ERP Panamá"
  },
  // iOS Safari no lee manifest.json para el ícono de "Agregar a inicio" — necesita su
  // propio <link rel="apple-touch-icon">, que antes no existía (solo estaban los íconos
  // 192/512 del manifest, que además tenían el bug de tamaño corregido en public/icons/).
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
};

import { AuthProvider } from '@/lib/firebase/auth';
import { PwaManager } from '@/components/pwa/PwaManager';
import { Toaster } from 'sonner';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        <AuthProvider>
          <PwaManager />
          {/* Impersonation Banner */}
          <Suspense fallback={null}>
            <ImpersonationWrapper />
          </Suspense>
          {children}
          {/* Sin este componente, toast.success()/toast.error() (usados en decenas de
              formularios y acciones en toda la app) no muestran nada visible: la llamada
              se ejecuta pero no hay dónde renderizarla. */}
          <Toaster richColors position="top-right" />
        </AuthProvider>
      </body>
    </html>
  );
}

async function ImpersonationWrapper() {
  const { cookies } = await import('next/headers');
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get('session_token')?.value;
  if (!sessionToken) {
    return null;
  }

  const { getTenantContext } = await import('@/lib/auth/context');
  const { prisma } = await import('@/lib/db');
  const { ImpersonationBanner } = await import('@/components/layout/ImpersonationBanner');

  let tenantName: string | null = null;
  try {
    const ctx = await getTenantContext();
    if (ctx.isImpersonating) {
      const tenant = await prisma.empresa.findUnique({
        where: { id: ctx.empresaId },
        select: { razonSocial: true }
      });
      tenantName = tenant?.razonSocial || 'Unknown';
    }
  } catch (e) {
    console.error('[ImpersonationWrapper] Error:', e);
    return null;
  }

  if (tenantName === null) return null;
  return <ImpersonationBanner isImpersonating={true} tenantName={tenantName} />;
}
