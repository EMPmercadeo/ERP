import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Suspense } from "react";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ERP Panamá - Sistema de Facturación Electrónica",
  description: "Sistema ERP con integración DGI para facturación electrónica en Panamá",
  keywords: ["ERP", "Panamá", "DGI", "Facturación Electrónica", "CUFE"],
};

import { AuthProvider } from '@/lib/firebase/auth';

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
          {/* Impersonation Banner */}
          <Suspense fallback={null}>
            <ImpersonationWrapper />
          </Suspense>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}

async function ImpersonationWrapper() {
  const { cookies } = await import('next/headers');
  const cookieStore = await cookies();
  const sessionEmail = cookieStore.get('session_email')?.value;

  if (!sessionEmail || sessionEmail === 'guest') {
    return null;
  }

  const { getTenantContext } = await import('@/lib/auth/context');
  const { prisma } = await import('@/lib/db');
  const { ImpersonationBanner } = await import('@/components/layout/ImpersonationBanner');

  try {
    const ctx = await getTenantContext();
    if (ctx.isImpersonating) {
      const tenant = await prisma.empresa.findUnique({
        where: { id: ctx.empresaId },
        select: { razonSocial: true }
      });
      return <ImpersonationBanner isImpersonating={true} tenantName={tenant?.razonSocial || 'Unknown'} />;
    }
  } catch (e) {
    // Ignore auth errors in root layout to allow public pages or login to work
  }
  return null;
}
