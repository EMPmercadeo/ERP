'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Topbar } from '@/components/layout/Topbar';
import { ContentContainer } from '@/components/layout/Content';
import {
  ShoppingBag,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Lock,
  ArrowLeft,
  Server,
  DownloadCloud,
  FileText
} from 'lucide-react';
import Link from 'next/link';

export default function WooCommerceSyncPage() {
  const [urlTienda, setUrlTienda] = useState('');
  const [consumerKey, setConsumerKey] = useState('');
  const [consumerSec, setConsumerSec] = useState('');
  const [activo, setActivo] = useState(true);
  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [ultimaSync, setUltimaSync] = useState<string | null>(null);

  // Pedidos importados
  const [pedidosWoo, setPedidosWoo] = useState<any[]>([]);
  const [sincronizandoStock, setSincronizandoStock] = useState(false);
  const [importandoPedidos, setImportandoPedidos] = useState(false);

  useEffect(() => {
    cargarConfig();
  }, []);

  const cargarConfig = async () => {
    setLoading(true);
    try {
      let cuentaId = localStorage.getItem('active_tenant_id') || 'empresa-demo-id';
      const res = await fetch(`/api/pos/woocommerce?cuentaId=${cuentaId}`);
      if (res.ok) {
        const data = await res.json();
        if (data.config) {
          setUrlTienda(data.config.urlTienda || '');
          setConsumerKey(data.config.consumerKeyMasked || '');
          setConsumerSec(data.config.consumerSecMasked || '');
          setActivo(data.config.activo);
          setUltimaSync(data.config.ultimaSync);
        }
      }
    } catch {
      console.error('Error al cargar configuración Woo');
    } finally {
      setLoading(false);
    }
  };

  const handleGuardarCredenciales = async (e: React.FormEvent) => {
    e.preventDefault();
    setMensaje('');
    setGuardando(true);
    try {
      let cuentaId = localStorage.getItem('active_tenant_id') || 'empresa-demo-id';
      const res = await fetch('/api/pos/woocommerce', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cuentaId,
          urlTienda,
          consumerKey,
          consumerSec,
          activo
        })
      });

      const data = await res.json();
      if (res.ok) {
        setMensaje('✔ ' + data.message);
        cargarConfig();
      } else {
        alert('Error: ' + data.error);
      }
    } catch {
      alert('Error de conexión');
    } finally {
      setGuardando(false);
    }
  };

  const syncCatálgoStock = async () => {
    setSincronizandoStock(true);
    try {
      let cuentaId = localStorage.getItem('active_tenant_id') || 'empresa-demo-id';
      const res = await fetch('/api/pos/woocommerce/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cuentaId, accion: 'SYNC_STOCK_CATALOGO' })
      });
      const data = await res.json();
      if (res.ok) {
        alert('✔ ' + data.message);
        if (data.ultimaSync) setUltimaSync(data.ultimaSync);
      } else {
        alert('Error al sincronizar: ' + data.error);
      }
    } catch {
      alert('Error al ejecutar sincronización');
    } finally {
      setSincronizandoStock(false);
    }
  };

  const importarPedidosPendientes = async () => {
    setImportandoPedidos(true);
    try {
      let cuentaId = localStorage.getItem('active_tenant_id') || 'empresa-demo-id';
      const res = await fetch('/api/pos/woocommerce/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cuentaId, accion: 'IMPORTAR_PEDIDOS_WOO' })
      });
      const data = await res.json();
      if (res.ok) {
        setPedidosWoo(data.pedidos || []);
      } else {
        alert('Error al importar pedidos: ' + data.error);
      }
    } catch {
      alert('Error en la solicitud');
    } finally {
      setImportandoPedidos(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0b111e] text-slate-100">
      <Topbar title="Integración y Sincronización con WooCommerce" />
      <ContentContainer>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
            <div className="flex items-center gap-3">
              <Link href="/pos">
                <Button variant="outline" size="icon" className="border-slate-700 bg-slate-900 text-slate-300 hover:text-white">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                  <ShoppingBag className="h-7 w-7 text-pink-500" />
                  Conexión con Tienda WooCommerce
                </h1>
                <p className="text-sm text-slate-400 mt-1">
                  Emparejamiento bidireccional de inventario (SKU) y facturación electrónica para pedidos en línea.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge className={activo ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-slate-800 text-slate-400'}>
                {activo ? 'Integración Activa' : 'Inactiva'}
              </Badge>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* PANEL IZQUIERDO: CREDENCIALES REST API (5 COLUMNAS) */}
            <Card className="lg:col-span-5 bg-[#121b2d] border-slate-800 shadow-xl h-fit">
              <CardHeader className="border-b border-slate-800 pb-4">
                <CardTitle className="text-base font-bold text-white flex items-center gap-2">
                  <Lock className="h-4 w-4 text-[#00f0ff]" />
                  Credenciales REST API (AES-256)
                </CardTitle>
                <CardDescription className="text-xs text-slate-400">
                  Las claves se cifran con grado bancario antes de almacenarse en la base de datos Postgres.
                </CardDescription>
              </CardHeader>
              <form onSubmit={handleGuardarCredenciales}>
                <CardContent className="space-y-4 pt-4 text-xs">
                  {mensaje && (
                    <div className="p-3 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-medium">
                      {mensaje}
                    </div>
                  )}
                  <div>
                    <label className="font-semibold text-slate-300 block mb-1">URL de su Tienda Online:</label>
                    <Input
                      required
                      placeholder="https://tienda.miempresa.com"
                      value={urlTienda}
                      onChange={(e) => setUrlTienda(e.target.value)}
                      className="bg-[#0b111e] border-slate-700 text-white"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-300 block mb-1">Consumer Key (ck_...):</label>
                    <Input
                      required
                      type="password"
                      placeholder="ck_123456789abcdef012345678"
                      value={consumerKey}
                      onChange={(e) => setConsumerKey(e.target.value)}
                      className="bg-[#0b111e] border-slate-700 text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-300 block mb-1">Consumer Secret (cs_...):</label>
                    <Input
                      required
                      type="password"
                      placeholder="cs_123456789abcdef012345678"
                      value={consumerSec}
                      onChange={(e) => setConsumerSec(e.target.value)}
                      className="bg-[#0b111e] border-slate-700 text-white font-mono"
                    />
                  </div>
                  <div className="flex items-center gap-2 pt-2">
                    <input
                      type="checkbox"
                      id="activoWoo"
                      checked={activo}
                      onChange={(e) => setActivo(e.target.checked)}
                      className="rounded border-slate-700 bg-[#0b111e] text-[#00f0ff] focus:ring-0"
                    />
                    <label htmlFor="activoWoo" className="text-slate-300 font-medium cursor-pointer">
                      Activar sincronización bidireccional y webhooks
                    </label>
                  </div>
                </CardContent>
                <div className="p-4 border-t border-slate-800 bg-[#0b111e]/50 flex justify-end">
                  <Button
                    type="submit"
                    disabled={guardando}
                    className="bg-[#00f0ff] hover:bg-[#00f0ff]/90 text-[#0b111e] font-bold text-xs px-5 shadow-lg"
                  >
                    {guardando ? 'Cifrando y Guardando...' : 'Guardar Credenciales Seguras'}
                  </Button>
                </div>
              </form>
            </Card>

            {/* PANEL DERECHO: ACCIONES Y COLA DE PEDIDOS WOO (7 COLUMNAS) */}
            <div className="lg:col-span-7 space-y-6">
              {/* Card de Sincronización Manual de Inventario */}
              <Card className="bg-[#121b2d] border-slate-800 shadow-xl">
                <CardHeader className="border-b border-slate-800 pb-4">
                  <CardTitle className="text-base font-bold text-white flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <RefreshCw className="h-5 w-5 text-[#00f0ff]" />
                      Sincronización Bidireccional de Inventario
                    </span>
                    {ultimaSync && (
                      <span className="text-xs font-normal text-slate-400">
                        Última sync: {new Date(ultimaSync).toLocaleString('es-PA')}
                      </span>
                    )}
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-400">
                    Alinea las existencias en almacén de Postgres con los niveles de stock de WooCommerce mediante código SKU.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="text-xs text-slate-300 space-y-1">
                    <p className="flex items-center gap-1.5">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                      Empareja productos por <strong>Código Interno / SKU</strong>.
                    </p>
                    <p className="flex items-center gap-1.5">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                      Evita quiebres al descontar stock por ventas locales POS en línea.
                    </p>
                  </div>
                  <Button
                    onClick={syncCatálgoStock}
                    disabled={sincronizandoStock || !urlTienda}
                    className="bg-pink-600 hover:bg-pink-700 text-white font-bold text-xs h-10 px-5 flex-shrink-0 shadow-md"
                  >
                    <RefreshCw className={`h-4 w-4 mr-2 ${sincronizandoStock ? 'animate-spin' : ''}`} />
                    {sincronizandoStock ? 'Emparejando...' : 'Sincronizar Stock Ahora'}
                  </Button>
                </CardContent>
              </Card>

              {/* Card de Importación de Pedidos para Facturación DGI */}
              <Card className="bg-[#121b2d] border-slate-800 shadow-xl">
                <CardHeader className="border-b border-slate-800 pb-4 flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-base font-bold text-white flex items-center gap-2">
                      <DownloadCloud className="h-5 w-5 text-[#00f0ff]" />
                      Pedidos de WooCommerce Pendientes de Facturación PAC
                    </CardTitle>
                    <CardDescription className="text-xs text-slate-400">
                      Convierte órdenes web pagadas en facturas electrónicas 01/02 y descuenta cuotas de tu saldo prepago.
                    </CardDescription>
                  </div>
                  <Button
                    onClick={importarPedidosPendientes}
                    disabled={importandoPedidos}
                    variant="secondary"
                    className="bg-slate-800 hover:bg-[#00f0ff] hover:text-[#0b111e] text-slate-200 text-xs font-bold"
                  >
                    <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${importandoPedidos ? 'animate-spin' : ''}`} />
                    Buscar Pedidos
                  </Button>
                </CardHeader>
                <CardContent className="p-0">
                  {pedidosWoo.length === 0 ? (
                    <div className="text-center py-10 text-slate-500 text-xs">
                      Presione "Buscar Pedidos" para consultar órdenes entrantes desde la tienda WooCommerce.
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-800">
                      {pedidosWoo.map((ped) => (
                        <div key={ped.idWoo} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-800/30">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-[#00f0ff] text-xs">#{ped.idWoo}</span>
                              <span className="text-sm font-bold text-white">{ped.cliente}</span>
                              <span className="text-xs text-slate-500 font-mono">({ped.ruc})</span>
                            </div>
                            <p className="text-xs text-slate-400 mt-0.5">
                              Ítems: {ped.items?.map((i: any) => `${i.cantidad}x ${i.descripcion}`).join(', ')} &bull; Pago: <strong className="text-slate-300">{ped.metodoPago}</strong>
                            </p>
                          </div>
                          <div className="flex items-center gap-3 justify-between sm:justify-end">
                            <span className="text-base font-mono font-bold text-white">${ped.total.toFixed(2)}</span>
                            <Button size="sm" className="bg-[#00f0ff] text-[#0b111e] font-bold text-xs h-8 px-3">
                              <FileText className="h-3.5 w-3.5 mr-1" />
                              Emitir FE (DGI)
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </ContentContainer>
    </div>
  );
}
