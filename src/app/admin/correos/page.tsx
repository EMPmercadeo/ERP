'use client';

import React, { useState, useEffect } from 'react';
import { Send, Mail, CheckCircle2, XCircle, FileText, Plus, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

export default function SuperadminCorreosPage() {
  const [correos, setCorreos] = useState<any[]>([]);
  const [plantillas, setPlantillas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'historial' | 'enviar' | 'plantillas'>('historial');

  // Form states para envío masivo/individual
  const [tipoDestino, setTipoDestino] = useState<'todos' | 'plan' | 'individual'>('individual');
  const [correoDestino, setCorreoDestino] = useState('');
  const [planDestino, setPlanDestino] = useState('');
  const [asunto, setAsunto] = useState('');
  const [cuerpoHtml, setCuerpoHtml] = useState('');
  const [enviando, setEnviando] = useState(false);

  // Form states para nueva plantilla
  const [nuevaClave, setNuevaClave] = useState('');
  const [nuevoAsunto, setNuevoAsunto] = useState('');
  const [nuevoCuerpo, setNuevoCuerpo] = useState('');

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const [resC, resP] = await Promise.all([
        fetch('/api/admin/correos').then(r => r.json()),
        fetch('/api/admin/correos/plantillas').then(r => r.json())
      ]);
      setCorreos(resC?.items || []);
      setPlantillas(Array.isArray(resP) ? resP : []);
    } catch (error) {
      console.error('Error al cargar datos de correos:', error);
      toast.error('No se pudieron cargar los correos o plantillas.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const handleEnviar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!asunto.trim() || !cuerpoHtml.trim()) {
      toast.error('Por favor completa el asunto y el contenido HTML del correo.');
      return;
    }
    setEnviando(true);
    try {
      const res = await fetch('/api/admin/correos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          destinatarioTipo: tipoDestino,
          correoIndividual: tipoDestino === 'individual' ? correoDestino : undefined,
          planId: tipoDestino === 'plan' ? planDestino : undefined,
          asunto,
          cuerpoHtml
        })
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || 'Correos enviados exitosamente');
        setAsunto('');
        setCuerpoHtml('');
        setCorreoDestino('');
        cargarDatos();
        setActiveTab('historial');
      } else {
        toast.error(data.error || 'Fallo en el envío masivo');
      }
    } catch (error) {
      toast.error('Error de conexión con el servidor de correo');
    } finally {
      setEnviando(false);
    }
  };

  const handleCrearPlantilla = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevaClave.trim() || !nuevoAsunto.trim() || !nuevoCuerpo.trim()) {
      toast.error('Completa todos los campos para la plantilla.');
      return;
    }
    try {
      const res = await fetch('/api/admin/correos/plantillas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clave: nuevaClave.toUpperCase(),
          asunto: nuevoAsunto,
          cuerpo: nuevoCuerpo,
          activa: true
        })
      });
      const data = await res.json();
      if (res.ok) {
        toast.success('Plantilla creada correctamente.');
        setNuevaClave('');
        setNuevoAsunto('');
        setNuevoCuerpo('');
        cargarDatos();
      } else {
        toast.error(data.error || 'No se pudo guardar la plantilla');
      }
    } catch (error) {
      toast.error('Error al guardar plantilla.');
    }
  };

  return (
    <div className="min-h-screen bg-[#0b111e] text-white p-6 space-y-6">
      {/* Cabecera */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#1e293b] pb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#00f0ff] flex items-center gap-2">
            <Mail className="h-7 w-7 text-[#00f0ff]" />
            Centro de Comunicaciones & Correos (Superadmin)
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Gestión de envíos SMTP transaccionales, plantillas dinámicas y comunicados masivos
          </p>
        </div>
        <button
          onClick={cargarDatos}
          className="flex items-center gap-2 px-4 py-2 bg-[#1e293b] hover:bg-[#334155] text-white rounded-lg text-sm font-medium transition"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin text-[#00f0ff]' : ''}`} />
          Actualizar Registro
        </button>
      </div>

      {/* Navegación por Pestañas */}
      <div className="flex gap-2 border-b border-[#1e293b]">
        <button
          onClick={() => setActiveTab('historial')}
          className={`px-5 py-3 text-sm font-semibold border-b-2 transition ${
            activeTab === 'historial'
              ? 'border-[#00f0ff] text-[#00f0ff] bg-[#00f0ff]/10'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          Historial de Correos Enviados ({correos.length})
        </button>
        <button
          onClick={() => setActiveTab('enviar')}
          className={`px-5 py-3 text-sm font-semibold border-b-2 transition ${
            activeTab === 'enviar'
              ? 'border-[#00f0ff] text-[#00f0ff] bg-[#00f0ff]/10'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          Enviar Comunicado / Campaña
        </button>
        <button
          onClick={() => setActiveTab('plantillas')}
          className={`px-5 py-3 text-sm font-semibold border-b-2 transition ${
            activeTab === 'plantillas'
              ? 'border-[#00f0ff] text-[#00f0ff] bg-[#00f0ff]/10'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          Plantillas ({plantillas.length})
        </button>
      </div>

      {/* Contenido Pestaña 1: Historial */}
      {activeTab === 'historial' && (
        <div className="bg-[#111827]/80 border border-[#1e293b] rounded-xl p-6 backdrop-blur-md">
          {loading ? (
            <div className="py-12 text-center text-slate-400">Cargando bitácora de correos...</div>
          ) : correos.length === 0 ? (
            <div className="py-12 text-center text-slate-400">No hay registros en CorreoEnviado todavía.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-[#1e293b] text-slate-400 font-medium">
                    <th className="py-3 px-4">Destinatario</th>
                    <th className="py-3 px-4">Asunto</th>
                    <th className="py-3 px-4">Estado</th>
                    <th className="py-3 px-4">Apertura</th>
                    <th className="py-3 px-4">Fecha</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1e293b]/60">
                  {correos.map((c) => (
                    <tr key={c.id} className="hover:bg-[#1e293b]/30 transition">
                      <td className="py-3 px-4 font-mono text-[#00f0ff]">{c.destinatario}</td>
                      <td className="py-3 px-4 text-white font-medium">{c.asunto}</td>
                      <td className="py-3 px-4">
                        {c.estado === 'ENVIADO' ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                            <CheckCircle2 className="h-3.5 w-3.5" /> Enviado
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-rose-500/20 text-rose-400 border border-rose-500/30">
                            <XCircle className="h-3.5 w-3.5" /> Fallido
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-400">
                        {c.abierto ? <span className="text-[#eab308]">Abierto</span> : 'No abierto'}
                      </td>
                      <td className="py-3 px-4 text-slate-400 text-xs">
                        {new Date(c.createdAt).toLocaleString('es-PA')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Contenido Pestaña 2: Enviar */}
      {activeTab === 'enviar' && (
        <form onSubmit={handleEnviar} className="bg-[#111827]/80 border border-[#1e293b] rounded-xl p-6 space-y-5 max-w-3xl">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Send className="h-5 w-5 text-[#00f0ff]" />
            Redactar Nuevo Comunicado del Superadministrador
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Tipo de Destinatario
              </label>
              <select
                value={tipoDestino}
                onChange={(e: any) => setTipoDestino(e.target.value)}
                className="w-full bg-[#0b111e] border border-[#1e293b] rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#00f0ff]"
              >
                <option value="individual">Individual (Una cuenta o correo)</option>
                <option value="plan">Por Plan (Filtrar por nivel de suscripción)</option>
                <option value="todos">Todos los Clientes Activos (Campaña General)</option>
              </select>
            </div>

            {tipoDestino === 'individual' && (
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Correo Electrónico Destino
                </label>
                <input
                  type="email"
                  value={correoDestino}
                  onChange={(e) => setCorreoDestino(e.target.value)}
                  placeholder="empresa@panama.com"
                  className="w-full bg-[#0b111e] border border-[#1e293b] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#00f0ff]"
                  required
                />
              </div>
            )}

            {tipoDestino === 'plan' && (
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  ID o Slug del Plan
                </label>
                <input
                  type="text"
                  value={planDestino}
                  onChange={(e) => setPlanDestino(e.target.value)}
                  placeholder="pro / enterprise / id"
                  className="w-full bg-[#0b111e] border border-[#1e293b] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#00f0ff]"
                  required
                />
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Asunto del Correo
            </label>
            <input
              type="text"
              value={asunto}
              onChange={(e) => setAsunto(e.target.value)}
              placeholder="Importante: Actualización normativa DGI 2026..."
              className="w-full bg-[#0b111e] border border-[#1e293b] rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#00f0ff]"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Contenido HTML o Texto Libre (Soporta variables &#123;&#123;nombre&#125;&#125; y &#123;&#123;empresa&#125;&#125;)
            </label>
            <textarea
              value={cuerpoHtml}
              onChange={(e) => setCuerpoHtml(e.target.value)}
              rows={7}
              placeholder="<p>Estimado/a {{nombre}}, queremos informarle sobre...</p>"
              className="w-full bg-[#0b111e] border border-[#1e293b] rounded-lg px-3 py-2.5 text-white text-sm font-mono focus:outline-none focus:border-[#00f0ff]"
              required
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={enviando}
              className="w-full md:w-auto px-6 py-3 bg-gradient-to-r from-[#00f0ff] to-[#0080ff] hover:opacity-90 text-[#0b111e] font-bold rounded-lg transition flex items-center justify-center gap-2 shadow-lg shadow-[#00f0ff]/20"
            >
              <Send className="h-4 w-4" />
              {enviando ? 'Enviando y Registrando...' : 'Confirmar y Enviar Correo'}
            </button>
          </div>
        </form>
      )}

      {/* Contenido Pestaña 3: Plantillas */}
      {activeTab === 'plantillas' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <FileText className="h-5 w-5 text-[#00f0ff]" />
              Plantillas Activas del ERP ({plantillas.length})
            </h3>

            {plantillas.length === 0 ? (
              <div className="bg-[#111827]/80 border border-[#1e293b] rounded-xl p-8 text-center text-slate-400">
                No hay plantillas personalizadas. Las plantillas del sistema se generan automáticamente según demanda.
              </div>
            ) : (
              plantillas.map((p) => (
                <div key={p.id} className="bg-[#111827]/80 border border-[#1e293b] rounded-xl p-5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-1 rounded bg-[#00f0ff]/20 text-[#00f0ff] font-mono font-bold text-xs">
                      {p.clave}
                    </span>
                    <span className="text-xs text-slate-400">ID: {p.id}</span>
                  </div>
                  <h4 className="font-semibold text-white text-base">{p.asunto}</h4>
                  <div className="bg-[#0b111e] p-3 rounded border border-[#1e293b] text-xs font-mono text-slate-300 max-h-32 overflow-y-auto">
                    {p.cuerpo}
                  </div>
                </div>
              ))
            )}
          </div>

          <div>
            <form onSubmit={handleCrearPlantilla} className="bg-[#111827]/80 border border-[#1e293b] rounded-xl p-5 space-y-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Plus className="h-4 w-4 text-[#00f0ff]" />
                Crear Nueva Plantilla
              </h3>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Clave de Plantilla (Unica)</label>
                <input
                  type="text"
                  value={nuevaClave}
                  onChange={(e) => setNuevaClave(e.target.value)}
                  placeholder="EJ. SALDO_BAJO"
                  className="w-full bg-[#0b111e] border border-[#1e293b] rounded px-3 py-2 text-white text-xs font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Asunto por Defecto</label>
                <input
                  type="text"
                  value={nuevoAsunto}
                  onChange={(e) => setNuevoAsunto(e.target.value)}
                  placeholder="¡Atención! Tu saldo está por agotarse"
                  className="w-full bg-[#0b111e] border border-[#1e293b] rounded px-3 py-2 text-white text-xs"
                  required
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Cuerpo HTML</label>
                <textarea
                  value={nuevoCuerpo}
                  onChange={(e) => setNuevoCuerpo(e.target.value)}
                  rows={5}
                  placeholder="<p>Hola {{nombre}}, tu saldo actual es {{saldo}}.</p>"
                  className="w-full bg-[#0b111e] border border-[#1e293b] rounded px-3 py-2 text-white text-xs font-mono"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-[#00f0ff] hover:bg-[#00f0ff]/80 text-[#0b111e] font-bold rounded text-xs transition"
              >
                Guardar Plantilla
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
