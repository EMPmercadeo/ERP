'use client';

import React, { useState, useEffect } from 'react';
import { Settings, Server, Mail, ShieldAlert, RefreshCw, Save, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { ContentContainer } from '@/components/layout/Content';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function SuperadminConfiguracionPage() {
  const [plataforma, setPlataforma] = useState<any>({
    nombre: 'ERP Panamá',
    correoContacto: 'soporte@erppanama.com',
    telefonoSoporte: '+507 800-0000',
    modoMantenimiento: false
  });
  const [smtp, setSmtp] = useState<any>({
    servidor: 'smtp.sendgrid.net',
    puerto: 587,
    usuario: 'apikey',
    passwordCifrado: '••••••••••••••••',
    remitente: 'notificaciones@erppanama.com',
    activo: true
  });
  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [probandoSmtp, setProbandoSmtp] = useState(false);
  const [correoPrueba, setCorreoPrueba] = useState('admin@erppanama.com');
  const [ejecutandoKillSwitch, setEjecutandoKillSwitch] = useState(false);

  const cargarConfig = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/configuracion');
      const data = await res.json();
      if (data.plataforma) setPlataforma(data.plataforma);
      if (data.smtp) {
        setSmtp({
          ...data.smtp,
          passwordCifrado: '••••••••••••••••'
        });
      }
    } catch (error) {
      toast.error('Error al cargar configuración');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarConfig();
  }, []);

  const handleGuardarSMTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setGuardando(true);
    try {
      const res = await fetch('/api/admin/configuracion', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ smtp })
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || 'Configuración SMTP actualizada y encriptada.');
        cargarConfig();
      } else {
        toast.error(data.error || 'Error al guardar SMTP');
      }
    } catch (error) {
      toast.error('Fallo en la comunicación al guardar SMTP');
    } finally {
      setGuardando(false);
    }
  };

  const handleProbarSMTP = async () => {
    if (!correoPrueba) {
      toast.error('Indica un correo para la prueba en el campo inferior.');
      return;
    }
    setProbandoSmtp(true);
    try {
      const res = await fetch('/api/admin/configuracion/smtp-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ destinatario: correoPrueba })
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || '¡Correo de prueba enviado con éxito!');
      } else {
        toast.error(data.error || 'Fallo en la prueba de servidor saliente SMTP');
      }
    } catch (error) {
      toast.error('Error al conectar para prueba SMTP');
    } finally {
      setProbandoSmtp(false);
    }
  };

  const handleKillSwitch = async () => {
    const confirmacion = confirm('¿Estás seguro? Esta acción desactivará el PAC primario actual y conmutará TODAS las facturas electrónicas de la plataforma para ser emitidas por el PAC de respaldo.');
    if (!confirmacion) return;

    setEjecutandoKillSwitch(true);
    try {
      const res = await fetch('/api/admin/configuracion/killswitch', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message, { duration: 6000 });
      } else {
        toast.error(data.error || 'No se ejecutó el kill-switch');
      }
    } catch (error) {
      toast.error('Error al ejecutar conmutación de emergencia');
    } finally {
      setEjecutandoKillSwitch(false);
    }
  };

  return (
    <ContentContainer className="py-8 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Settings className="h-6 w-6 text-primary" />
            Configuración Global & Conmutación de Emergencia
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Control de infraestructura, servidor saliente SMTP, modo de mantenimiento y kill-switch DGI
          </p>
        </div>
        <Button variant="outline" onClick={cargarConfig}>
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Recargar Configuración
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Card 1: Servidor SMTP y Prueba En Vivo */}
        <Card>
          <CardHeader className="border-b pb-4">
            <CardTitle className="flex items-center gap-2 text-base">
              <Mail className="h-5 w-5 text-primary" />
              Configuración de Correo Saliente (SMTP)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5 pt-4">
            <form onSubmit={handleGuardarSMTP} className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2 space-y-1.5">
                  <label className="block text-xs font-medium text-muted-foreground">Servidor Host (SMTP)</label>
                  <Input
                    type="text"
                    value={smtp.servidor}
                    onChange={(e) => setSmtp({ ...smtp, servidor: e.target.value })}
                    className="font-mono text-sm"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-muted-foreground">Puerto</label>
                  <Input
                    type="number"
                    value={smtp.puerto}
                    onChange={(e) => setSmtp({ ...smtp, puerto: parseInt(e.target.value || '587', 10) })}
                    className="font-mono text-sm"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-muted-foreground">Usuario / API Key</label>
                  <Input
                    type="text"
                    value={smtp.usuario}
                    onChange={(e) => setSmtp({ ...smtp, usuario: e.target.value })}
                    className="font-mono text-sm"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-muted-foreground">Contraseña / Secreto</label>
                  <Input
                    type="password"
                    value={smtp.passwordCifrado}
                    onChange={(e) => setSmtp({ ...smtp, passwordCifrado: e.target.value })}
                    className="font-mono text-sm"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-muted-foreground">Remitente Oficial (From Email)</label>
                <Input
                  type="email"
                  value={smtp.remitente}
                  onChange={(e) => setSmtp({ ...smtp, remitente: e.target.value })}
                  className="font-mono text-sm"
                  required
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <Button type="submit" disabled={guardando}>
                  <Save className="h-4 w-4" />
                  {guardando ? 'Guardando...' : 'Guardar y Encriptar SMTP'}
                </Button>
              </div>
            </form>

            {/* Sección de Prueba */}
            <div className="pt-4 border-t space-y-3">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Diagnóstico en Vivo de Correo Saliente
              </h4>
              <div className="flex gap-2">
                <Input
                  type="email"
                  value={correoPrueba}
                  onChange={(e) => setCorreoPrueba(e.target.value)}
                  placeholder="correo-de-prueba@tuempresa.com"
                  className="flex-1 text-sm"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleProbarSMTP}
                  disabled={probandoSmtp}
                  className="shrink-0"
                >
                  {probandoSmtp ? 'Probando...' : 'Enviar Correo de Prueba'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Kill-Switch PAC & Parámetros Generales */}
        <div className="space-y-6">
          {/* Kill switch de PAC */}
          <Card className="border-danger/40 bg-danger-bg">
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-start gap-3">
                <div className="p-3 bg-danger/10 rounded-lg border border-danger/30 shrink-0">
                  <ShieldAlert className="h-6 w-6 text-danger" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-foreground">
                    Kill-Switch de PAC de Respaldo (1-Clic)
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    Si el proveedor PAC principal sufre interrupción de servicio o latencia severa ante la DGI, presiona este botón para conmutar instantáneamente el flujo de firmas a tu servidor PAC secundario.
                  </p>
                </div>
              </div>

              <div className="bg-card p-3 rounded-lg border border-danger/30 text-xs text-danger font-mono">
                Todas las cuentas activas emitirán electrónicamente por el PAC de respaldo en sub-segundos.
              </div>

              <Button
                onClick={handleKillSwitch}
                disabled={ejecutandoKillSwitch}
                className="w-full bg-danger hover:bg-danger/90 text-white font-bold uppercase tracking-wide"
              >
                <AlertTriangle className="h-4 w-4" />
                {ejecutandoKillSwitch ? 'Conmutando Servidores PAC...' : 'Activar PAC de Respaldo Ahora'}
              </Button>
            </CardContent>
          </Card>

          {/* Parámetros de la plataforma */}
          <Card>
            <CardHeader className="border-b pb-4">
              <CardTitle className="flex items-center gap-2 text-base">
                <Server className="h-5 w-5 text-primary" />
                Parámetros Generales y Mantenimiento
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-muted-foreground">Nombre de la Plataforma</label>
                  <Input type="text" value={plataforma.nombre} disabled className="text-sm font-semibold" />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-muted-foreground">Correo de Contacto</label>
                  <Input type="text" value={plataforma.correoContacto} disabled className="text-sm font-mono" />
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 bg-muted/50 p-4 rounded-lg border">
                <div>
                  <h4 className="text-sm font-bold text-foreground">Modo Mantenimiento Global</h4>
                  <p className="text-xs text-muted-foreground mt-0.5">Muestra banner temporal en las sesiones de los clientes</p>
                </div>
                <Button
                  type="button"
                  variant={plataforma.modoMantenimiento ? 'default' : 'outline'}
                  className={plataforma.modoMantenimiento ? 'bg-warning hover:bg-warning/90 text-white' : ''}
                  onClick={() => {
                    const valor = !plataforma.modoMantenimiento;
                    setPlataforma({ ...plataforma, modoMantenimiento: valor });
                    toast.success(valor ? 'Modo mantenimiento habilitado visualmente' : 'Modo mantenimiento desactivado');
                  }}
                >
                  {plataforma.modoMantenimiento ? 'ACTIVO' : 'NORMAL'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </ContentContainer>
  );
}
