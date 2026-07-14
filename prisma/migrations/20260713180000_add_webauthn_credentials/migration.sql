-- CreateTable
-- Passkeys / login biométrico real (WebAuthn). Guarda la clave pública de cada
-- dispositivo registrado (huella, Face ID, Windows Hello, llave de seguridad) para
-- verificar cada inicio de sesión biométrico contra criptografía real de clave
-- pública/privada. La clave privada y el dato biométrico NUNCA salen del dispositivo
-- del usuario ni se guardan aquí.
CREATE TABLE "WebAuthnCredential" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "credentialId" TEXT NOT NULL,
    "publicKey" BYTEA NOT NULL,
    "counter" BIGINT NOT NULL DEFAULT 0,
    "deviceType" TEXT,
    "backedUp" BOOLEAN NOT NULL DEFAULT false,
    "transports" TEXT,
    "nombre" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastUsedAt" TIMESTAMP(3),

    CONSTRAINT "WebAuthnCredential_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WebAuthnCredential_credentialId_key" ON "WebAuthnCredential"("credentialId");

-- CreateIndex
CREATE INDEX "WebAuthnCredential_usuarioId_idx" ON "WebAuthnCredential"("usuarioId");

-- AddForeignKey
ALTER TABLE "WebAuthnCredential" ADD CONSTRAINT "WebAuthnCredential_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Row Level Security: mismo patrón "deny all" aplicado a todas las tablas del proyecto
-- (ver prisma/migrations/20260705130000_enable_rls_completo). La app accede vía Prisma
-- con la conexión de servicio que hace bypass de RLS; esta política solo bloquea
-- cualquier acceso directo con claves de cliente (anon/authenticated de Supabase).
ALTER TABLE "WebAuthnCredential" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Deny client access" ON "WebAuthnCredential" FOR ALL USING (false);
