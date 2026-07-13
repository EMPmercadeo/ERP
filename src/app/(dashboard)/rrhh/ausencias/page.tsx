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
  CheckCircle,
  XCircle,
  FileText,
  Clock,
  PlusCircle,
  Filter,
  RefreshCw,
  AlertTriangle
} from 'lucide-react';

interface AusenciaItem {
  id: string;
  tipo: string;
  desde: string;
  hasta: string;
  dias: number | string;
  nota?: string | null;
  documentoUrl?: string | null;
  estado: string;
  empleado?: { nombre: string; cedula: string };
}

interface EmpleadoOpcion {
  id: string;
  nombre: string;
  cedula: string;
  cargo: string;
}

export default function AusenciasPage() {
  const [ausencias, setAusencias] = useState<AusenciaItem[]>([]);
  const [empleados, setEmpleados] = useState<EmpleadoOpcion[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroEstado, setFiltroEstado] = useState('PENDIENTE');

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

  const cargarDatos = useCallback(async () => {
    setLoading(true);
    try {
      const [resAus, resEmp] = await Promise.all([
        fetch(`/api/rrhh/ausencias?estado=${filtroEstado}&take=50`),
        fetch(`/api/rrhh/empleados?estado=activo`)
      ]);

      if (resAus.ok) {
        const dataAus = await resAus.json();
        setAusencias(dataAus.items || []);
      }
      if (resEmp.ok) {
        const dataEmp = await resEmp.json();
        setEmpleados(dataEmp.items || []);
        if (dataEmp.items?.length > 0) {
          setEmpleadoId((prev) => prev || dataEmp.items[0].id);
        }
      }
    } catch (err) {
      console.error('Error al cargar ausencias:', err);
    } finally {
      setLoading(false);
    }
  }, [filtroEstado]);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

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
    <div className="min-h-screen bg-secondary/50">
      <Topbar title="Control de Ausencias, Permisos e Incapacidades CSS" />
      <ContentContainer>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-5">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                <Calendar className="h-6 w-6 sm:h-7 sm:w-7 text-brand-1" />
                Ausencias y Permisos
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Validación de incapacidades CSS, control de traslapes y débito automático al aprobar vacaciones.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <Button onClick={cargarDatos} variant="outline" size="icon" className="shrink-0" aria-label="Actualizar lista de ausencias">
                <RefreshCw className="h-4 w-4" />
              </Button>
              <Button
                onClick={() => setShowModal(true)}
                className="bg-brand-1 hover:bg-brand-2 text-white font-bold shadow-sm"
              >
                <PlusCircle className="h-4 w-4 mr-2" />
                Nueva Solicitud de Ausencia
              </Button>
            </div>
          </div>

          {/* Filtros */}
          <Card className="border-border shadow-sm">
            <CardContent className="p-4 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-2 flex-wrap">
                <Filter className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="text-xs text-muted-foreground font-medium shrink-0">Estado de Solicitud:</span>
                <div className="flex flex-wrap bg-muted p-1 rounded-md border border-border">
                  <button
                    onClick={() => setFiltroEstado('PENDIENTE')}
                    className={`px-3 py-1 text-xs rounded transition-all ${filtroEstado === 'PENDIENTE' ? 'bg-warning text-white font-bold' : 'text-muted-foreground hover:text-foreground'}`}
                  >
                    Pendientes
                  </button>
                  <button
                    onClick={() => setFiltroEstado('APROBADA')}
                    className={`px-3 py-1 text-xs rounded transition-all ${filtroEstado === 'APROBADA' ? 'bg-success text-white font-bold' : 'text-muted-foreground hover:text-foreground'}`}
                  >
                    Aprobadas
                  </button>
                  <button
                    onClick={() => setFiltroEstado('RECHAZADA')}
                    className={`px-3 py-1 text-xs rounded transition-all ${filtroEstado === 'RECHAZADA' ? 'bg-danger text-white font-bold' : 'text-muted-foreground hover:text-foreground'}`}
                  >
                    Rechazadas
                  </button>
                  <button
                    onClick={() => setFiltroEstado('all')}
                    className={`px-3 py-1 text-xs rounded transition-all ${filtroEstado === 'all' ? 'bg-brand-1 text-white font-bold' : 'text-muted-foreground hover:text-foreground'}`}
                  >
                    Todas
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Grid/Lista */}
          {loading ? (
            <div className="text-center py-16 text-muted-foreground animate-pulse text-sm">Cargando solicitudes de ausencias...</div>
          ) : ausencias.length === 0 ? (
            <Card className="border-border text-center py-12">
              <CardContent>
                <Clock className="h-12 w-12 text-muted-foreground/40 mx-auto mb-3" />
                <h3 className="text-base font-bold text-foreground mb-1">Sin solicitudes en este estado</h3>
                <p className="text-xs text-muted-foreground">No hay ausencias {filtroEstado.toLowerCase()}s en este momento.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {ausencias.map((aus) => (
                <Card key={aus.id} className="border-border hover:border-brand-1/30 transition-all shadow-sm">
                  <CardContent className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge className={
                          aus.tipo === 'VACACIONES' ? 'bg-brand-1/10 text-brand-1 border border-brand-1/30' :
                          aus.tipo === 'ENFERMEDAD' || aus.tipo === 'MATERNIDAD' ? 'bg-info-bg text-info border border-info/20' :
                          'bg-muted text-muted-foreground border border-border'
                        }>
                          {aus.tipo}
                        </Badge>
                        <span className="text-sm font-bold text-foreground">{aus.empleado?.nombre}</span>
                        <span className="text-xs text-muted-foreground font-mono">({aus.empleado?.cedula})</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Periodo: <strong className="text-foreground">{new Date(aus.desde).toLocaleDateString('es-PA')} al {new Date(aus.hasta).toLocaleDateString('es-PA')}</strong> &nbsp;|&nbsp;
                        Duración: <strong className="text-brand-1 font-mono">{aus.dias} días</strong>
                      </p>
                      {aus.nota && <p className="text-xs text-muted-foreground italic">Nota: &quot;{aus.nota}&quot;</p>}
                    </div>

                    <div className="flex flex-wrap items-center gap-2 md:gap-4 md:justify-end">
                      {aus.documentoUrl ? (
                        <a href={aus.documentoUrl} target="_blank" className="text-xs text-brand-1 hover:underline flex items-center gap-1 bg-muted/50 px-2.5 py-1.5 rounded border border-border">
                          <FileText className="h-3.5 w-3.5" /> Adjunto CSS
                        </a>
                      ) : (
                        <span className="text-xs text-muted-foreground/60 italic">Sin adjunto</span>
                      )}

                      <Badge className={
                        aus.estado === 'APROBADA' ? 'bg-success-bg text-success border border-success/20 text-xs font-bold' :
                        aus.estado === 'RECHAZADA' ? 'bg-danger-bg text-danger border border-danger/20 text-xs font-bold' :
                        'bg-warning-bg text-warning border border-warning/20 text-xs font-bold animate-pulse'
                      }>
                        {aus.estado}
                      </Badge>

                      {aus.estado === 'PENDIENTE' && (
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleResolver(aus.id, 'APROBADA')}
                            className="bg-success hover:bg-success/90 text-white font-bold text-xs h-8 px-3"
                          >
                            <CheckCircle className="h-3.5 w-3.5 mr-1" /> Aprobar
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleResolver(aus.id, 'RECHAZADA')}
                            variant="destructive"
                            className="font-bold text-xs h-8 px-3"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <Card className="w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader className="border-b border-border pb-4">
              <CardTitle className="text-lg font-bold text-foreground flex items-center gap-2">
                <Clock className="h-5 w-5 text-brand-1" />
                Registrar Solicitud de Ausencia
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Si es incapacidad de la Caja de Seguro Social (CSS), el certificado es obligatorio.
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleCrearAusencia}>
              <CardContent className="space-y-4 pt-4 text-xs">
                {errorModal && (
                  <div className="p-3 rounded bg-danger-bg border border-danger/20 text-danger flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                    <span>{errorModal}</span>
                  </div>
                )}
                <div>
                  <label className="font-semibold text-muted-foreground block mb-1">Colaborador:</label>
                  <select
                    required
                    value={empleadoId}
                    onChange={(e) => setEmpleadoId(e.target.value)}
                    className="w-full bg-muted/50 border border-border rounded-md text-sm text-foreground px-3 py-2 h-10 focus:outline-none focus:ring-1 focus:ring-brand-1 focus:border-brand-1"
                  >
                    {empleados.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.nombre} ({emp.cedula}) - {emp.cargo}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-muted-foreground block mb-1">Tipo de Ausencia / Permiso:</label>
                  <select
                    value={tipo}
                    onChange={(e) => setTipo(e.target.value)}
                    className="w-full bg-muted/50 border border-border rounded-md text-sm text-foreground px-3 py-2 h-10 focus:outline-none focus:ring-1 focus:ring-brand-1 focus:border-brand-1"
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
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold text-muted-foreground block mb-1">Desde (Inicio):</label>
                    <Input
                      required
                      type="date"
                      value={desde}
                      onChange={(e) => setDesde(e.target.value)}
                      className="bg-muted/50 border-border"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-muted-foreground block mb-1">Hasta (Fin):</label>
                    <Input
                      required
                      type="date"
                      value={hasta}
                      onChange={(e) => setHasta(e.target.value)}
                      className="bg-muted/50 border-border"
                    />
                  </div>
                </div>
                {(tipo === 'ENFERMEDAD' || tipo === 'MATERNIDAD') && (
                  <div>
                    <label className="font-semibold text-info block mb-1">URL / Enlace Certificado Médico o CSS (*Obligatorio):</label>
                    <Input
                      required
                      placeholder="https://... certificado_css.pdf"
                      value={docUrl}
                      onChange={(e) => setDocUrl(e.target.value)}
                      className="bg-muted/50 border-info/40"
                    />
                  </div>
                )}
                <div>
                  <label className="font-semibold text-muted-foreground block mb-1">Nota o Detalle Adicional:</label>
                  <Input
                    placeholder="Motivo, indicaciones del médico, etc."
                    value={nota}
                    onChange={(e) => setNota(e.target.value)}
                    className="bg-muted/50 border-border"
                  />
                </div>
              </CardContent>
              <div className="p-4 border-t border-border flex flex-col-reverse sm:flex-row justify-end gap-3 bg-muted/30">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowModal(false)}
                  className="text-xs"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={guardando}
                  className="bg-brand-1 hover:bg-brand-2 text-white font-bold text-xs px-5"
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
