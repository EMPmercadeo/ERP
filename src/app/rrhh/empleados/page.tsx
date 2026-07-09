'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Topbar } from '@/components/layout/Topbar';
import { ContentContainer } from '@/components/layout/Content';
import {
  Users,
  UserPlus,
  Search,
  Filter,
  Calendar,
  DollarSign,
  AlertTriangle,
  FileText,
  CheckCircle,
  XCircle,
  Eye,
  RefreshCw,
  Building2
} from 'lucide-react';
import Link from 'next/link';

export default function EmpleadosRRHHPage() {
  const [empleados, setEmpleados] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [buscar, setBuscar] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('activo');
  const [empresaId, setEmpresaId] = useState('');
  
  // Estado para Modal de Nuevo Colaborador
  const [showModal, setShowModal] = useState(false);
  const [nombre, setNombre] = useState('');
  const [cedula, setCedula] = useState('');
  const [cargo, setCargo] = useState('');
  const [salarioBase, setSalarioBase] = useState('850');
  const [tipoContrato, setTipoContrato] = useState('INDEFINIDO');
  const [fechaIngreso, setFechaIngreso] = useState(new Date().toISOString().split('T')[0]);
  const [errorModal, setErrorModal] = useState('');
  const [guardando, setGuardando] = useState(false);

  // Cargar lista y detectar empresa del contexto
  const cargarEmpleados = async () => {
    setLoading(true);
    try {
      // Obtenemos del contexto o localStorage (fallback a primera empresa si es multitenant en dev)
      const currentEmpresa = localStorage.getItem('active_tenant_id') || 'empresa-demo-id';
      setEmpresaId(currentEmpresa);

      const params = new URLSearchParams();
      if (buscar) params.append('buscar', buscar);
      if (filtroEstado !== 'all') params.append('estado', filtroEstado);
      params.append('empresaId', currentEmpresa);

      const res = await fetch(`/api/rrhh/empleados?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setEmpleados(data.items || []);
      }
    } catch (err) {
      console.error('Error al cargar empleados:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarEmpleados();
  }, [filtroEstado]);

  const handleCrearEmpleado = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorModal('');
    setGuardando(true);
    try {
      const res = await fetch('/api/rrhh/empleados', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          empresaId: empresaId || 'empresa-demo-id',
          nombre,
          cedula,
          cargo,
          salarioBase: Number(salarioBase),
          tipoContrato,
          fechaIngreso
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
        cargarEmpleados();
      }
    } catch (err: any) {
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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ empresaId: empresaId || 'empresa-demo-id' })
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.message);
        cargarEmpleados();
      } else {
        alert('Error: ' + data.error);
      }
    } catch {
      alert('Error al ejecutar devengo');
    }
  };

  return (
    <div className="min-h-screen bg-[#0b111e] text-slate-100">
      <Topbar title="Directorio de Colaboradores & Planilla (Capa 1 & 2)" />
      <ContentContainer>
        <div className="space-y-6">
          {/* Header & Acciones Rápidas */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                <Users className="h-7 w-7 text-[#00f0ff]" />
                Personal y Expediente Laboral
              </h1>
              <p className="text-sm text-slate-400 mt-1">
                Gestión integral de colaboradores, ledger de vacaciones y actas disciplinarias según MITRADEL.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={aplicarDevengoMasivo}
                className="border-[#00f0ff]/30 text-[#00f0ff] hover:bg-[#00f0ff]/10 text-xs font-semibold"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Devengo Vacaciones (+2.73d/mes)
              </Button>
              <Button
                onClick={() => setShowModal(true)}
                className="bg-[#00f0ff] hover:bg-[#00f0ff]/90 text-[#0b111e] font-bold shadow-lg shadow-[#00f0ff]/20"
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Nuevo Colaborador
              </Button>
            </div>
          </div>

          {/* Filtros y Buscador */}
          <Card className="bg-[#121b2d] border-slate-800 shadow-md">
            <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
              <div className="flex items-center gap-2 flex-1 max-w-md">
                <Search className="h-4 w-4 text-slate-400 ml-2" />
                <Input
                  placeholder="Buscar por cédula o nombre..."
                  value={buscar}
                  onChange={(e) => setBuscar(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && cargarEmpleados()}
                  className="bg-[#0b111e] border-slate-700 text-white placeholder:text-slate-500 text-sm focus:border-[#00f0ff]"
                />
                <Button variant="secondary" size="sm" onClick={cargarEmpleados} className="bg-slate-800 hover:bg-slate-700 text-slate-200">
                  Buscar
                </Button>
              </div>

              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-slate-400" />
                <span className="text-xs text-slate-400 font-medium">Estado:</span>
                <div className="flex bg-[#0b111e] p-1 rounded-md border border-slate-800">
                  <button
                    onClick={() => setFiltroEstado('activo')}
                    className={`px-3 py-1 text-xs rounded transition-all ${filtroEstado === 'activo' ? 'bg-[#00f0ff] text-[#0b111e] font-bold' : 'text-slate-400 hover:text-white'}`}
                  >
                    Activos
                  </button>
                  <button
                    onClick={() => setFiltroEstado('inactivo')}
                    className={`px-3 py-1 text-xs rounded transition-all ${filtroEstado === 'inactivo' ? 'bg-[#00f0ff] text-[#0b111e] font-bold' : 'text-slate-400 hover:text-white'}`}
                  >
                    Bajas (Soft-Delete)
                  </button>
                  <button
                    onClick={() => setFiltroEstado('all')}
                    className={`px-3 py-1 text-xs rounded transition-all ${filtroEstado === 'all' ? 'bg-[#00f0ff] text-[#0b111e] font-bold' : 'text-slate-400 hover:text-white'}`}
                  >
                    Todos
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Grid de Colaboradores */}
          {loading ? (
            <div className="text-center py-16 text-slate-400 animate-pulse">Cargando directorio de personal...</div>
          ) : empleados.length === 0 ? (
            <Card className="bg-[#121b2d] border-slate-800 text-center py-12">
              <CardContent>
                <Users className="h-12 w-12 text-slate-600 mx-auto mb-3" />
                <h3 className="text-lg font-bold text-white mb-1">No se encontraron colaboradores</h3>
                <p className="text-sm text-slate-400 max-w-md mx-auto">
                  Utiliza el botón &quot;Nuevo Colaborador&quot; para registrar personal en esta empresa o verifica los filtros de búsqueda.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {empleados.map((emp) => (
                <Card key={emp.id} className="bg-[#121b2d] border-slate-800 hover:border-[#00f0ff]/50 transition-all flex flex-col justify-between group">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <CardTitle className="text-base font-bold text-white group-hover:text-[#00f0ff] transition-colors">
                          {emp.nombre}
                        </CardTitle>
                        <CardDescription className="text-xs text-slate-400 mt-0.5">
                          Cédula: <span className="text-slate-200 font-mono font-medium">{emp.cedula}</span>
                        </CardDescription>
                      </div>
                      <Badge className={emp.activo ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-red-500/10 text-red-400 border border-red-500/30'}>
                        {emp.activo ? 'Activo' : 'Baja'}
                      </Badge>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-3 pb-4">
                    <div className="grid grid-cols-2 gap-2 bg-[#0b111e] p-2.5 rounded border border-slate-800/80 text-xs">
                      <div>
                        <span className="text-slate-500 block">Cargo:</span>
                        <span className="text-slate-200 font-semibold">{emp.cargo}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Salario Base:</span>
                        <span className="text-[#00f0ff] font-mono font-bold">${Number(emp.salarioBase).toFixed(2)}</span>
                      </div>
                      <div className="col-span-2 pt-1 border-t border-slate-800 mt-1 flex justify-between items-center text-[11px]">
                        <span className="text-slate-400">Tipo: <strong className="text-slate-300">{emp.tipoContrato}</strong></span>
                        <span className="text-slate-400">Ingreso: {new Date(emp.fechaIngreso).toLocaleDateString('es-PA')}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-400 px-1">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5 text-amber-400" />
                        Ausencias: <strong className="text-white">{emp._count?.ausencias || 0}</strong>
                      </span>
                      <span className="flex items-center gap-1">
                        <AlertTriangle className="h-3.5 w-3.5 text-red-400" />
                        Actas: <strong className="text-white">{emp._count?.actas || 0}</strong>
                      </span>
                    </div>
                  </CardContent>

                  <div className="p-4 pt-0">
                    <Link href={`/rrhh/empleados/${emp.id}`} className="w-full">
                      <Button variant="secondary" className="w-full bg-slate-800 hover:bg-[#00f0ff] hover:text-[#0b111e] text-slate-200 text-xs font-bold transition-all">
                        <Eye className="h-4 w-4 mr-2" />
                        Ver Expediente y Ledger
                      </Button>
                    </Link>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </ContentContainer>

      {/* Modal de Alta de Empleado */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <Card className="bg-[#121b2d] border-slate-700 w-full max-w-lg shadow-2xl">
            <CardHeader className="border-b border-slate-800 pb-4">
              <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-[#00f0ff]" />
                Registrar Nuevo Colaborador
              </CardTitle>
              <CardDescription className="text-xs text-slate-400">
                El colaborador quedará activo y comenzará a devengar saldo de vacaciones automáticamente.
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleCrearEmpleado}>
              <CardContent className="space-y-4 pt-4">
                {errorModal && (
                  <div className="p-3 rounded bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
                    {errorModal}
                  </div>
                )}
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Nombre Completo:</label>
                  <Input
                    required
                    placeholder="Ej. Juan Carlos Pérez"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    className="bg-[#0b111e] border-slate-700 text-white"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">Cédula / Pasaporte:</label>
                    <Input
                      required
                      placeholder="8-123-4567"
                      value={cedula}
                      onChange={(e) => setCedula(e.target.value)}
                      className="bg-[#0b111e] border-slate-700 text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">Salario Base Mensual ($):</label>
                    <Input
                      required
                      type="number"
                      step="0.01"
                      value={salarioBase}
                      onChange={(e) => setSalarioBase(e.target.value)}
                      className="bg-[#0b111e] border-slate-700 text-[#00f0ff] font-mono font-bold"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">Cargo / Puesto:</label>
                    <Input
                      required
                      placeholder="Ej. Contador, Vendedor"
                      value={cargo}
                      onChange={(e) => setCargo(e.target.value)}
                      className="bg-[#0b111e] border-slate-700 text-white"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">Tipo de Contrato:</label>
                    <select
                      value={tipoContrato}
                      onChange={(e) => setTipoContrato(e.target.value)}
                      className="w-full bg-[#0b111e] border border-slate-700 rounded text-sm text-white px-3 py-2 focus:outline-none focus:border-[#00f0ff]"
                    >
                      <option value="INDEFINIDO">INDEFINIDO</option>
                      <option value="DEFINIDO">DEFINIDO</option>
                      <option value="OBRA">OBRA O TIEMPO DETERMINADO</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Fecha de Ingreso:</label>
                  <Input
                    required
                    type="date"
                    value={fechaIngreso}
                    onChange={(e) => setFechaIngreso(e.target.value)}
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
                  className="bg-[#00f0ff] hover:bg-[#00f0ff]/90 text-[#0b111e] font-bold text-xs px-5"
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
