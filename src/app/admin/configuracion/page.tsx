'use client';

import React, { useState, useEffect } from 'react';
import { Settings, Server, Mail, ShieldAlert, RefreshCw, CheckCircle, Save, AlertTriangle, ToggleLeft, ToggleRight } from 'lucide-react';
import { toast } from 'sonner';

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
    const confirmacion = confirm('🚨 ¿ESTÁS SEGURO? Esta acción desactivará el PAC primario actual y conmutará TODAS las facturas electrónicas de la plataforma para ser emitidas por el PAC de respaldo.');
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
    <div className="min-h-screen bg-[#0b111e] text-white p-6 space-y-6 max-w-6xl mx-auto">
      {/* Cabecera */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#1e293b] pb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#00f0ff] flex items-center gap-2">
            <Settings className="h-7 w-7 text-[#00f0ff]" />
            Configuración Global & Conmutación de Emergencia (Superadmin)
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Control de infraestructura, servidores salientes SMTP, modo de mantenimiento y kill-switch DGI
          </p>
        </div>
        <button
          onClick={cargarConfig}
          className="flex items-center gap-2 px-4 py-2 bg-[#1e293b] hover:bg-[#334155] text-white rounded-lg text-sm font-medium transition"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin text-[#00f0ff]' : ''}`} />
          Recargar Configuración
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Card 1: Servidor SMTP y Prueba En Vivo */}
        <div className="bg-[#111827]/80 border border-[#1e293b] rounded-xl p-6 space-y-5">
          <h3 className="text-lg font-bold text-white flex items-center gap-2 border-b border-[#1e293b] pb-3">
            <Mail className="h-5 w-5 text-[#00f0ff]" />
            Configuración de Correo Saliente (SMTP)
          </h3>

          <form onSubmit={handleGuardarSMTP} className="space-y-4 text-xs">
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <label className="block text-slate-400 mb-1">Servidor Host (SMTP)</label>
                <input
                  type="text"
                  value={smtp.servidor}
                  onChange={(e) => setSmtp({ ...smtp, servidor: e.target.value })}
                  className="w-full bg-[#0b111e] border border-[#1e293b] rounded px-3 py-2 text-white font-mono"
                  required
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Puerto</label>
                <input
                  type="number"
                  value={smtp.puerto}
                  onChange={(e) => setSmtp({ ...smtp, puerto: parseInt(e.target.value || '587', 10) })}
                  className="w-full bg-[#0b111e] border border-[#1e293b] rounded px-3 py-2 text-white font-mono"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 mb-1">Usuario / API Key</label>
                <input
                  type="text"
                  value={smtp.usuario}
                  onChange={(e) => setSmtp({ ...smtp, usuario: e.target.value })}
                  className="w-full bg-[#0b111e] border border-[#1e293b] rounded px-3 py-2 text-white font-mono"
                  required
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Contraseña / Secreto</label>
                <input
                  type="password"
                  value={smtp.passwordCifrado}
                  onChange={(e) => setSmtp({ ...smtp, passwordCifrado: e.target.value })}
                  className="w-full bg-[#0b111e] border border-[#1e293b] rounded px-3 py-2 text-white font-mono"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Remitente Oficial (From Email)</label>
              <input
                type="email"
                value={smtp.remitente}
                onChange={(e) => setSmtp({ ...smtp, remitente: e.target.value })}
                className="w-full bg-[#0b111e] border border-[#1e293b] rounded px-3 py-2 text-white font-mono"
                required
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="submit"
                disabled={guardando}
                className="px-5 py-2.5 bg-[#00f0ff] hover:bg-[#00f0ff]/80 text-[#0b111e] font-bold rounded flex items-center gap-1.5 transition"
              >
                <Save className="h-4 w-4" />
                {guardando ? 'Guardando...' : 'Guardar y Encriptar SMTP'}
              </button>
            </div>
          </form>

          {/* Sección de Prueba */}
          <div className="pt-4 border-t border-[#1e293b] space-y-3">
            <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Diagnóstico en Vivo de Correo Saliente
            </h4>
            <div className="flex gap-2">
              <input
                type="email"
                value={correoPrueba}
                onChange={(e) => setCorreoPrueba(e.target.value)}
                placeholder="correo-de-prueba@tuempresa.com"
                className="flex-1 bg-[#0b111e] border border-[#1e293b] rounded px-3 py-2 text-xs text-white"
              />
              <button
                type="button"
                onClick={handleProbarSMTP}
                disabled={probandoSmtp}
                className="px-4 py-2 bg-[#1e293b] hover:bg-[#334155] text-[#00f0ff] font-semibold rounded text-xs transition border border-[#00f0ff]/30 shrink-0"
              >
                {probandoSmtp ? 'Probando...' : 'Enviar Correo de Prueba'}
              </button>
            </div>
          </div>
        </div>

        {/* Card 2: Kill-Switch PAC & Parámetros Generales */}
        <div className="space-y-6">
          {/* Kill switch de PAC */}
          <div className="bg-gradient-to-br from-[#1e1b4b] to-[#31103f] border-2 border-rose-500/60 rounded-xl p-6 shadow-2xl space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-3 bg-rose-500/20 rounded-lg border border-rose-500/40 shrink-0">
                <ShieldAlert className="h-7 w-7 text-rose-400 animate-pulse" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">
                  Kill-Switch de PAC de Respaldo (1-Clic)
                </h3>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  Si el Proveedor PAC principal sufre interrupción de servicio o latencia severa ante la DGI, presiona este botón para que conmutar instantáneamente el flujo de firmas a tu servidor PAC secundario.
                </p>
              </div>
            </div>

            <div className="bg-[#0b111e]/80 p-3 rounded-lg border border-rose-500/30 text-xs text-rose-300 font-mono">
              ★ Todas las cuentas activas emitirán electrónicamente por el PAC de respaldo en sub-segundos.
            </div>

            <button
              onClick={handleKillSwitch}
              disabled={ejecutandoKillSwitch}
              className="w-full py-3.5 bg-rose-600 hover:bg-rose-500 text-white font-extrabold rounded-lg text-sm tracking-wide uppercase transition shadow-lg shadow-rose-600/30 flex items-center justify-center gap-2"
            >
              <AlertTriangle className="h-5 w-5" />
              {ejecutandoKillSwitch ? 'Conmutando Servidores PAC...' : '¡Activar PAC de Respaldo Ahora (1-Clic)!'}
            </button>
          </div>

          {/* Parámetros de la plataforma */}
          <div className="bg-[#111827]/80 border border-[#1e293b] rounded-xl p-6 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2 border-b border-[#1e293b] pb-3">
              <Server className="h-5 w-5 text-[#00f0ff]" />
              Parámetros Generales y Mantenimiento
            </h3>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Nombre de la Plataforma</label>
                <input
                  type="text"
                  value={plataforma.nombre}
                  disabled
                  className="w-full bg-[#0b111e]/50 border border-[#1e293b] rounded px-3 py-2 text-slate-300 font-bold"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Correo de Contacto</label>
                <input
                  type="text"
                  value={plataforma.correoContacto}
                  disabled
                  className="w-full bg-[#0b111e]/50 border border-[#1e293b] rounded px-3 py-2 text-slate-300 font-mono"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 bg-[#0b111e] p-4 rounded-lg border border-[#1e293b]">
              <div>
                <h4 className="text-sm font-bold text-white">Modo Mantenimiento Global</h4>
                <p className="text-xs text-slate-400 mt-0.5">Muestra banner temporal en las sesiones de los clientes</p>
              </div>
              <button
                onClick={() => {
                  const valor = !plataforma.modoMantenimiento;
                  setPlataforma({ ...plataforma, modoMantenimiento: valor });
                  toast.success(valor ? 'Modo mantenimiento habilitado visualmente' : 'Modo mantenimiento desactivado');
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-full font-bold text-xs transition ${
                  plataforma.modoMantenimiento ? 'bg-amber-500 text-[#0b111e]' : 'bg-[#1e293b] text-slate-300 hover:text-white'
                }`}
              >
                {plataforma.modoMantenimiento ? 'ACTIVO' : 'NORMAL'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
