'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Topbar } from '@/components/layout/Topbar';
import { ContentContainer } from '@/components/layout/Content';
import {
  User,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  FileText,
  Download,
  PlusCircle,
  Clock,
  ArrowLeft,
  ShieldCheck,
  Ban,
  PenTool
} from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';

export default function FichaColaboradorPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [ficha, setFicha] = useState<any>(null);
  const [saldoVacaciones, setSaldoVacaciones] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'vacaciones' | 'ausencias' | 'expediente'>('vacaciones');

  // Modal Nueva Acta
  const [showActaModal, setShowActaModal] = useState(false);
  const [actaTipo, setActaTipo] = useState('AMONESTACION_ESCRITA');
  const [actaFalta, setActaFalta] = useState('Ausentismo e Incumplimiento de Horario');
  const [actaDesc, setActaDesc] = useState('');
  const [actaFecha, setActaFecha] = useState(new Date().toISOString().split('T')[0]);
  const [actaEvidencia, setActaEvidencia] = useState('');
  const [guardandoActa, setGuardandoActa] = useState(false);

  // Cargar ficha
  const cargarFicha = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/rrhh/empleados/${id}`);
      if (res.ok) {
        const data = await res.json();
        setFicha(data.empleado);
        setSaldoVacaciones(data.saldoVacaciones);
      } else {
        alert('Colaborador no encontrado');
        router.push('/rrhh/empleados');
      }
    } catch (err) {
      console.error('Error al cargar ficha:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) cargarFicha();
  }, [id]);

  const handleCrearActa = async (e: React.FormEvent) => {
    e.preventDefault();
    setGuardandoActa(true);
    try {
      const res = await fetch(`/api/rrhh/expediente/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tipo: actaTipo,
          falta: actaFalta,
          descripcion: actaDesc,
          fechaHecho: actaFecha,
          evidenciaUrl: actaEvidencia || null,
          emitidaPor: 'Jefe de Recursos Humanos / Supervisor'
        })
      });

      if (res.ok) {
        setShowActaModal(false);
        setActaDesc('');
        cargarFicha();
      } else {
        const data = await res.json();
        alert('Error: ' + data.error);
      }
    } catch {
      alert('Error de conexión');
    } finally {
      setGuardandoActa(false);
    }
  };

  const handleFirmarAcuse = async (actaId: string) => {
    if (!confirm('Al confirmar, se registrará la firma probatoria electrónica (Acuse de Recibo) de este colaborador, junto con la fecha y hora exacta de recepción (Art. 213 Código de Trabajo). ¿Desea continuar?')) return;
    try {
      const res = await fetch(`/api/rrhh/expediente/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accion: 'FIRMA_ACUSE',
          actaId
        })
      });
      if (res.ok) {
        cargarFicha();
      } else {
        alert('Error al registrar acuse');
      }
    } catch {
      alert('Error de red');
    }
  };

  const handleDarDeBaja = async () => {
    if (!confirm('¿Seguro que desea dar de baja a este colaborador? Se aplicará soft-delete (retención de historial y ledger según DGI y Código de Trabajo).')) return;
    try {
      const res = await fetch(`/api/rrhh/empleados/${id}`, { method: 'DELETE' });
      if (res.ok) {
        alert('Colaborador dado de baja exitosamente');
        cargarFicha();
      } else {
        alert('Error al dar de baja');
      }
    } catch {
      alert('Error en la solicitud');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0b111e] text-slate-100 flex items-center justify-center">
        <div className="text-center text-slate-400 animate-pulse">Cargando expediente del colaborador...</div>
      </div>
    );
  }

  if (!ficha) return null;

  return (
    <div className="min-h-screen bg-[#0b111e] text-slate-100">
      <Topbar title={`Expediente: ${ficha.nombre}`} />
      <ContentContainer>
        <div className="space-y-6">
          {/* Header con botón regresar y estado */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
            <div className="flex items-center gap-3">
              <Link href="/rrhh/empleados">
                <Button variant="outline" size="icon" className="border-slate-700 bg-slate-900 text-slate-300 hover:text-white">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold text-white">{ficha.nombre}</h1>
                  <Badge className={ficha.activo ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-red-500/10 text-red-400 border border-red-500/30'}>
                    {ficha.activo ? 'Activo' : 'Baja (Soft-Delete)'}
                  </Badge>
                </div>
                <p className="text-xs text-slate-400 mt-1 font-mono">
                  Cédula: <strong className="text-slate-200">{ficha.cedula}</strong> &nbsp;|&nbsp; 
                  Cargo: <strong className="text-[#00f0ff]">{ficha.cargo}</strong> &nbsp;|&nbsp; 
                  Contrato: <strong className="text-slate-300">{ficha.tipoContrato}</strong>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <a href={`/api/rrhh/expediente/${id}/pdf`} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" className="border-[#00f0ff]/40 text-[#00f0ff] hover:bg-[#00f0ff]/10 text-xs font-bold">
                  <Download className="h-4 w-4 mr-2" />
                  Descargar Expediente PDF (MITRADEL)
                </Button>
              </a>
              {ficha.activo && (
                <Button onClick={handleDarDeBaja} variant="destructive" className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold">
                  <Ban className="h-4 w-4 mr-2" />
                  Dar de Baja
                </Button>
              )}
            </div>
          </div>

          {/* KPI Cards (Salario, Saldo Vacaciones, Ausencias, Actas) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-[#121b2d] border-slate-800">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-400 font-medium">Salario Base Mensual</p>
                  <p className="text-xl font-bold text-white font-mono mt-1">${Number(ficha.salarioBase).toFixed(2)}</p>
                </div>
                <div className="h-10 w-10 rounded-full bg-[#00f0ff]/10 flex items-center justify-center text-[#00f0ff]">
                  $
                </div>
              </CardContent>
            </Card>

            <Card className="bg-[#121b2d] border-slate-800">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-400 font-medium">Saldo de Vacaciones (Ledger)</p>
                  <p className="text-xl font-bold text-[#00f0ff] font-mono mt-1">{saldoVacaciones.toFixed(2)} días</p>
                </div>
                <div className="h-10 w-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                  <Calendar className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-[#121b2d] border-slate-800">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-400 font-medium">Ausencias Solicitadas</p>
                  <p className="text-xl font-bold text-white mt-1">{ficha.ausencias?.length || 0}</p>
                </div>
                <div className="h-10 w-10 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-400">
                  <Clock className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-[#121b2d] border-slate-800">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-400 font-medium">Actas Disciplinarias</p>
                  <p className="text-xl font-bold text-red-400 mt-1">{ficha.actas?.length || 0}</p>
                </div>
                <div className="h-10 w-10 rounded-full bg-red-500/10 flex items-center justify-center text-red-400">
                  <AlertTriangle className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Navegación por Pestañas */}
          <div className="flex border-b border-slate-800 gap-2">
            <button
              onClick={() => setActiveTab('vacaciones')}
              className={`pb-3 px-4 text-xs font-bold border-b-2 transition-all ${activeTab === 'vacaciones' ? 'border-[#00f0ff] text-[#00f0ff]' : 'border-transparent text-slate-400 hover:text-white'}`}
            >
              1. Ledger de Vacaciones (Devengo & Toma)
            </button>
            <button
              onClick={() => setActiveTab('ausencias')}
              className={`pb-3 px-4 text-xs font-bold border-b-2 transition-all ${activeTab === 'ausencias' ? 'border-[#00f0ff] text-[#00f0ff]' : 'border-transparent text-slate-400 hover:text-white'}`}
            >
              2. Ausencias e Incapacidades CSS ({ficha.ausencias?.length || 0})
            </button>
            <button
              onClick={() => setActiveTab('expediente')}
              className={`pb-3 px-4 text-xs font-bold border-b-2 transition-all ${activeTab === 'expediente' ? 'border-[#00f0ff] text-[#00f0ff]' : 'border-transparent text-slate-400 hover:text-white'}`}
            >
              3. Expediente Disciplinario y Acuses ({ficha.actas?.length || 0})
            </button>
          </div>

          {/* TAB 1: LEDGER DE VACACIONES */}
          {activeTab === 'vacaciones' && (
            <Card className="bg-[#121b2d] border-slate-800">
              <CardHeader className="border-b border-slate-800/60 pb-3">
                <CardTitle className="text-base font-bold text-white flex items-center justify-between">
                  <span>Libro Mayor (Ledger) de Movimientos de Vacaciones</span>
                  <span className="text-xs text-slate-400 font-normal">Cálculo acumulativo inmutable</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#0b111e] text-slate-400 uppercase font-bold border-b border-slate-800">
                      <tr>
                        <th className="py-3 px-4">Fecha</th>
                        <th className="py-3 px-4">Tipo</th>
                        <th className="py-3 px-4">Días (Impacto)</th>
                        <th className="py-3 px-4">Saldo Posterior</th>
                        <th className="py-3 px-4">Referencia / Detalle</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {ficha.movVacaciones?.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-8 text-center text-slate-500">
                            No hay movimientos en el ledger. Presiona &quot;Devengo Vacaciones&quot; en el directorio para generar el primer abono de ley.
                          </td>
                        </tr>
                      ) : (
                        ficha.movVacaciones?.map((mov: any) => (
                          <tr key={mov.id} className="hover:bg-slate-800/30">
                            <td className="py-3 px-4 font-mono text-slate-300">
                              {new Date(mov.createdAt).toLocaleDateString('es-PA')}
                            </td>
                            <td className="py-3 px-4">
                              <Badge className={
                                mov.tipo === 'DEVENGO' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' :
                                mov.tipo === 'TOMA' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30' :
                                'bg-blue-500/10 text-blue-400 border border-blue-500/30'
                              }>
                                {mov.tipo}
                              </Badge>
                            </td>
                            <td className={`py-3 px-4 font-mono font-bold ${Number(mov.dias) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                              {Number(mov.dias) >= 0 ? `+${Number(mov.dias).toFixed(2)}` : Number(mov.dias).toFixed(2)} días
                            </td>
                            <td className="py-3 px-4 font-mono font-bold text-white">
                              {Number(mov.saldoPosterior).toFixed(2)} días
                            </td>
                            <td className="py-3 px-4 text-slate-400 max-w-md">
                              {mov.referencia || 'Sin referencia registrada'}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* TAB 2: AUSENCIAS */}
          {activeTab === 'ausencias' && (
            <Card className="bg-[#121b2d] border-slate-800">
              <CardHeader className="border-b border-slate-800/60 pb-3 flex flex-row items-center justify-between">
                <CardTitle className="text-base font-bold text-white">Historial de Solicitudes de Ausencia</CardTitle>
                <Link href="/rrhh/ausencias">
                  <Button size="sm" className="bg-[#00f0ff] text-[#0b111e] font-bold text-xs">
                    <PlusCircle className="h-3.5 w-3.5 mr-1.5" />
                    Nueva Solicitud de Ausencia
                  </Button>
                </Link>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#0b111e] text-slate-400 uppercase font-bold border-b border-slate-800">
                      <tr>
                        <th className="py-3 px-4">Tipo Ausencia</th>
                        <th className="py-3 px-4">Periodo</th>
                        <th className="py-3 px-4">Días</th>
                        <th className="py-3 px-4">Documento / Respaldo</th>
                        <th className="py-3 px-4">Estado</th>
                        <th className="py-3 px-4">Resuelta Por</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {ficha.ausencias?.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-slate-500">
                            No se han registrado ausencias para este colaborador.
                          </td>
                        </tr>
                      ) : (
                        ficha.ausencias?.map((aus: any) => (
                          <tr key={aus.id} className="hover:bg-slate-800/30">
                            <td className="py-3 px-4 font-bold text-white">
                              {aus.tipo}
                              {!aus.justificada && <span className="text-red-400 block text-[10px]">INJUSTIFICADA</span>}
                            </td>
                            <td className="py-3 px-4 text-slate-300">
                              {new Date(aus.desde).toLocaleDateString('es-PA')} al {new Date(aus.hasta).toLocaleDateString('es-PA')}
                            </td>
                            <td className="py-3 px-4 font-mono font-semibold text-[#00f0ff]">{aus.dias} d</td>
                            <td className="py-3 px-4">
                              {aus.documentoUrl ? (
                                <a href={aus.documentoUrl} target="_blank" className="text-cyan-400 underline flex items-center gap-1">
                                  <FileText className="h-3.5 w-3.5" /> Ver Certificado CSS
                                </a>
                              ) : (
                                <span className="text-slate-600">N/A</span>
                              )}
                            </td>
                            <td className="py-3 px-4">
                              <Badge className={
                                aus.estado === 'APROBADA' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' :
                                aus.estado === 'RECHAZADA' ? 'bg-red-500/10 text-red-400 border border-red-500/30' :
                                'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                              }>
                                {aus.estado}
                              </Badge>
                            </td>
                            <td className="py-3 px-4 text-slate-400">{aus.aprobadaPor || 'Pendiente'}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* TAB 3: EXPEDIENTE DISCIPLINARIO */}
          {activeTab === 'expediente' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center bg-[#121b2d] p-4 rounded-lg border border-slate-800">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5 text-[#00f0ff]" />
                    Trazabilidad Disciplinaria y Acuse Electrónico
                  </h3>
                  <p className="text-xs text-slate-400">
                    Todas las actas emitidas quedan bajo firma o constancia de entrega según el Art. 213 del Código de Trabajo.
                  </p>
                </div>
                <Button onClick={() => setShowActaModal(true)} className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-md">
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Emitir Nueva Acta / Sanción
                </Button>
              </div>

              {ficha.actas?.length === 0 ? (
                <Card className="bg-[#121b2d] border-slate-800 text-center py-12">
                  <CardContent>
                    <CheckCircle2 className="h-12 w-12 text-emerald-500 mx-auto mb-3" />
                    <h3 className="text-base font-bold text-white mb-1">Expediente Disciplinario Limpio</h3>
                    <p className="text-xs text-slate-400">Este colaborador no presenta llamados de atención, memorandos ni suspensiones en el sistema.</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {ficha.actas?.map((acta: any, idx: number) => (
                    <Card key={acta.id} className="bg-[#121b2d] border-slate-800 border-l-4 border-l-red-500 hover:border-slate-700 transition-all">
                      <CardHeader className="pb-2">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <Badge className="bg-red-500/20 text-red-400 border border-red-500/40 text-xs uppercase font-bold">
                              {acta.tipo.replace('_', ' ')}
                            </Badge>
                            <span className="text-xs text-slate-400 font-mono">
                              Fecha Hecho: {new Date(acta.fechaHecho).toLocaleDateString('es-PA')}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            {acta.acuseEmpleado ? (
                              <Badge className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[11px] flex items-center gap-1">
                                <CheckCircle2 className="h-3 w-3" />
                                Acuse Firmado el {new Date(acta.fechaAcuse).toLocaleDateString('es-PA')}
                              </Badge>
                            ) : (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleFirmarAcuse(acta.id)}
                                className="border-amber-500/40 text-amber-400 hover:bg-amber-500/10 text-xs h-7"
                              >
                                <PenTool className="h-3 w-3 mr-1" />
                                Registrar Acuse / Firma
                              </Button>
                            )}
                          </div>
                        </div>
                        <CardTitle className="text-base font-bold text-white mt-2">{acta.falta}</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3 pt-1 text-xs">
                        <div className="bg-[#0b111e] p-3 rounded border border-slate-800/80 text-slate-300 leading-relaxed whitespace-pre-line">
                          {acta.descripcion}
                        </div>
                        <div className="flex flex-wrap items-center justify-between gap-2 text-slate-400 pt-1 border-t border-slate-800/60">
                          <span>Emitido por: <strong className="text-white">{acta.emitidaPor}</strong></span>
                          {acta.evidenciaUrl && (
                            <a href={acta.evidenciaUrl} target="_blank" className="text-[#00f0ff] hover:underline flex items-center gap-1">
                              <FileText className="h-3.5 w-3.5" /> Ver Evidencia/Adjunto
                            </a>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </ContentContainer>

      {/* Modal para Emitir Nueva Acta */}
      {showActaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <Card className="bg-[#121b2d] border-slate-700 w-full max-w-lg shadow-2xl">
            <CardHeader className="border-b border-slate-800 pb-4">
              <CardTitle className="text-lg font-bold text-red-400 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Emitir Acta Disciplinaria (Sanción/Llamado)
              </CardTitle>
              <CardDescription className="text-xs text-slate-400">
                La acción se registrará en la auditoría inmutable e integrará el expediente para probatoria legal.
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleCrearActa}>
              <CardContent className="space-y-4 pt-4 text-xs">
                <div>
                  <label className="font-semibold text-slate-300 block mb-1">Tipo de Sanción / Medida:</label>
                  <select
                    value={actaTipo}
                    onChange={(e) => setActaTipo(e.target.value)}
                    className="w-full bg-[#0b111e] border border-slate-700 rounded text-sm text-white px-3 py-2 focus:outline-none focus:border-red-400"
                  >
                    <option value="AMONESTACION_VERBAL">AMONESTACIÓN VERBAL (REGISTRO)</option>
                    <option value="AMONESTACION_ESCRITA">AMONESTACIÓN ESCRITA</option>
                    <option value="MEMORANDO">MEMORANDO DE ADVERTENCIA</option>
                    <option value="SUSPENSION">SUSPENSIÓN DE LABORES SIN GOCE DE SUELDO</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-slate-300 block mb-1">Categoría / Motivo de Falta:</label>
                  <Input
                    required
                    placeholder="Ej. Ausentismo Injustificado, Incumplimiento de Horario, Falta de Respeto"
                    value={actaFalta}
                    onChange={(e) => setActaFalta(e.target.value)}
                    className="bg-[#0b111e] border-slate-700 text-white"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-300 block mb-1">Descripción Detallada de los Hechos:</label>
                  <textarea
                    required
                    rows={4}
                    placeholder="Describa con exactitud fecha, hora, testigos e infracción cometida..."
                    value={actaDesc}
                    onChange={(e) => setActaDesc(e.target.value)}
                    className="w-full bg-[#0b111e] border border-slate-700 rounded text-sm text-white px-3 py-2 focus:outline-none focus:border-red-400"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold text-slate-300 block mb-1">Fecha del Hecho:</label>
                    <Input
                      required
                      type="date"
                      value={actaFecha}
                      onChange={(e) => setActaFecha(e.target.value)}
                      className="bg-[#0b111e] border-slate-700 text-white"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-300 block mb-1">URL Evidencia (Opcional):</label>
                    <Input
                      placeholder="https://... foto, correo, pdf"
                      value={actaEvidencia}
                      onChange={(e) => setActaEvidencia(e.target.value)}
                      className="bg-[#0b111e] border-slate-700 text-white"
                    />
                  </div>
                </div>
              </CardContent>
              <div className="p-4 border-t border-slate-800 flex justify-end gap-3 bg-[#0b111e]/50">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowActaModal(false)}
                  className="border-slate-700 text-slate-300 hover:bg-slate-800 text-xs"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={guardandoActa}
                  className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs px-5 shadow-lg"
                >
                  {guardandoActa ? 'Registrando...' : 'Emitir Sanción'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
