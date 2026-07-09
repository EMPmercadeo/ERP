'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  ShoppingCart,
  Search,
  Plus,
  Minus,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Wifi,
  WifiOff,
  Printer,
  QrCode,
  DollarSign,
  CreditCard,
  Smartphone,
  Layers,
  RefreshCw,
  LogOut,
  ShoppingBag,
  Store
} from 'lucide-react';
import Link from 'next/link';

interface ProductoPOS {
  id: string;
  codigoInterno: string;
  codigoBarras?: string;
  descripcion: string;
  precioVenta: number;
  codigoTasaItbms: string; // '01' (7%), '00' (Exento)
  stockActual: number;
}

interface ItemCarrito {
  productoId: string;
  descripcion: string;
  cantidad: number;
  precioUnitario: number;
  itbmsPorcentaje: number;
}

export default function POSMultiDispositivoPage() {
  const [productos, setProductos] = useState<ProductoPOS[]>([]);
  const [carrito, setCarrito] = useState<ItemCarrito[]>([]);
  const [buscar, setBuscar] = useState('');
  const [loading, setLoading] = useState(true);
  
  // Estado de Red y Cola Offline IndexedDB / LocalStorage
  const [isOnline, setIsOnline] = useState(true);
  const [contingenciaForzada, setContingenciaForzada] = useState(false);
  const [colaLocal, setColaLocal] = useState<any[]>([]);
  const [sincronizando, setSincronizando] = useState(false);

  // Modal Pago
  const [showPagoModal, setShowPagoModal] = useState(false);
  const [metodoPago, setMetodoPago] = useState<'EFECTIVO' | 'TARJETA' | 'YAPPY' | 'MIXTO'>('EFECTIVO');
  const [efectivoRecibido, setEfectivoRecibido] = useState<string>('');
  const [tipoDoc, setTipoDoc] = useState<'02' | '01'>('02'); // 02 Boleta, 01 Factura
  const [clienteRuc, setClienteRuc] = useState<string>('');
  const [procesandoVenta, setProcesandoVenta] = useState(false);
  const [errorPago, setErrorPago] = useState('');

  // Modal Recibo Térmico (80mm)
  const [reciboVenta, setReciboVenta] = useState<any>(null);

  // Detectar conectividad e inicializar cola
  useEffect(() => {
    setIsOnline(navigator.onLine);
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Cargar cola local desde localStorage (fallback IndexedDB)
    const savedQueue = localStorage.getItem('pos_ventas_queue');
    if (savedQueue) {
      try { setColaLocal(JSON.parse(savedQueue)); } catch {}
    }

    cargarProductos();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const cargarProductos = async () => {
    setLoading(true);
    try {
      const currentEmpresa = localStorage.getItem('active_tenant_id') || 'empresa-demo-id';
      const res = await fetch(`/api/inventario/productos?empresaId=${currentEmpresa}&activo=true&take=60`);
      if (res.ok) {
        const data = await res.json();
        const lista = (data.items || []).map((p: any) => ({
          id: p.id,
          codigoInterno: p.codigoInterno || 'SKU-01',
          codigoBarras: p.codigoBarras,
          descripcion: p.descripcion || 'Producto',
          precioVenta: Number(p.precioVenta || p.precio || 10),
          codigoTasaItbms: p.codigoTasaItbms || (p.precioVenta > 100 ? '01' : '00'),
          stockActual: p.stockActual || 25
        }));
        setProductos(lista);
      } else {
        // Fallback de demostración si la base no tiene aún productos en esa empresa
        setProductos([
          { id: 'prod-1', codigoInterno: 'CAF-01', codigoBarras: '7451101', descripcion: 'Café Geisha Especial 250g', precioVenta: 18.50, codigoTasaItbms: '01', stockActual: 30 },
          { id: 'prod-2', codigoInterno: 'PAN-02', codigoBarras: '7451102', descripcion: 'Pan Artesanal Masa Madre', precioVenta: 4.50, codigoTasaItbms: '00', stockActual: 15 },
          { id: 'prod-3', codigoInterno: 'AGU-03', codigoBarras: '7451103', descripcion: 'Agua Mineral Manantial 500ml', precioVenta: 1.25, codigoTasaItbms: '00', stockActual: 100 },
          { id: 'prod-4', codigoInterno: 'CHO-04', codigoBarras: '7451104', descripcion: 'Chocolate Oscuro Bocas del Toro', precioVenta: 6.75, codigoTasaItbms: '01', stockActual: 20 },
          { id: 'prod-5', codigoInterno: 'TEA-05', codigoBarras: '7451105', descripcion: 'Té Verde Orgánico Caja x20', precioVenta: 5.00, codigoTasaItbms: '00', stockActual: 40 }
        ]);
      }
    } catch {
      setProductos([
        { id: 'prod-1', codigoInterno: 'CAF-01', codigoBarras: '7451101', descripcion: 'Café Geisha Especial 250g', precioVenta: 18.50, codigoTasaItbms: '01', stockActual: 30 },
        { id: 'prod-2', codigoInterno: 'PAN-02', codigoBarras: '7451102', descripcion: 'Pan Artesanal Masa Madre', precioVenta: 4.50, codigoTasaItbms: '00', stockActual: 15 }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const agregarAlCarrito = (p: ProductoPOS) => {
    if (p.stockActual <= 0) {
      alert('Stock agotado para ' + p.descripcion);
      return;
    }
    const existe = carrito.find(it => it.productoId === p.id);
    const itbmsPorcentaje = p.codigoTasaItbms === '01' ? 7 : 0;

    if (existe) {
      if (existe.cantidad + 1 > p.stockActual) {
        alert('No puedes agregar más del stock disponible (' + p.stockActual + ')');
        return;
      }
      setCarrito(carrito.map(it => it.productoId === p.id ? { ...it, cantidad: it.cantidad + 1 } : it));
    } else {
      setCarrito([...carrito, {
        productoId: p.id,
        descripcion: p.descripcion,
        cantidad: 1,
        precioUnitario: p.precioVenta,
        itbmsPorcentaje
      }]);
    }
  };

  const modificarCantidad = (productoId: string, delta: number) => {
    setCarrito(carrito.map(it => {
      if (it.productoId === productoId) {
        const p = productos.find(prod => prod.id === productoId);
        const maxStock = p?.stockActual || 999;
        const nueva = it.cantidad + delta;
        if (nueva <= 0) return null;
        if (nueva > maxStock) {
          alert('Stock máximo excedido');
          return it;
        }
        return { ...it, cantidad: nueva };
      }
      return it;
    }).filter(Boolean) as ItemCarrito[]);
  };

  // Cálculo de totales en tiempo real
  const subtotal = carrito.reduce((acc, it) => acc + (it.cantidad * it.precioUnitario), 0);
  const itbmsTotal = carrito.reduce((acc, it) => acc + (it.cantidad * it.precioUnitario * (it.itbmsPorcentaje / 100)), 0);
  const total = subtotal + itbmsTotal;
  const vuelto = metodoPago === 'EFECTIVO' && efectivoRecibido ? Number(efectivoRecibido) - total : 0;

  const handleProcesarVenta = async () => {
    if (carrito.length === 0) return;
    if (metodoPago === 'EFECTIVO' && Number(efectivoRecibido) < total && Number(efectivoRecibido) > 0) {
      setErrorPago('El monto en efectivo recibido no cubre el total de la venta.');
      return;
    }
    if (tipoDoc === '01' && (!clienteRuc || clienteRuc.length < 5)) {
      setErrorPago('Para Factura Fiscal (01), es obligatorio ingresar el RUC o Cédula del cliente.');
      return;
    }

    setErrorPago('');
    setProcesandoVenta(true);
    const useOffline = !isOnline || contingenciaForzada;

    const payload = {
      empresaId: localStorage.getItem('active_tenant_id') || 'empresa-demo-id',
      tipoDoc,
      clienteRuc: clienteRuc || (tipoDoc === '01' ? 'CF' : null),
      items: carrito,
      metodoPago,
      subtotal: Number(subtotal.toFixed(2)),
      itbms: Number(itbmsTotal.toFixed(2)),
      total: Number(total.toFixed(2)),
      offline: useOffline
    };

    try {
      if (useOffline) {
        // Almacenar directamente en cola local IndexedDB / localStorage (Modo Contingencia DGI)
        const ventaOffline = {
          id: 'sync-' + Date.now(),
          ...payload,
          estado: 'LOCAL',
          createdAt: new Date().toISOString()
        };
        const nuevaCola = [...colaLocal, ventaOffline];
        setColaLocal(nuevaCola);
        localStorage.setItem('pos_ventas_queue', JSON.stringify(nuevaCola));

        // Descontar en memoria local
        setProductos(productos.map(p => {
          const itemCart = carrito.find(c => c.productoId === p.id);
          return itemCart ? { ...p, stockActual: p.stockActual - itemCart.cantidad } : p;
        }));

        setReciboVenta({
          numero: `CONTINGENCIA-${ventaOffline.id.slice(-6)}`,
          fecha: new Date().toLocaleString('es-PA'),
          tipo: tipoDoc === '01' ? 'FACTURA FISCAL DGI (CONTINGENCIA)' : 'BOLETA ELECTRÓNICA (CONTINGENCIA)',
          cliente: clienteRuc || 'Consumidor Final',
          items: carrito,
          subtotal,
          itbms: itbmsTotal,
          total,
          metodoPago,
          efectivoRecibido: Number(efectivoRecibido) || total,
          vuelto: Math.max(0, vuelto),
          contingencia: true,
          mensajeLegal: 'Emitido en Modo Contingencia DGI (Ley 462). Su comprobante será retransmitido al PAC para autorización definitiva dentro de las 72h reglamentarias.'
        });

        setCarrito([]);
        setShowPagoModal(false);
      } else {
        // Transacción en línea ante PAC (Consume 1 del saldo prepago de facturas)
        const res = await fetch('/api/pos/ventas', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const data = await res.json();

        if (!res.ok) {
          setErrorPago(data.error || 'Error en la autorización PAC');
        } else {
          // Actualizar stock local con el resultado del backend
          cargarProductos();

          setReciboVenta({
            numero: data.venta?.id ? `DGI-${data.venta.id.slice(-8).toUpperCase()}` : 'DGI-POS-001',
            fecha: new Date().toLocaleString('es-PA'),
            tipo: tipoDoc === '01' ? 'FACTURA ELECTRÓNICA (01)' : 'BOLETA ELECTRÓNICA (02)',
            cliente: clienteRuc || 'Consumidor Final',
            items: carrito,
            subtotal,
            itbms: itbmsTotal,
            total,
            metodoPago,
            efectivoRecibido: Number(efectivoRecibido) || total,
            vuelto: Math.max(0, vuelto),
            cufe: data.cufe || data.venta?.cufe || 'FE019999999000000000000000001000010001111111111',
            cafUrl: data.cafUrl,
            contingencia: false,
            mensajeLegal: 'Autorizado y certificado por PAC DGI. Consulte su factura electrónica por CUFE o código QR en el portal tributario.'
          });

          setCarrito([]);
          setShowPagoModal(false);
        }
      }
    } catch {
      setErrorPago('Fallo en el servicio. Intente o active contingencia local.');
    } finally {
      setProcesandoVenta(false);
    }
  };

  const retransmitirColaAlPAC = async () => {
    if (colaLocal.length === 0) return;
    setSincronizando(true);
    try {
      const res = await fetch('/api/pos/ventas/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          empresaId: localStorage.getItem('active_tenant_id') || 'empresa-demo-id',
          ventasQueue: colaLocal
        })
      });
      const data = await res.json();
      if (res.ok) {
        alert(`✔ ${data.message}`);
        setColaLocal([]);
        localStorage.removeItem('pos_ventas_queue');
        cargarProductos();
      } else {
        alert('Error al retransmitir: ' + data.error);
      }
    } catch {
      alert('Error de conexión con el servidor PAC.');
    } finally {
      setSincronizando(false);
    }
  };

  const imprimirTicket = () => {
    window.print();
  };

  const productosFiltrados = productos.filter(p =>
    p.descripcion.toLowerCase().includes(buscar.toLowerCase()) ||
    p.codigoInterno.toLowerCase().includes(buscar.toLowerCase()) ||
    (p.codigoBarras && p.codigoBarras.includes(buscar))
  );

  return (
    <div className="min-h-screen bg-[#0b111e] text-slate-100 flex flex-col font-sans select-none overflow-x-hidden">
      {/* Topbar POS Pantalla Completa */}
      <header className="h-16 border-b border-slate-800 bg-[#121b2d] px-4 flex items-center justify-between shadow-lg sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <Store className="h-7 w-7 text-[#00f0ff]" />
          <div>
            <h1 className="text-base font-bold text-white tracking-wide leading-none">PUNTO DE VENTA (POS) MULTI-DISPOSITIVO</h1>
            <p className="text-[11px] text-slate-400 font-mono">ERP Panamá &bull; Conexión DGI & WooCommerce</p>
          </div>
        </div>

        {/* Indicadores en Tiempo Real y Acciones Rápidas */}
        <div className="flex items-center gap-3">
          <Link href="/pos/woocommerce">
            <Button variant="outline" size="sm" className="border-slate-700 bg-[#0b111e] hover:bg-slate-800 text-xs text-slate-300">
              <ShoppingBag className="h-3.5 w-3.5 mr-1.5 text-pink-400" />
              WooCommerce Sync
            </Button>
          </Link>

          {/* Botón de Estado y Contingencia */}
          <button
            onClick={() => setContingenciaForzada(!contingenciaForzada)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-all border ${
              !isOnline || contingenciaForzada
                ? 'bg-amber-500/10 text-amber-400 border-amber-500/40 animate-pulse'
                : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/40'
            }`}
          >
            {!isOnline || contingenciaForzada ? <WifiOff className="h-4 w-4" /> : <Wifi className="h-4 w-4" />}
            {!isOnline ? 'OFFLINE (Contingencia DGI)' : contingenciaForzada ? 'MODO CONTINGENCIA FORZADA' : 'EN LÍNEA (PAC DGI)'}
          </button>

          {/* Cola Offline Sincronización */}
          {colaLocal.length > 0 && (
            <Button
              onClick={retransmitirColaAlPAC}
              disabled={sincronizando || !isOnline}
              className="bg-amber-500 hover:bg-amber-600 text-[#0b111e] font-bold text-xs h-9 px-3 shadow-md"
            >
              <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${sincronizando ? 'animate-spin' : ''}`} />
              {sincronizando ? 'Retransmitiendo...' : `Retransmitir Cola PAC (${colaLocal.length})`}
            </Button>
          )}
        </div>
      </header>

      {/* Grid Principal Responsive (Touch-First PWA) */}
      <main className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 p-4 overflow-hidden">
        {/* PANEL IZQUIERDO: CATÁLOGO DE PRODUCTOS (8 COLUMNAS EN DESKTOP) */}
        <div className="lg:col-span-8 flex flex-col gap-4 overflow-y-auto max-h-[calc(100vh-6rem)] pr-1">
          {/* Barra de Búsqueda y Filtror */}
          <div className="flex items-center gap-3 bg-[#121b2d] p-3 rounded-lg border border-slate-800 shadow-sm">
            <Search className="h-5 w-5 text-slate-400 ml-1 flex-shrink-0" />
            <Input
              placeholder="Buscar producto por SKU, nombre o código de barras touch..."
              value={buscar}
              onChange={(e) => setBuscar(e.target.value)}
              className="bg-[#0b111e] border-slate-700 text-white placeholder:text-slate-500 text-sm h-11 focus:border-[#00f0ff]"
            />
            {buscar && (
              <Button size="sm" variant="ghost" onClick={() => setBuscar('')} className="text-slate-400 hover:text-white">
                Limpiar
              </Button>
            )}
          </div>

          {/* Grid de Productos (Botones Grandes Touch-First) */}
          {loading ? (
            <div className="flex-1 flex items-center justify-center text-slate-400 animate-pulse">Cargando inventario para POS...</div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 pb-4">
              {productosFiltrados.map((prod) => (
                <button
                  key={prod.id}
                  onClick={() => agregarAlCarrito(prod)}
                  disabled={prod.stockActual <= 0}
                  className={`flex flex-col justify-between text-left p-3.5 rounded-xl border transition-all select-none group shadow-md ${
                    prod.stockActual <= 0
                      ? 'bg-slate-900/60 border-slate-800 opacity-50 cursor-not-allowed'
                      : 'bg-[#121b2d] border-slate-800 hover:border-[#00f0ff] hover:bg-[#162238] active:scale-95'
                  }`}
                >
                  <div>
                    <div className="flex justify-between items-start gap-1 mb-1">
                      <span className="text-[10px] font-mono font-bold text-slate-400 bg-[#0b111e] px-1.5 py-0.5 rounded">
                        {prod.codigoInterno}
                      </span>
                      {prod.codigoTasaItbms === '01' && (
                        <span className="text-[10px] font-bold text-[#00f0ff] bg-[#00f0ff]/10 px-1.5 py-0.5 rounded">
                          7% ITBMS
                        </span>
                      )}
                    </div>
                    <h3 className="text-xs sm:text-sm font-bold text-white group-hover:text-[#00f0ff] line-clamp-2 transition-colors">
                      {prod.descripcion}
                    </h3>
                  </div>

                  <div className="mt-4 flex items-end justify-between border-t border-slate-800/80 pt-2">
                    <div>
                      <span className="text-[11px] text-slate-400 block">Precio</span>
                      <span className="text-base font-bold font-mono text-[#00f0ff]">
                        ${prod.precioVenta.toFixed(2)}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-slate-500 block">Stock</span>
                      <span className={`text-xs font-mono font-bold ${prod.stockActual <= 5 ? 'text-amber-400' : 'text-slate-300'}`}>
                        {prod.stockActual}
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* PANEL DERECHO: CARRITO Y TICKET DE VENTA (4 COLUMNAS EN DESKTOP) */}
        <div className="lg:col-span-4 bg-[#121b2d] rounded-xl border border-slate-800 flex flex-col h-[calc(100vh-6rem)] shadow-2xl overflow-hidden">
          {/* Header Carrito */}
          <div className="p-4 border-b border-slate-800 bg-[#0b111e]/60 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-[#00f0ff]" />
              <h2 className="text-sm font-bold text-white uppercase">Ticket en Curso ({carrito.reduce((a, b) => a + b.cantidad, 0)} ítems)</h2>
            </div>
            {carrito.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCarrito([])}
                className="text-red-400 hover:text-red-300 hover:bg-red-500/10 text-xs h-7 px-2"
              >
                <Trash2 className="h-3.5 w-3.5 mr-1" /> Vaciar
              </Button>
            )}
          </div>

          {/* Lista de Ítems en Carrito */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2.5 divide-y divide-slate-800/50">
            {carrito.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center text-slate-500 p-6">
                <ShoppingCart className="h-12 w-12 text-slate-700 mb-2" />
                <p className="text-xs font-medium">El carrito está vacío</p>
                <p className="text-[11px] text-slate-600 mt-1">Selecciona productos del grid touch para comenzar el cobro</p>
              </div>
            ) : (
              carrito.map((item) => (
                <div key={item.productoId} className="pt-2 flex flex-col gap-1.5 text-xs">
                  <div className="flex justify-between items-start font-bold text-white">
                    <span className="line-clamp-1">{item.descripcion}</span>
                    <span className="font-mono text-[#00f0ff] flex-shrink-0 ml-2">
                      ${(item.cantidad * item.precioUnitario).toFixed(2)}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between text-slate-400 text-[11px]">
                    <span>${item.precioUnitario.toFixed(2)} c/u {item.itbmsPorcentaje > 0 && `(+${item.itbmsPorcentaje}%)`}</span>
                    
                    {/* Botones Touch + / - */}
                    <div className="flex items-center gap-2 bg-[#0b111e] px-1 py-0.5 rounded border border-slate-800">
                      <button
                        onClick={() => modificarCantidad(item.productoId, -1)}
                        className="h-6 w-6 rounded bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center active:scale-90"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="font-mono font-bold text-white w-6 text-center">{item.cantidad}</span>
                      <button
                        onClick={() => modificarCantidad(item.productoId, 1)}
                        className="h-6 w-6 rounded bg-[#00f0ff] text-[#0b111e] font-bold flex items-center justify-center active:scale-90"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Subtotal, ITBMS y Total Exacto */}
          <div className="p-4 border-t border-slate-800 bg-[#0b111e] space-y-2">
            <div className="flex justify-between text-xs text-slate-400">
              <span>Subtotal:</span>
              <span className="font-mono text-white">${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-xs text-slate-400">
              <span>ITBMS 7% (Impuesto):</span>
              <span className="font-mono text-white">${itbmsTotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-base font-bold text-white pt-2 border-t border-slate-800">
              <span>TOTAL A COBRAR:</span>
              <span className="font-mono text-2xl text-[#00f0ff]">${total.toFixed(2)}</span>
            </div>

            {/* Botón COBRAR Touch */}
            <Button
              onClick={() => {
                if (carrito.length === 0) return;
                setEfectivoRecibido(total.toFixed(2));
                setShowPagoModal(true);
              }}
              disabled={carrito.length === 0}
              className="w-full bg-[#00f0ff] hover:bg-[#00f0ff]/90 text-[#0b111e] font-black text-base h-12 shadow-xl shadow-[#00f0ff]/20 mt-3 tracking-wider active:scale-95 transition-all"
            >
              <DollarSign className="h-5 w-5 mr-1" />
              COBRAR ${total.toFixed(2)}
            </Button>
          </div>
        </div>
      </main>

      {/* MODAL DE COBRO MULTIPUNTO (EFECTIVO, YAPPY, TARJETA) */}
      {showPagoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4">
          <Card className="bg-[#121b2d] border-slate-700 w-full max-w-lg shadow-2xl">
            <CardHeader className="border-b border-slate-800 pb-4">
              <CardTitle className="text-lg font-bold text-white flex items-center justify-between">
                <span>Pagar Venta: <strong className="text-[#00f0ff] font-mono">${total.toFixed(2)}</strong></span>
                <Badge className="bg-slate-800 text-slate-300 font-mono text-xs">{carrito.length} ítems</Badge>
              </CardTitle>
              <CardDescription className="text-xs text-slate-400">
                Seleccione el método de cobro e identifique al cliente para emisión tributaria DGI.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4 pt-4 text-xs">
              {errorPago && (
                <div className="p-3 rounded bg-red-500/10 border border-red-500/30 text-red-400 font-medium">
                  {errorPago}
                </div>
              )}

              {/* Selector Tipo Comprobante DGI */}
              <div className="grid grid-cols-2 gap-2 bg-[#0b111e] p-1.5 rounded-lg border border-slate-800">
                <button
                  type="button"
                  onClick={() => setTipoDoc('02')}
                  className={`py-2 rounded font-bold transition-all flex items-center justify-center gap-1.5 ${
                    tipoDoc === '02' ? 'bg-[#00f0ff] text-[#0b111e]' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Boleta Electrónica (02)
                </button>
                <button
                  type="button"
                  onClick={() => setTipoDoc('01')}
                  className={`py-2 rounded font-bold transition-all flex items-center justify-center gap-1.5 ${
                    tipoDoc === '01' ? 'bg-[#00f0ff] text-[#0b111e]' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Factura Fiscal (01 - RUC)
                </button>
              </div>

              {/* RUC / Cédula Cliente */}
              <div>
                <label className="font-semibold text-slate-300 block mb-1">
                  {tipoDoc === '01' ? 'RUC o Cédula del Cliente (*Obligatorio para Factura 01):' : 'RUC o Cédula (Opcional, Consumidor Final):'}
                </label>
                <Input
                  placeholder={tipoDoc === '01' ? 'Ej. 8-NT-1-1234 o 8-800-1234' : 'CF (Consumidor Final)'}
                  value={clienteRuc}
                  onChange={(e) => setClienteRuc(e.target.value)}
                  className="bg-[#0b111e] border-slate-700 text-white font-mono"
                />
              </div>

              {/* Selector de Métodos de Pago Pluggable */}
              <div>
                <label className="font-semibold text-slate-300 block mb-2">Método de Pago:</label>
                <div className="grid grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => setMetodoPago('EFECTIVO')}
                    className={`p-3 rounded-lg border flex flex-col items-center justify-center gap-1 transition-all ${
                      metodoPago === 'EFECTIVO' ? 'border-[#00f0ff] bg-[#00f0ff]/10 text-[#00f0ff] font-bold' : 'border-slate-800 bg-[#0b111e] text-slate-400 hover:text-white'
                    }`}
                  >
                    <DollarSign className="h-5 w-5" />
                    <span>Efectivo</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setMetodoPago('YAPPY')}
                    className={`p-3 rounded-lg border flex flex-col items-center justify-center gap-1 transition-all ${
                      metodoPago === 'YAPPY' ? 'border-cyan-400 bg-cyan-500/10 text-cyan-400 font-bold' : 'border-slate-800 bg-[#0b111e] text-slate-400 hover:text-white'
                    }`}
                  >
                    <Smartphone className="h-5 w-5 text-cyan-400" />
                    <span>Yappy</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setMetodoPago('TARJETA')}
                    className={`p-3 rounded-lg border flex flex-col items-center justify-center gap-1 transition-all ${
                      metodoPago === 'TARJETA' ? 'border-[#00f0ff] bg-[#00f0ff]/10 text-[#00f0ff] font-bold' : 'border-slate-800 bg-[#0b111e] text-slate-400 hover:text-white'
                    }`}
                  >
                    <CreditCard className="h-5 w-5" />
                    <span>Tarjeta</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setMetodoPago('MIXTO')}
                    className={`p-3 rounded-lg border flex flex-col items-center justify-center gap-1 transition-all ${
                      metodoPago === 'MIXTO' ? 'border-[#00f0ff] bg-[#00f0ff]/10 text-[#00f0ff] font-bold' : 'border-slate-800 bg-[#0b111e] text-slate-400 hover:text-white'
                    }`}
                  >
                    <Layers className="h-5 w-5" />
                    <span>Mixto</span>
                  </button>
                </div>
              </div>

              {/* Pestaña dinámica según método */}
              {metodoPago === 'EFECTIVO' && (
                <div className="bg-[#0b111e] p-3 rounded-lg border border-slate-800 space-y-3">
                  <div className="flex justify-between items-center">
                    <label className="font-semibold text-slate-300">Efectivo Recibido ($):</label>
                    <div className="flex gap-1.5">
                      {[10, 20, 50, 100].map(monto => (
                        <button
                          key={monto}
                          type="button"
                          onClick={() => setEfectivoRecibido(monto.toString())}
                          className="bg-slate-800 hover:bg-slate-700 text-white px-2 py-1 rounded text-[11px] font-mono font-bold"
                        >
                          ${monto}
                        </button>
                      ))}
                    </div>
                  </div>
                  <Input
                    type="number"
                    step="0.01"
                    value={efectivoRecibido}
                    onChange={(e) => setEfectivoRecibido(e.target.value)}
                    className="bg-[#121b2d] border-slate-700 text-lg font-mono font-bold text-[#00f0ff]"
                  />
                  <div className="flex justify-between items-center pt-2 border-t border-slate-800/80 text-sm">
                    <span className="text-slate-400 font-bold">Vuelto a entregar:</span>
                    <span className={`font-mono font-black ${vuelto < 0 ? 'text-red-400' : 'text-emerald-400 text-lg'}`}>
                      ${vuelto < 0 ? '0.00' : vuelto.toFixed(2)}
                    </span>
                  </div>
                </div>
              )}

              {metodoPago === 'YAPPY' && (
                <div className="bg-[#0b111e] p-4 rounded-lg border border-cyan-500/40 text-center space-y-2">
                  <div className="inline-block bg-white p-3 rounded-lg">
                    <QrCode className="h-24 w-24 text-black mx-auto" />
                  </div>
                  <p className="text-xs font-bold text-cyan-400">Escanee con la App de Yappy para pagar ${total.toFixed(2)}</p>
                  <p className="text-[11px] text-slate-400">Directorio comercial: @ERPPANAMA_POS (o confirmación por webhook)</p>
                </div>
              )}
            </CardContent>

            <div className="p-4 border-t border-slate-800 flex justify-end gap-3 bg-[#0b111e]/60">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowPagoModal(false)}
                className="border-slate-700 text-slate-300 hover:bg-slate-800 text-xs"
              >
                Cancelar
              </Button>
              <Button
                type="button"
                onClick={handleProcesarVenta}
                disabled={procesandoVenta}
                className="bg-[#00f0ff] hover:bg-[#00f0ff]/90 text-[#0b111e] font-black text-xs px-6 shadow-xl"
              >
                {procesandoVenta ? 'Emitiendo PAC...' : `CONFIRMAR COBRO ($${total.toFixed(2)})`}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* MODAL RECIBO TÉRMICO (80mm) & QR CUFE */}
      {reciboVenta && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 overflow-y-auto">
          <div className="bg-white text-black font-mono text-xs w-full max-w-[340px] p-5 rounded shadow-2xl my-auto print:max-w-full print:shadow-none print:m-0">
            <div className="text-center border-b-2 border-black pb-3 mb-3">
              <h2 className="font-black text-base uppercase">ERP PANAMÁ POS</h2>
              <p className="text-[10px]">RUC: 8-800-1234 DV 54 &bull; Panamá</p>
              <p className="font-bold text-xs mt-1">{reciboVenta.tipo}</p>
              <p className="text-[10px]">Comprobante #{reciboVenta.numero}</p>
              <p className="text-[10px]">{reciboVenta.fecha}</p>
            </div>

            <div className="mb-3 text-[11px]">
              <p><strong>Cliente:</strong> {reciboVenta.cliente}</p>
              <p><strong>Método de Pago:</strong> {reciboVenta.metodoPago}</p>
            </div>

            <div className="border-b border-black pb-2 mb-2">
              <div className="flex justify-between font-bold text-[11px] border-b border-gray-400 pb-1 mb-1">
                <span>DESCRIPCIÓN</span>
                <span>TOTAL</span>
              </div>
              {reciboVenta.items.map((it: any, i: number) => (
                <div key={i} className="flex justify-between py-0.5">
                  <span>{it.cantidad}x {it.descripcion}</span>
                  <span>${(it.cantidad * it.precioUnitario).toFixed(2)}</span>
                </div>
              ))}
            </div>

            <div className="space-y-1 text-right text-[11px] border-b-2 border-black pb-3 mb-3">
              <div className="flex justify-between"><span>Subtotal:</span><span>${reciboVenta.subtotal.toFixed(2)}</span></div>
              <div className="flex justify-between"><span>ITBMS (7%):</span><span>${reciboVenta.itbms.toFixed(2)}</span></div>
              <div className="flex justify-between font-black text-sm pt-1 border-t border-gray-400">
                <span>TOTAL:</span>
                <span>${reciboVenta.total.toFixed(2)}</span>
              </div>
              {reciboVenta.metodoPago === 'EFECTIVO' && (
                <>
                  <div className="flex justify-between text-[10px] pt-1"><span>Efectivo Recibido:</span><span>${reciboVenta.efectivoRecibido.toFixed(2)}</span></div>
                  <div className="flex justify-between text-[10px] font-bold"><span>Vuelto:</span><span>${reciboVenta.vuelto.toFixed(2)}</span></div>
                </>
              )}
            </div>

            {/* Código QR del CUFE o Contingencia */}
            <div className="text-center space-y-2 my-4">
              <div className="inline-block border p-1 bg-white">
                <QrCode className="h-28 w-28 text-black mx-auto" />
              </div>
              {reciboVenta.cufe && (
                <p className="text-[9px] break-all font-mono text-gray-700">CUFE: {reciboVenta.cufe}</p>
              )}
              <p className="text-[9px] italic text-gray-600 border-t border-gray-300 pt-2 leading-tight">
                {reciboVenta.mensajeLegal}
              </p>
            </div>

            {/* Botones de Acción No imprimibles */}
            <div className="pt-3 border-t border-gray-300 flex flex-col gap-2 print:hidden">
              <Button onClick={imprimirTicket} className="w-full bg-black hover:bg-gray-800 text-white font-bold text-xs h-10">
                <Printer className="h-4 w-4 mr-2" />
                Imprimir Recibo Térmico (80mm)
              </Button>
              <Button variant="outline" onClick={() => setReciboVenta(null)} className="w-full border-gray-400 text-black text-xs h-9">
                Cerrar / Nueva Venta
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
