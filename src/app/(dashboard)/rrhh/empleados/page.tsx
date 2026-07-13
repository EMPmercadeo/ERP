'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell
} from '@/components/ui/table';
import { Topbar } from '@/components/layout/Topbar';
import { ContentContainer } from '@/components/layout/Content';
import {
  Users,
  UserPlus,
  Search,
  Filter,
  Calendar,
  AlertTriangle,
  Eye,
  RefreshCw,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import Link from 'next/link';

interface Empleado {
  id: string;
  nombre: string;
  cedula: string;
  activo: boolean;
  cargo: string;
  departamento?: string;
  salarioBase: number | string;
  tipoContrato: string;
  fechaIngreso: string;
  _count?: { ausencias?: number; actas?: number };
}

const PAGE_SIZE = 10;

export default function EmpleadosRRHHPage() {
  const [empleados, setEmpleados] = useState<Empleado[]>([]);
  const [loading, setLoading] = useState(true);
  const [buscar, setBuscar] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('activo');

  // Paginación cursor-based (misma técnica que ya usa /api/rrhh/empleados vía paginar()).
  // cursorsRef[i] guarda el cursor necesario para pedir la página i; la página 0 siempre
  // usa cursor null. Se guarda en un ref (no en estado) para no disparar refetch por sí solo.
  const [pageIndex, setPageIndex] = useState(0);
  const [hasNextPage, setHasNextPage] = useState(false);
  const cursorsRef = useRef<(string | null)[]>([null]);

  // Estado para Modal de Nuevo Colaborador
  const [showModal, setShowModal] = useState(false);
  const [nombre, setNombre] = useState('');
  const [cedula, setCedula] = useState('');
  const [cargo, setCargo] = useState('');
  const [salarioBase, setSalarioBase] = useState('850');
  const [tipoContrato, setTipoContrato] = useState('INDEFINIDO');
  const [fechaIngreso, setFechaIngreso] = useState(new Date().toISOString().split('T')[0]);
  // Estos 3 alimentan la calculadora de Planilla (módulo Payroll) — antes esa calculadora
  // usaba colaboradores inventados porque no existía forma de capturar estos datos.
  const [departamento, setDepartamento] = useState('General');
  const [frecuenciaPago, setFrecuenciaPago] = useState('mensual');
  const [tasaRiesgo, setTasaRiesgo] = useState('0.0105');
  const [errorModal, setErrorModal] = useState('');
  const [guardando, setGuardando] = useState(false);

  // Mantiene el valor más reciente de "buscar" disponible sin forzar que el efecto de abajo
  // se dispare en cada tecleo (la búsqueda solo debe re-consultar al cambiar filtroEstado o
  // al pulsar el botón/Enter, nunca en vivo mientras se escribe).
  const buscarRef = useRef(buscar);
  useEffect(() => {
    buscarRef.current = buscar;
  }, [buscar]);

  // Cargar una página específica de colaboradores — el servidor deriva la empresa de la
  // sesión, nunca del cliente. targetPageIndex referencia cursorsRef, que va creciendo a
  // medida que se navega hacia adelante.
  const cargarPagina = useCallback(async (targetPageIndex: number) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (buscarRef.current) params.append('buscar', buscarRef.current);
      if (filtroEstado !== 'all') params.append('estado', filtroEstado);
      params.append('take', String(PAGE_SIZE));
      const cursor = cursorsRef.current[targetPageIndex];
      if (cursor) params.append('cursor', cursor);

      const res = await fetch(`/api/rrhh/empleados?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setEmpleados(data.items || []);
        setHasNextPage(!!data.nextCursor);
        if (data.nextCursor && !cursorsRef.current[targetPageIndex + 1]) {
          const next = [...cursorsRef.current];
          next[targetPageIndex + 1] = data.nextCursor;
          cursorsRef.current = next;
        }
        setPageIndex(targetPageIndex);
      }
    } catch (err) {
      console.error('Error al cargar empleados:', err);
    } finally {
      setLoading(false);
    }
  }, [filtroEstado]);

  // Reinicia la paginación (nueva búsqueda o cambio de filtro de estado)
  const buscarDesdeInicio = useCallback(() => {
    cursorsRef.current = [null];
    cargarPagina(0);
  }, [cargarPagina]);

  useEffect(() => {
    buscarDesdeInicio();
  }, [buscarDesdeInicio]);

  const handleCrearEmpleado = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorModal('');
    setGuardando(true);
    try {
      const res = await fetch('/api/rrhh/empleados', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre,
          cedula,
          cargo,
          salarioBase: Number(salarioBase),
          tipoContrato,
          fechaIngreso,
          departamento,
          frecuenciaPago,
          tasaRiesgo: Number(tasaRiesgo)
        })
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorModal(data.error || 'Error al guardar colaborador');
      } else {
        setShowModal(false);
        setNombre('');
        setCedula('');
        setCargo('');
        buscarDesdeInicio();
      }
    } catch {
      setErrorModal('Error de conexión con el servidor');
    } finally {
      setGuardando(false);
    }
  };

  const aplicarDevengoMasivo = async () => {
    if (!confirm('¿Desea aplicar el devengo mensual de vacaciones (+2.73 días según Ley Panamá) a todos los colaboradores activos?')) return;
    try {
      const res = await fetch('/api/rrhh/vacaciones/devengo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.message);
        cargarPagina(pageIndex);
      } else {
        alert('Error: ' + data.error);
      }
    } catch {
      alert('Error al ejecutar devengo');
    }
  };

  return (
    <div className="min-h-screen bg-secondary/50">
      <Topbar title="Directorio de Colaboradores & Planilla" />
      <ContentContainer>
        <div className="space-y-6">
          {/* Header & Acciones Rápidas */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-5">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                <Users className="h-6 w-6 sm:h-7 sm:w-7 text-brand-1" />
                Personal y Expediente Laboral
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Gestión integral de colaboradores, ledger de vacaciones y actas disciplinarias según MITRADEL.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <Button
                variant="outline"
                onClick={aplicarDevengoMasivo}
                className="border-brand-1/30 text-brand-1 hover:bg-brand-1/5 text-xs font-semibold"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Devengo Vacaciones (+2.73d/mes)
              </Button>
              <Button
                onClick={() => setShowModal(true)}
                className="bg-brand-1 hover:bg-brand-2 text-white font-bold shadow-sm"
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Nuevo Colaborador
              </Button>
            </div>
          </div>

          {/* Filtros y Buscador */}
          <Card className="shadow-sm border-border">
            <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
              <div className="flex items-center gap-2 flex-1 max-w-md">
                <Search className="h-4 w-4 text-muted-foreground ml-2 shrink-0" />
                <Input
                  placeholder="Buscar por cédula o nombre..."
                  value={buscar}
                  onChange={(e) => setBuscar(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && buscarDesdeInicio()}
                  className="bg-muted/50 border-border text-sm"
                />
                <Button variant="secondary" size="sm" onClick={buscarDesdeInicio} className="shrink-0">
                  Buscar
                </Button>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <Filter className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="text-xs text-muted-foreground font-medium shrink-0">Estado:</span>
                <div className="flex bg-muted p-1 rounded-md border border-border">
                  <button
                    onClick={() => setFiltroEstado('activo')}
                    className={`px-3 py-1 text-xs rounded transition-all ${filtroEstado === 'activo' ? 'bg-brand-1 text-white font-bold' : 'text-muted-foreground hover:text-foreground'}`}
                  >
                    Activos
                  </button>
                  <button
                    onClick={() => setFiltroEstado('inactivo')}
                    className={`px-3 py-1 text-xs rounded transition-all ${filtroEstado === 'inactivo' ? 'bg-brand-1 text-white font-bold' : 'text-muted-foreground hover:text-foreground'}`}
                  >
                    Bajas
                  </button>
                  <button
                    onClick={() => setFiltroEstado('all')}
                    className={`px-3 py-1 text-xs rounded transition-all ${filtroEstado === 'all' ? 'bg-brand-1 text-white font-bold' : 'text-muted-foreground hover:text-foreground'}`}
                  >
                    Todos
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Lista de Colaboradores */}
          {loading ? (
            <div className="text-center py-16 text-muted-foreground animate-pulse text-sm">Cargando directorio de personal...</div>
          ) : empleados.length === 0 ? (
            <Card className="border-border text-center py-12">
              <CardContent>
                <Users className="h-12 w-12 text-muted-foreground/40 mx-auto mb-3" />
                <h3 className="text-lg font-bold text-foreground mb-1">No se encontraron colaboradores</h3>
                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                  Utiliza el botón &quot;Nuevo Colaborador&quot; para registrar personal en esta empresa o verifica los filtros de búsqueda.
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-border shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Colaborador</TableHead>
                      <TableHead>Cargo</TableHead>
                      <TableHead>Departamento</TableHead>
                      <TableHead>Salario Base</TableHead>
                      <TableHead>Contrato</TableHead>
                      <TableHead>Ingreso</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="text-center">Ausencias</TableHead>
                      <TableHead className="text-center">Actas</TableHead>
                      <TableHead className="text-right">Acción</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {empleados.map((emp) => (
                      <TableRow key={emp.id} className="hover:bg-muted/50">
                        <TableCell>
                          <div className="font-semibold text-foreground">{emp.nombre}</div>
                          <div className="text-xs text-muted-foreground font-mono">{emp.cedula}</div>
                        </TableCell>
                        <TableCell className="text-sm">{emp.cargo}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{emp.departamento || '—'}</TableCell>
                        <TableCell className="font-mono font-semibold text-brand-1">${Number(emp.salarioBase).toFixed(2)}</TableCell>
                        <TableCell className="text-xs">{emp.tipoContrato}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{new Date(emp.fechaIngreso).toLocaleDateString('es-PA')}</TableCell>
                        <TableCell>
                          <Badge className={emp.activo ? 'bg-success-bg text-success border border-success/20' : 'bg-danger-bg text-danger border border-danger/20'}>
                            {emp.activo ? 'Activo' : 'Baja'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center text-xs">
                          <span className="inline-flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5 text-warning" />
                            {emp._count?.ausencias || 0}
                          </span>
                        </TableCell>
                        <TableCell className="text-center text-xs">
                          <span className="inline-flex items-center gap-1">
                            <AlertTriangle className="h-3.5 w-3.5 text-danger" />
                            {emp._count?.actas || 0}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <Link href={`/rrhh/empleados/${emp.id}`}>
                            <Button variant="outline" size="sm" className="text-muted-foreground hover:bg-brand-1/5 hover:text-brand-1 hover:border-brand-1/30 text-xs font-bold">
                              <Eye className="h-3.5 w-3.5 mr-1.5" />
                              Ver Expediente
                            </Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Paginación */}
              <div className="flex items-center justify-between border-t border-border p-3">
                <span className="text-xs text-muted-foreground">
                  Página {pageIndex + 1} · {empleados.length} colaborador{empleados.length === 1 ? '' : 'es'} en esta página
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={pageIndex === 0}
                    onClick={() => cargarPagina(pageIndex - 1)}
                    className="text-xs"
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Anterior
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!hasNextPage}
                    onClick={() => cargarPagina(pageIndex + 1)}
                    className="text-xs"
                  >
                    Siguiente
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            </Card>
          )}
        </div>
      </ContentContainer>

      {/* Modal de Alta de Empleado */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <Card className="w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader className="border-b border-border pb-4">
              <CardTitle className="text-lg font-bold text-foreground flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-brand-1" />
                Registrar Nuevo Colaborador
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                El colaborador quedará activo y comenzará a devengar saldo de vacaciones automáticamente.
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleCrearEmpleado}>
              <CardContent className="space-y-4 pt-4">
                {errorModal && (
                  <div className="p-3 rounded bg-danger-bg border border-danger/20 text-danger text-xs">
                    {errorModal}
                  </div>
                )}
                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1">Nombre Completo:</label>
                  <Input
                    required
                    placeholder="Ej. Juan Carlos Pérez"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    className="bg-muted/50 border-border"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground block mb-1">Cédula / Pasaporte:</label>
                    <Input
                      required
                      placeholder="8-123-4567"
                      value={cedula}
                      onChange={(e) => setCedula(e.target.value)}
                      className="bg-muted/50 border-border font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground block mb-1">Salario Base Mensual ($):</label>
                    <Input
                      required
                      type="number"
                      step="0.01"
                      value={salarioBase}
                      onChange={(e) => setSalarioBase(e.target.value)}
                      className="bg-muted/50 border-border text-brand-1 font-mono font-bold"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground block mb-1">Cargo / Puesto:</label>
                    <Input
                      required
                      placeholder="Ej. Contador, Vendedor"
                      value={cargo}
                      onChange={(e) => setCargo(e.target.value)}
                      className="bg-muted/50 border-border"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground block mb-1">Tipo de Contrato:</label>
                    <select
                      value={tipoContrato}
                      onChange={(e) => setTipoContrato(e.target.value)}
                      className="w-full bg-muted/50 border border-border rounded-md text-sm text-foreground px-3 py-2 h-10 focus:outline-none focus:ring-1 focus:ring-brand-1 focus:border-brand-1"
                    >
                      <option value="INDEFINIDO">INDEFINIDO</option>
                      <option value="DEFINIDO">DEFINIDO</option>
                      <option value="OBRA">OBRA O TIEMPO DETERMINADO</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1">Fecha de Ingreso:</label>
                  <Input
                    required
                    type="date"
                    value={fechaIngreso}
                    onChange={(e) => setFechaIngreso(e.target.value)}
                    className="bg-muted/50 border-border"
                  />
                </div>
                <div className="pt-2 border-t border-border">
                  <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                    Datos para Planilla (Ley 462 de 2025)
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground block mb-1">Departamento:</label>
                      <Input
                        placeholder="Ej. Ventas, Administración"
                        value={departamento}
                        onChange={(e) => setDepartamento(e.target.value)}
                        className="bg-muted/50 border-border"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground block mb-1">Frecuencia de Pago:</label>
                      <select
                        value={frecuenciaPago}
                        onChange={(e) => setFrecuenciaPago(e.target.value)}
                        className="w-full bg-muted/50 border border-border rounded-md text-sm text-foreground px-3 py-2 h-10 focus:outline-none focus:ring-1 focus:ring-brand-1 focus:border-brand-1"
                      >
                        <option value="mensual">Mensual (12 pagos/año)</option>
                        <option value="quincenal">Quincenal (24 pagos/año)</option>
                        <option value="bisemanal">Bisemanal (26 pagos/año)</option>
                      </select>
                    </div>
                  </div>
                  <div className="mt-3">
                    <label className="text-xs font-semibold text-muted-foreground block mb-1">Tasa de Riesgos Profesionales:</label>
                    <select
                      value={tasaRiesgo}
                      onChange={(e) => setTasaRiesgo(e.target.value)}
                      className="w-full bg-muted/50 border border-border rounded-md text-sm text-foreground px-3 py-2 h-10 focus:outline-none focus:ring-1 focus:ring-brand-1 focus:border-brand-1"
                    >
                      <option value="0.0105">1.05% - Oficina / Bajo Riesgo</option>
                      <option value="0.0210">2.10% - Almacén / Comercial</option>
                      <option value="0.0350">3.50% - Operaciones / Industrial</option>
                      <option value="0.0560">5.60% - Construcción / Alto Riesgo</option>
                    </select>
                  </div>
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
                  {guardando ? 'Guardando...' : 'Registrar Colaborador'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
