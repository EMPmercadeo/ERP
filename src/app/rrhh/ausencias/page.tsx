'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Topbar } from '@/components/layout/Topbar';
import { ContentContainer } from '@/components/layout/Content';
import {
  Calendar,
  CheckCircle,
  XCircle,
  FileText,
  Clock,
  User,
  PlusCircle,
  Filter,
  RefreshCw,
  AlertTriangle
} from 'lucide-react';

export default function AusenciasPage() {
  const [ausencias, setAusencias] = useState<any[]>([]);
  const [empleados, setEmpleados] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroEstado, setFiltroEstado] = useState('PENDIENTE');
  const [empresaId, setEmpresaId] = useState('');

  // Modal Nueva Ausencia
  const [showModal, setShowModal] = useState(false);
  const [empleadoId, setEmpleadoId] = useState('');
  const [tipo, setTipo] = useState('VACACIONES');
  const [desde, setDesde] = useState(new Date().toISOString().split('T')[0]);
  const [hasta, setHasta] = useState(new Date().toISOString().split('T')[0]);
  const [docUrl, setDocUrl] = useState('');
  const [nota, setNota] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [errorModal, setErrorModal] = useState('');

  const cargarDatos = async () => {
    setLoading(true);
    try {
      let currentEmpresa = localStorage.getItem('active_tenant_id') || 'empresa-demo-id';
      setEmpresaId(currentEmpresa);

      const [resAus, resEmp] = await Promise.all([
        fetch(`/api/rrhh/ausencias?estado=${filtroEstado}&take=50`),
        fetch(`/api/rrhh/empleados?estado=activo&empresaId=${currentEmpresa}`)
      ]);

      if (resAus.ok) {
        const dataAus = await resAus.json();
        setAusencias(dataAus.items || []);
      }
      if (resEmp.ok) {
        const dataEmp = await resEmp.json();
        setEmpleados(dataEmp.items || []);
        if (dataEmp.items?.length > 0 && !empleadoId) {
          setEmpleadoId(dataEmp.items[0].id);
        }
      }
    } catch (err) {
      console.error('Error al cargar ausencias:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, [filtroEstado]);

  const handleCrearAusencia = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorModal('');
    setGuardando(true);
    try {
      const res = await fetch('/api/rrhh/ausencias', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          empleadoId,
          tipo,
          desde,
          hasta,
          documentoUrl: docUrl || null,
          nota: nota || null
        })
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorModal(data.error || 'Error al registrar solicitud');
      } else {
        setShowModal(false);
        setDocUrl('');
        setNota('');
        cargarDatos();
      }
    } catch {
      setErrorModal('Error en la conexión con el servidor');
    } finally {
      setGuardando(false);
    }
  };

  const handleResolver = async (id: string, estado: 'APROBADA' | 'RECHAZADA') => {
    if (!confirm(`¿Está seguro que desea ${estado === 'APROBADA' ? 'APROBAR' : 'RECHAZAR'} esta solicitud? Si es de vacaciones y se aprueba, se descontarán los días automáticamente del libro mayor del colaborador.`)) return;
    try {
      const res = await fetch(`/api/rrhh/ausencias/${id}/aprobar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado, aprobadaPor: 'Supervisor RRHH' })
      });
      if (res.ok) {
        cargarDatos();
      } else {
        const d = await res.json();
        alert('Error: ' + d.error);
      }
    } catch {
      alert('Error al resolver solicitud');
    }
  };

  return (
    <div className="min-h-screen bg-[#0b111e] text-slate-100">
      <Topbar title="Control de Ausencias, Permisos e Incapacidades CSS" />
      <ContentContainer>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                <Calendar className="h-7 w-7 text-[#00f0ff]" />
                Ausencias y Permisos
              </h1>
              <p className="text-sm text-slate-400 mt-1">
                Validación de incapacidades CSS, control de traslapes y débito automático al aprobar vacaciones.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button onClick={cargarDatos} variant="outline" size="icon" className="border-slate-800 text-slate-300">
                <RefreshCw className="h-4 w-4" />
              </Button>
              <Button
                onClick={() => setShowModal(true)}
                className="bg-[#00f0ff] hover:bg-[#00f0ff]/90 text-[#0b111e] font-bold shadow-lg shadow-[#00f0ff]/20"
              >
                <PlusCircle className="h-4 w-4 mr-2" />
                Nueva Solicitud de Ausencia
              </Button>
            </div>
          </div>

          {/* Filtros */}
          <Card className="bg-[#121b2d] border-slate-800">
            <CardContent className="p-4 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-slate-400" />
                <span className="text-xs text-slate-400 font-medium">Estado de Solicitud:</span>
                <div className="flex bg-[#0b111e] p-1 rounded-md border border-slate-800">
                  <button
                    onClick={() => setFiltroEstado('PENDIENTE')}
                    className={`px-3 py-1 text-xs rounded transition-all ${filtroEstado === 'PENDIENTE' ? 'bg-amber-500 text-[#0b111e] font-bold' : 'text-slate-400 hover:text-white'}`}
                  >
                    Pendientes
                  </button>
                  <button
                    onClick={() => setFiltroEstado('APROBADA')}
                    className={`px-3 py-1 text-xs rounded transition-all ${filtroEstado === 'APROBADA' ? 'bg-emerald-500 text-[#0b111e] font-bold' : 'text-slate-400 hover:text-white'}`}
                  >
                    Aprobadas
                  </button>
                  <button
                    onClick={() => setFiltroEstado('RECHAZADA')}
                    className={`px-3 py-1 text-xs rounded transition-all ${filtroEstado === 'RECHAZADA' ? 'bg-red-500 text-[#0b111e] font-bold' : 'text-slate-400 hover:text-white'}`}
                  >
                    Rechazadas
                  </button>
                  <button
                    onClick={() => setFiltroEstado('all')}
                    className={`px-3 py-1 text-xs rounded transition-all ${filtroEstado === 'all' ? 'bg-[#00f0ff] text-[#0b111e] font-bold' : 'text-slate-400 hover:text-white'}`}
                  >
                    Todas
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Grid/Lista */}
          {loading ? (
            <div className="text-center py-16 text-slate-400 animate-pulse">Cargando solicitudes de ausencias...</div>
          ) : ausencias.length === 0 ? (
            <Card className="bg-[#121b2d] border-slate-800 text-center py-12">
              <CardContent>
                <Clock className="h-12 w-12 text-slate-600 mx-auto mb-3" />
                <h3 className="text-base font-bold text-white mb-1">Sin solicitudes en este estado</h3>
                <p className="text-xs text-slate-400">No hay ausencias {filtroEstado.toLowerCase()}s en este momento.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {ausencias.map((aus) => (
                <Card key={aus.id} className="bg-[#121b2d] border-slate-800 hover:border-slate-700 transition-all">
                  <CardContent className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge className={
                          aus.tipo === 'VACACIONES' ? 'bg-[#00f0ff]/10 text-[#00f0ff] border border-[#00f0ff]/30' :
                          aus.tipo === 'ENFERMEDAD' || aus.tipo === 'MATERNIDAD' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/30' :
                          'bg-slate-700 text-slate-300'
                        }>
                          {aus.tipo}
                        </Badge>
                        <span className="text-sm font-bold text-white">{aus.empleado?.nombre}</span>
                        <span className="text-xs text-slate-500 font-mono">({aus.empleado?.cedula})</span>
                      </div>
                      <p className="text-xs text-slate-400">
                        Periodo: <strong className="text-slate-200">{new Date(aus.desde).toLocaleDateString('es-PA')} al {new Date(aus.hasta).toLocaleDateString('es-PA')}</strong> &nbsp;|&nbsp; 
                        Duración: <strong className="text-[#00f0ff] font-mono">{aus.dias} días</strong>
                      </p>
                      {aus.nota && <p className="text-xs text-slate-400 italic">Nota: "{aus.nota}"</p>}
                    </div>

                    <div className="flex items-center gap-4 justify-between md:justify-end">
                      {aus.documentoUrl ? (
                        <a href={aus.documentoUrl} target="_blank" className="text-xs text-[#00f0ff] hover:underline flex items-center gap-1 bg-[#0b111e] px-2.5 py-1.5 rounded border border-slate-800">
                          <FileText className="h-3.5 w-3.5" /> Adjunto CSS
                        </a>
                      ) : (
                        <span className="text-xs text-slate-500 italic">Sin adjunto</span>
                      )}

                      <Badge className={
                        aus.estado === 'APROBADA' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-xs font-bold' :
                        aus.estado === 'RECHAZADA' ? 'bg-red-500/20 text-red-400 border border-red-500/40 text-xs font-bold' :
                        'bg-amber-500/20 text-amber-400 border border-amber-500/40 text-xs font-bold animate-pulse'
                      }>
                        {aus.estado}
                      </Badge>

                      {aus.estado === 'PENDIENTE' && (
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleResolver(aus.id, 'APROBADA')}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-8 px-3"
                          >
                            <CheckCircle className="h-3.5 w-3.5 mr-1" /> Aprobar
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleResolver(aus.id, 'RECHAZADA')}
                            variant="destructive"
                            className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs h-8 px-3"
                          >
                            <XCircle className="h-3.5 w-3.5 mr-1" /> Rechazar
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </ContentContainer>

      {/* Modal Nueva Ausencia */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <Card className="bg-[#121b2d] border-slate-700 w-full max-w-lg shadow-2xl">
            <CardHeader className="border-b border-slate-800 pb-4">
              <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
                <Clock className="h-5 w-5 text-[#00f0ff]" />
                Registrar Solicitud de Ausencia
              </CardTitle>
              <CardDescription className="text-xs text-slate-400">
                Si es incapacidad de la Caja de Seguro Social (CSS), el certificado es obligatorio.
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleCrearAusencia}>
              <CardContent className="space-y-4 pt-4 text-xs">
                {errorModal && (
                  <div className="p-3 rounded bg-red-500/10 border border-red-500/30 text-red-400 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                    <span>{errorModal}</span>
                  </div>
                )}
                <div>
                  <label className="font-semibold text-slate-300 block mb-1">Colaborador:</label>
                  <select
                    required
                    value={empleadoId}
                    onChange={(e) => setEmpleadoId(e.target.value)}
                    className="w-full bg-[#0b111e] border border-slate-700 rounded text-sm text-white px-3 py-2 focus:outline-none focus:border-[#00f0ff]"
                  >
                    {empleados.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.nombre} ({emp.cedula}) - {emp.cargo}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-slate-300 block mb-1">Tipo de Ausencia / Permiso:</label>
                  <select
                    value={tipo}
                    onChange={(e) => setTipo(e.target.value)}
                    className="w-full bg-[#0b111e] border border-slate-700 rounded text-sm text-white px-3 py-2 focus:outline-none focus:border-[#00f0ff]"
                  >
                    <option value="VACACIONES">VACACIONES (DESCUENTA DE LIBRO MAYOR)</option>
                    <option value="ENFERMEDAD">INCAPACIDAD POR ENFERMEDAD (CSS)</option>
                    <option value="MATERNIDAD">LICENCIA DE MATERNIDAD (CSS)</option>
                    <option value="PERMISO">PERMISO PERSONAL JUSTIFICADO</option>
                    <option value="LUTO">LICENCIA POR DUELO / LUTO</option>
                    <option value="INJUSTIFICADA">AUSENCIA INJUSTIFICADA</option>
                    <option value="OTRO">OTRO PERMISO</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold text-slate-300 block mb-1">Desde (Inicio):</label>
                    <Input
                      required
                      type="date"
                      value={desde}
                      onChange={(e) => setDesde(e.target.value)}
                      className="bg-[#0b111e] border-slate-700 text-white"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-300 block mb-1">Hasta (Fin):</label>
                    <Input
                      required
                      type="date"
                      value={hasta}
                      onChange={(e) => setHasta(e.target.value)}
                      className="bg-[#0b111e] border-slate-700 text-white"
                    />
                  </div>
                </div>
                {(tipo === 'ENFERMEDAD' || tipo === 'MATERNIDAD') && (
                  <div>
                    <label className="font-semibold text-purple-400 block mb-1">URL / Enlace Certificado Médico o CSS (*Obligatorio):</label>
                    <Input
                      required
                      placeholder="https://... certificado_css.pdf"
                      value={docUrl}
                      onChange={(e) => setDocUrl(e.target.value)}
                      className="bg-[#0b111e] border-purple-500/50 text-white placeholder:text-slate-500"
                    />
                  </div>
                )}
                <div>
                  <label className="font-semibold text-slate-300 block mb-1">Nota o Detalle Adicional:</label>
                  <Input
                    placeholder="Motivo, indicaciones del médico, etc."
                    value={nota}
                    onChange={(e) => setNota(e.target.value)}
                    className="bg-[#0b111e] border-slate-700 text-white"
                  />
                </div>
              </CardContent>
              <div className="p-4 border-t border-slate-800 flex justify-end gap-3 bg-[#0b111e]/50">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowModal(false)}
                  className="border-slate-700 text-slate-300 hover:bg-slate-800 text-xs"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={guardando}
                  className="bg-[#00f0ff] hover:bg-[#00f0ff]/90 text-[#0b111e] font-bold text-xs px-5 shadow-lg"
                >
                  {guardando ? 'Registrando...' : 'Registrar Solicitud'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
