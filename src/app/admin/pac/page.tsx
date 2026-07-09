'use client';

import React, { useState, useEffect } from 'react';
import { Building2, ShieldCheck, Activity, Plus, Trash2, CheckCircle2, AlertTriangle, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

export default function SuperadminPACPage() {
  const [pacs, setPacs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [testingId, setTestingId] = useState<string | null>(null);

  // Form para nuevo PAC
  const [proveedor, setProveedor] = useState('');
  const [ambiente, setAmbiente] = useState<'TEST' | 'PRODUCCION'>('TEST');
  const [credenciales, setCredenciales] = useState('');
  const [esRespaldo, setEsRespaldo] = useState(false);
  const [guardando, setGuardando] = useState(false);

  const cargarPACs = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/pac');
      const data = await res.json();
      setPacs(Array.isArray(data) ? data : []);
    } catch (error) {
      toast.error('Error al cargar configuración PAC');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarPACs();
  }, []);

  const handleProbarConexion = async (id: string) => {
    setTestingId(id);
    try {
      const res = await fetch(`/api/admin/pac/${id}/test`, { method: 'POST' });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(`Conexión OK (${data.latenciaMs}ms): ${data.mensaje}`);
      } else {
        toast.error(`Fallo (${data.latenciaMs || 0}ms): ${data.mensaje || 'Error de PAC'}`);
      }
    } catch (error) {
      toast.error('Error de red al probar conexión PAC');
    } finally {
      setTestingId(null);
    }
  };

  const handleTogglePrimario = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/pac/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ makePrimary: true })
      });
      if (res.ok) {
        toast.success('¡PAC Primario conmutado con 1 clic!');
        cargarPACs();
      } else {
        toast.error('No se pudo conmutar el PAC primario');
      }
    } catch (error) {
      toast.error('Error en conmutación');
    }
  };

  const handleEliminar = async (id: string) => {
    if (!confirm('¿Seguro que deseas eliminar esta configuración PAC?')) return;
    try {
      const res = await fetch(`/api/admin/pac/${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('PAC eliminado');
        cargarPACs();
      } else {
        toast.error('No se pudo eliminar el proveedor');
      }
    } catch (error) {
      toast.error('Error al eliminar PAC');
    }
  };

  const handleGuardarPAC = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!proveedor.trim() || !credenciales.trim()) {
      toast.error('Proveedor y credenciales son obligatorios.');
      return;
    }
    setGuardando(true);
    try {
      const res = await fetch('/api/admin/pac', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          proveedor,
          ambiente,
          credenciales,
          esRespaldo,
          activo: true
        })
      });
      if (res.ok) {
        toast.success('Proveedor PAC registrado de forma segura y cifrada.');
        setProveedor('');
        setCredenciales('');
        setEsRespaldo(false);
        cargarPACs();
      } else {
        const err = await res.json();
        toast.error(err.error || 'Fallo al guardar PAC');
      }
    } catch (error) {
      toast.error('Error guardando configuración');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0b111e] text-white p-6 space-y-6">
      {/* Cabecera */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#1e293b] pb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#00f0ff] flex items-center gap-2">
            <Building2 className="h-7 w-7 text-[#00f0ff]" />
            Configuración de PAC & Conectividad DGI (Superadmin)
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Administración de Proveedores de Autorización Certificada primario y de respaldo con monitoreo en tiempo real
          </p>
        </div>
        <button
          onClick={cargarPACs}
          className="flex items-center gap-2 px-4 py-2 bg-[#1e293b] hover:bg-[#334155] text-white rounded-lg text-sm font-medium transition"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin text-[#00f0ff]' : ''}`} />
          Actualizar Lista
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna Izquierda / Centro: Lista PACs */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-[#00f0ff]" />
            Proveedores PAC Configurados ({pacs.length})
          </h3>

          {loading ? (
            <div className="py-12 bg-[#111827]/80 rounded-xl border border-[#1e293b] text-center text-slate-400">
              Verificando conexiones y servidores PAC...
            </div>
          ) : pacs.length === 0 ? (
            <div className="py-12 bg-[#111827]/80 rounded-xl border border-[#1e293b] text-center text-slate-400">
              No hay proveedores PAC configurados. Registra el primario a la derecha.
            </div>
          ) : (
            <div className="space-y-4">
              {pacs.map((p) => (
                <div
                  key={p.id}
                  className={`bg-[#111827]/90 border rounded-xl p-5 transition relative overflow-hidden ${
                    !p.esRespaldo ? 'border-[#00f0ff] shadow-lg shadow-[#00f0ff]/10' : 'border-[#1e293b]'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold text-white">{p.proveedor}</span>
                        <span className={`px-2 py-0.5 rounded text-xs font-mono font-bold ${
                          p.ambiente === 'PRODUCCION' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                        }`}>
                          {p.ambiente}
                        </span>
                        {!p.esRespaldo ? (
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#00f0ff] text-[#0b111e]">
                            ★ PAC PRIMARIO (ACTIVO)
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700">
                            Respaldo / Secundario
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-400 flex items-center gap-4 pt-1">
                        <span>Credenciales: <strong className="text-slate-200">{p.credencialesMasked}</strong> (cifradas en servidor)</span>
                        <span>Estado: <strong className={p.activo ? 'text-emerald-400' : 'text-rose-400'}>{p.activo ? 'Operativo' : 'Inactivo'}</strong></span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleProbarConexion(p.id)}
                        disabled={testingId === p.id}
                        className="px-3.5 py-2 rounded-lg bg-[#1e293b] hover:bg-[#334155] text-white text-xs font-semibold flex items-center gap-1.5 transition border border-slate-700"
                      >
                        <Activity className={`h-3.5 w-3.5 text-[#00f0ff] ${testingId === p.id ? 'animate-spin' : ''}`} />
                        {testingId === p.id ? 'Midiendo Latencia...' : 'Probar Conexión'}
                      </button>

                      {p.esRespaldo && (
                        <button
                          onClick={() => handleTogglePrimario(p.id)}
                          className="px-3 py-2 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 text-xs font-semibold border border-emerald-500/30 transition"
                          title="Volver PAC Primario con 1 clic"
                        >
                          Conmutar como Primario
                        </button>
                      )}

                      <button
                        onClick={() => handleEliminar(p.id)}
                        className="p-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition"
                        title="Eliminar PAC"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Columna Derecha: Agregar PAC */}
        <div>
          <form onSubmit={handleGuardarPAC} className="bg-[#111827]/80 border border-[#1e293b] rounded-xl p-5 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Plus className="h-4 w-4 text-[#00f0ff]" />
              Registrar Nuevo Servidor PAC
            </h3>

            <div>
              <label className="block text-xs text-slate-400 mb-1">Nombre del Proveedor</label>
              <input
                type="text"
                value={proveedor}
                onChange={(e) => setProveedor(e.target.value)}
                placeholder="Ej. The Factory HKA / PAC Panamá"
                className="w-full bg-[#0b111e] border border-[#1e293b] rounded px-3 py-2 text-white text-xs"
                required
              />
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">Ambiente de Operación</label>
              <select
                value={ambiente}
                onChange={(e: any) => setAmbiente(e.target.value)}
                className="w-full bg-[#0b111e] border border-[#1e293b] rounded px-3 py-2 text-white text-xs"
              >
                <option value="TEST">Pruebas / Simulación (TEST)</option>
                <option value="PRODUCCION">Certificación Real (PRODUCCIÓN)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">Credenciales / Token CIF o Certificado Digital</label>
              <textarea
                value={credenciales}
                onChange={(e) => setCredenciales(e.target.value)}
                rows={3}
                placeholder="Pegar cadena de autenticación o clave privada API del PAC..."
                className="w-full bg-[#0b111e] border border-[#1e293b] rounded px-3 py-2 text-white text-xs font-mono"
                required
              />
              <p className="text-[10px] text-slate-500 mt-1">Se encriptará con AES/Base64 en la base de datos.</p>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="esRespaldoChk"
                checked={esRespaldo}
                onChange={(e) => setEsRespaldo(e.target.checked)}
                className="rounded border-[#1e293b] bg-[#0b111e] text-[#00f0ff]"
              />
              <label htmlFor="esRespaldoChk" className="text-xs text-slate-300">
                Registrar como PAC de Respaldo (Secundario)
              </label>
            </div>

            <button
              type="submit"
              disabled={guardando}
              className="w-full py-2.5 bg-gradient-to-r from-[#00f0ff] to-[#0080ff] text-[#0b111e] font-bold rounded text-xs transition shadow-md shadow-[#00f0ff]/20"
            >
              {guardando ? 'Guardando...' : 'Guardar y Encriptar Credenciales'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
