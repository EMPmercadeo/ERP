'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Topbar } from '@/components/layout/Topbar';
import { ContentContainer } from '@/components/layout/Content';
import {
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

interface MovVacacion {
  id: string;
  createdAt: string;
  tipo: string;
  dias: number | string;
  saldoPosterior: number | string;
  referencia?: string | null;
}

interface AusenciaFicha {
  id: string;
  tipo: string;
  justificada: boolean;
  desde: string;
  hasta: string;
  dias: number | string;
  documentoUrl?: string | null;
  estado: string;
  aprobadaPor?: string | null;
}

interface ActaDisciplinaria {
  id: string;
  tipo: string;
  fechaHecho: string;
  acuseEmpleado: boolean;
  fechaAcuse?: string | null;
  falta: string;
  descripcion: string;
  emitidaPor: string;
  evidenciaUrl?: string | null;
}

interface FichaColaborador {
  nombre: string;
  activo: boolean;
  cedula: string;
  cargo: string;
  tipoContrato: string;
  salarioBase: number | string;
  ausencias?: AusenciaFicha[];
  actas?: ActaDisciplinaria[];
  movVacaciones?: MovVacacion[];
}

export default function FichaColaboradorPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [ficha, setFicha] = useState<FichaColaborador | null>(null);
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
  const cargarFicha = useCallback(async () => {
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
  }, [id, router]);

  useEffect(() => {
    if (id) cargarFicha();
  }, [id, cargarFicha]);

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
      <div className="min-h-screen bg-secondary/50 flex items-center justify-center">
        <div className="text-center text-muted-foreground animate-pulse text-sm">Cargando expediente del colaborador...</div>
      </div>
    );
  }

  if (!ficha) return null;

  return (
    <div className="min-h-screen bg-secondary/50">
      <Topbar title={`Expediente: ${ficha.nombre}`} />
      <ContentContainer>
        <div className="space-y-6">
          {/* Header con botón regresar y estado */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-5">
            <div className="flex items-center gap-3 min-w-0">
              <Link href="/rrhh/empleados">
                <Button variant="outline" size="icon" className="shrink-0">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-xl sm:text-2xl font-bold text-foreground truncate">{ficha.nombre}</h1>
                  <Badge className={ficha.activo ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-red-50 text-red-600 border border-red-200'}>
                    {ficha.activo ? 'Activo' : 'Baja (Soft-Delete)'}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-1 font-mono break-words">
                  Cédula: <strong className="text-foreground">{ficha.cedula}</strong> &nbsp;|&nbsp;
                  Cargo: <strong className="text-brand-1">{ficha.cargo}</strong> &nbsp;|&nbsp;
                  Contrato: <strong className="text-foreground">{ficha.tipoContrato}</strong>
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <a href={`/api/rrhh/expediente/${id}/pdf`} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" className="border-brand-1/30 text-brand-1 hover:bg-brand-1/5 text-xs font-bold">
                  <Download className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Descargar Expediente PDF (MITRADEL)</span>
                  <span className="sm:hidden">Expediente PDF</span>
                </Button>
              </a>
              {ficha.activo && (
                <Button onClick={handleDarDeBaja} variant="destructive" className="text-xs font-bold">
                  <Ban className="h-4 w-4 mr-2" />
                  Dar de Baja
                </Button>
              )}
            </div>
          </div>

          {/* KPI Cards (Salario, Saldo Vacaciones, Ausencias, Actas) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border-border shadow-sm">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Salario Base Mensual</p>
                  <p className="text-xl font-bold text-foreground font-mono mt-1">${Number(ficha.salarioBase).toFixed(2)}</p>
                </div>
                <div className="h-10 w-10 rounded-full bg-brand-1/10 flex items-center justify-center text-brand-1 shrink-0">
                  $
                </div>
              </CardContent>
            </Card>

            <Card className="border-border shadow-sm">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Saldo de Vacaciones (Ledger)</p>
                  <p className="text-xl font-bold text-brand-1 font-mono mt-1">{saldoVacaciones.toFixed(2)} días</p>
                </div>
                <div className="h-10 w-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
                  <Calendar className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-border shadow-sm">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Ausencias Solicitadas</p>
                  <p className="text-xl font-bold text-foreground mt-1">{ficha.ausencias?.length || 0}</p>
                </div>
                <div className="h-10 w-10 rounded-full bg-amber-50 flex items-center justify-center text-amber-600 shrink-0">
                  <Clock className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-border shadow-sm">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Actas Disciplinarias</p>
                  <p className="text-xl font-bold text-red-600 mt-1">{ficha.actas?.length || 0}</p>
                </div>
                <div className="h-10 w-10 rounded-full bg-red-50 flex items-center justify-center text-red-600 shrink-0">
                  <AlertTriangle className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Navegación por Pestañas — con scroll horizontal en mobile: los 3 títulos son
              largos y no caben en una fila angosta sin desbordarse. */}
          <div className="overflow-x-auto -mx-1 px-1">
            <div className="flex border-b border-border gap-2 min-w-max sm:min-w-0">
              <button
                onClick={() => setActiveTab('vacaciones')}
                className={`pb-3 px-3 sm:px-4 text-xs font-bold border-b-2 transition-all whitespace-nowrap shrink-0 ${activeTab === 'vacaciones' ? 'border-brand-1 text-brand-1' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
              >
                1. Ledger de Vacaciones
              </button>
              <button
                onClick={() => setActiveTab('ausencias')}
                className={`pb-3 px-3 sm:px-4 text-xs font-bold border-b-2 transition-all whitespace-nowrap shrink-0 ${activeTab === 'ausencias' ? 'border-brand-1 text-brand-1' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
              >
                2. Ausencias CSS ({ficha.ausencias?.length || 0})
              </button>
              <button
                onClick={() => setActiveTab('expediente')}
                className={`pb-3 px-3 sm:px-4 text-xs font-bold border-b-2 transition-all whitespace-nowrap shrink-0 ${activeTab === 'expediente' ? 'border-brand-1 text-brand-1' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
              >
                3. Expediente Disciplinario ({ficha.actas?.length || 0})
              </button>
            </div>
          </div>

          {/* TAB 1: LEDGER DE VACACIONES */}
          {activeTab === 'vacaciones' && (
            <Card className="border-border shadow-sm">
              <CardHeader className="border-b border-border pb-3">
                <CardTitle className="text-sm sm:text-base font-bold text-foreground flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                  <span>Libro Mayor (Ledger) de Movimientos de Vacaciones</span>
                  <span className="text-xs text-muted-foreground font-normal">Cálculo acumulativo inmutable</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-muted text-muted-foreground uppercase font-bold border-b border-border">
                      <tr>
                        <th className="py-3 px-4">Fecha</th>
                        <th className="py-3 px-4">Tipo</th>
                        <th className="py-3 px-4">Días (Impacto)</th>
                        <th className="py-3 px-4">Saldo Posterior</th>
                        <th className="py-3 px-4">Referencia / Detalle</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {ficha.movVacaciones?.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-8 text-center text-muted-foreground">
                            No hay movimientos en el ledger. Presiona &quot;Devengo Vacaciones&quot; en el directorio para generar el primer abono de ley.
                          </td>
                        </tr>
                      ) : (
                        ficha.movVacaciones?.map((mov) => (
                          <tr key={mov.id} className="hover:bg-muted/50">
                            <td className="py-3 px-4 font-mono text-foreground">
                              {new Date(mov.createdAt).toLocaleDateString('es-PA')}
                            </td>
                            <td className="py-3 px-4">
                              <Badge className={
                                mov.tipo === 'DEVENGO' ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' :
                                mov.tipo === 'TOMA' ? 'bg-amber-50 text-amber-600 border border-amber-200' :
                                'bg-blue-50 text-blue-600 border border-blue-200'
                              }>
                                {mov.tipo}
                              </Badge>
                            </td>
                            <td className={`py-3 px-4 font-mono font-bold ${Number(mov.dias) >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                              {Number(mov.dias) >= 0 ? `+${Number(mov.dias).toFixed(2)}` : Number(mov.dias).toFixed(2)} días
                            </td>
                            <td className="py-3 px-4 font-mono font-bold text-foreground">
                              {Number(mov.saldoPosterior).toFixed(2)} días
                            </td>
                            <td className="py-3 px-4 text-muted-foreground max-w-md">
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
            <Card className="border-border shadow-sm">
              <CardHeader className="border-b border-border pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <CardTitle className="text-sm sm:text-base font-bold text-foreground">Historial de Solicitudes de Ausencia</CardTitle>
                <Link href="/rrhh/ausencias">
                  <Button size="sm" className="bg-brand-1 hover:bg-brand-2 text-white font-bold text-xs">
                    <PlusCircle className="h-3.5 w-3.5 mr-1.5" />
                    Nueva Solicitud de Ausencia
                  </Button>
                </Link>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-muted text-muted-foreground uppercase font-bold border-b border-border">
                      <tr>
                        <th className="py-3 px-4">Tipo Ausencia</th>
                        <th className="py-3 px-4">Periodo</th>
                        <th className="py-3 px-4">Días</th>
                        <th className="py-3 px-4">Documento / Respaldo</th>
                        <th className="py-3 px-4">Estado</th>
                        <th className="py-3 px-4">Resuelta Por</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {ficha.ausencias?.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-muted-foreground">
                            No se han registrado ausencias para este colaborador.
                          </td>
                        </tr>
                      ) : (
                        ficha.ausencias?.map((aus) => (
                          <tr key={aus.id} className="hover:bg-muted/50">
                            <td className="py-3 px-4 font-bold text-foreground">
                              {aus.tipo}
                              {!aus.justificada && <span className="text-red-600 block text-[10px]">INJUSTIFICADA</span>}
                            </td>
                            <td className="py-3 px-4 text-foreground">
                              {new Date(aus.desde).toLocaleDateString('es-PA')} al {new Date(aus.hasta).toLocaleDateString('es-PA')}
                            </td>
                            <td className="py-3 px-4 font-mono font-semibold text-brand-1">{aus.dias} d</td>
                            <td className="py-3 px-4">
                              {aus.documentoUrl ? (
                                <a href={aus.documentoUrl} target="_blank" className="text-brand-1 underline flex items-center gap-1">
                                  <FileText className="h-3.5 w-3.5" /> Ver Certificado CSS
                                </a>
                              ) : (
                                <span className="text-muted-foreground/60">N/A</span>
                              )}
                            </td>
                            <td className="py-3 px-4">
                              <Badge className={
                                aus.estado === 'APROBADA' ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' :
                                aus.estado === 'RECHAZADA' ? 'bg-red-50 text-red-600 border border-red-200' :
                                'bg-amber-50 text-amber-600 border border-amber-200'
                              }>
                                {aus.estado}
                              </Badge>
                            </td>
                            <td className="py-3 px-4 text-muted-foreground">{aus.aprobadaPor || 'Pendiente'}</td>
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
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 bg-white p-4 rounded-lg border border-border shadow-sm">
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-foreground flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5 text-brand-1 shrink-0" />
                    Trazabilidad Disciplinaria y Acuse Electrónico
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Todas las actas emitidas quedan bajo firma o constancia de entrega según el Art. 213 del Código de Trabajo.
                  </p>
                </div>
                <Button onClick={() => setShowActaModal(true)} variant="destructive" className="font-bold text-xs shadow-sm shrink-0">
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Emitir Nueva Acta / Sanción
                </Button>
              </div>

              {ficha.actas?.length === 0 ? (
                <Card className="border-border text-center py-12">
                  <CardContent>
                    <CheckCircle2 className="h-12 w-12 text-emerald-500 mx-auto mb-3" />
                    <h3 className="text-base font-bold text-foreground mb-1">Expediente Disciplinario Limpio</h3>
                    <p className="text-xs text-muted-foreground">Este colaborador no presenta llamados de atención, memorandos ni suspensiones en el sistema.</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {ficha.actas?.map((acta) => (
                    <Card key={acta.id} className="border-border border-l-4 border-l-red-500 hover:border-l-red-600 transition-all shadow-sm">
                      <CardHeader className="pb-2">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge className="bg-red-50 text-red-600 border border-red-200 text-xs uppercase font-bold">
                              {acta.tipo.replace('_', ' ')}
                            </Badge>
                            <span className="text-xs text-muted-foreground font-mono">
                              Fecha Hecho: {new Date(acta.fechaHecho).toLocaleDateString('es-PA')}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            {acta.acuseEmpleado ? (
                              <Badge className="bg-emerald-50 text-emerald-600 border border-emerald-200 text-[11px] flex items-center gap-1">
                                <CheckCircle2 className="h-3 w-3" />
                                Acuse Firmado el {acta.fechaAcuse ? new Date(acta.fechaAcuse).toLocaleDateString('es-PA') : ''}
                              </Badge>
                            ) : (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleFirmarAcuse(acta.id)}
                                className="border-amber-300 text-amber-700 hover:bg-amber-50 text-xs h-7"
                              >
                                <PenTool className="h-3 w-3 mr-1" />
                                Registrar Acuse / Firma
                              </Button>
                            )}
                          </div>
                        </div>
                        <CardTitle className="text-base font-bold text-foreground mt-2">{acta.falta}</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3 pt-1 text-xs">
                        <div className="bg-muted/50 p-3 rounded border border-border text-foreground leading-relaxed whitespace-pre-line">
                          {acta.descripcion}
                        </div>
                        <div className="flex flex-wrap items-center justify-between gap-2 text-muted-foreground pt-1 border-t border-border">
                          <span>Emitido por: <strong className="text-foreground">{acta.emitidaPor}</strong></span>
                          {acta.evidenciaUrl && (
                            <a href={acta.evidenciaUrl} target="_blank" className="text-brand-1 hover:underline flex items-center gap-1">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <Card className="w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader className="border-b border-border pb-4">
              <CardTitle className="text-lg font-bold text-red-600 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Emitir Acta Disciplinaria (Sanción/Llamado)
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                La acción se registrará en la auditoría inmutable e integrará el expediente para probatoria legal.
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleCrearActa}>
              <CardContent className="space-y-4 pt-4 text-xs">
                <div>
                  <label className="font-semibold text-muted-foreground block mb-1">Tipo de Sanción / Medida:</label>
                  <select
                    value={actaTipo}
                    onChange={(e) => setActaTipo(e.target.value)}
                    className="w-full bg-muted/50 border border-border rounded-md text-sm text-foreground px-3 py-2 h-10 focus:outline-none focus:ring-1 focus:ring-red-400 focus:border-red-400"
                  >
                    <option value="AMONESTACION_VERBAL">AMONESTACIÓN VERBAL (REGISTRO)</option>
                    <option value="AMONESTACION_ESCRITA">AMONESTACIÓN ESCRITA</option>
                    <option value="MEMORANDO">MEMORANDO DE ADVERTENCIA</option>
                    <option value="SUSPENSION">SUSPENSIÓN DE LABORES SIN GOCE DE SUELDO</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-muted-foreground block mb-1">Categoría / Motivo de Falta:</label>
                  <Input
                    required
                    placeholder="Ej. Ausentismo Injustificado, Incumplimiento de Horario, Falta de Respeto"
                    value={actaFalta}
                    onChange={(e) => setActaFalta(e.target.value)}
                    className="bg-muted/50 border-border"
                  />
                </div>
                <div>
                  <label className="font-semibold text-muted-foreground block mb-1">Descripción Detallada de los Hechos:</label>
                  <textarea
                    required
                    rows={4}
                    placeholder="Describa con exactitud fecha, hora, testigos e infracción cometida..."
                    value={actaDesc}
                    onChange={(e) => setActaDesc(e.target.value)}
                    className="w-full bg-muted/50 border border-border rounded-md text-sm text-foreground px-3 py-2 focus:outline-none focus:ring-1 focus:ring-red-400 focus:border-red-400"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold text-muted-foreground block mb-1">Fecha del Hecho:</label>
                    <Input
                      required
                      type="date"
                      value={actaFecha}
                      onChange={(e) => setActaFecha(e.target.value)}
                      className="bg-muted/50 border-border"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-muted-foreground block mb-1">URL Evidencia (Opcional):</label>
                    <Input
                      placeholder="https://... foto, correo, pdf"
                      value={actaEvidencia}
                      onChange={(e) => setActaEvidencia(e.target.value)}
                      className="bg-muted/50 border-border"
                    />
                  </div>
                </div>
              </CardContent>
              <div className="p-4 border-t border-border flex flex-col-reverse sm:flex-row justify-end gap-3 bg-muted/30">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowActaModal(false)}
                  className="text-xs"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={guardandoActa}
                  variant="destructive"
                  className="font-bold text-xs px-5 shadow-sm"
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
