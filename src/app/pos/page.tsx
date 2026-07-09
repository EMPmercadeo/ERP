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
  Wifi,
  WifiOff,
  Printer,
  QrCode,
  DollarSign,
  CreditCard,
  Smartphone,
  Layers,
  RefreshCw,
  Store
} from 'lucide-react';

interface ProductoPOS {
  id: string;
  codigoInterno: string;
  codigoBarras?: string;
  descripcion: string;
  precioVenta: number;
  codigoTasaItbms: string; // '01' (7%), '00' (Exento)
  stockActual: number;
  unidadMedida: string; // 'SRV' = servicio, no lleva inventario
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
  const [errorCatalogo, setErrorCatalogo] = useState('');

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
      // El catálogo se scopea a la empresa de la sesión actual en el servidor
      // (getTenantContext), no por un empresaId que mande el cliente.
      const res = await fetch('/api/pos/productos');
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        const lista = (data.items || []).map((p: any) => ({
          id: p.id,
          codigoInterno: p.codigoInterno || 'SKU-01',
          codigoBarras: p.codigoBarras,
          descripcion: p.descripcion || 'Producto',
          precioVenta: Number(p.precioVenta ?? 0),
          codigoTasaItbms: p.codigoTasaItbms || '00',
          stockActual: p.stockActual ?? 0,
          unidadMedida: p.unidadMedida || 'UND'
        }));
        setProductos(lista);
        if (lista.length === 0) {
          setErrorCatalogo('No tienes productos activos todavía. Agrega productos en el módulo Productos para poder venderlos aquí.');
        } else {
          setErrorCatalogo('');
        }
      } else {
        setProductos([]);
        setErrorCatalogo(data.error || 'No se pudo cargar el catálogo de productos.');
      }
    } catch {
      setProductos([]);
      setErrorCatalogo('Error de conexión al cargar el catálogo de productos.');
    } finally {
      setLoading(false);
    }
  };

  const agregarAlCarrito = (p: ProductoPOS) => {
    const esServicio = p.unidadMedida === 'SRV';
    if (!esServicio && p.stockActual <= 0) {
      alert('Stock agotado para ' + p.descripcion);
      return;
    }
    const existe = carrito.find(it => it.productoId === p.id);
    const itbmsPorcentaje = p.codigoTasaItbms === '01' ? 7 : 0;

    if (existe) {
      if (!esServicio && existe.cantidad + 1 > p.stockActual) {
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
        const maxStock = p?.unidadMedida === 'SRV' ? Infinity : (p?.stockActual || 999);
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

        // Descontar en memoria local (los servicios no llevan stock)
        setProductos(productos.map(p => {
          const itemCart = carrito.find(c => c.productoId === p.id);
          return itemCart && p.unidadMedida !== 'SRV' ? { ...p, stockActual: p.stockActual - itemCart.cantidad } : p;
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
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans select-none overflow-x-hidden">
      {/* Topbar POS Pantalla Completa */}
      <header className="h-16 border-b border-border bg-card px-4 flex items-center justify-between shadow-premium sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <Store className="h-7 w-7 text-primary" />
          <div>
            <h1 className="text-base font-bold text-foreground tracking-wide leading-none">Punto de Venta (POS)</h1>
            <p className="text-[11px] text-muted-foreground font-mono">ERP Panamá &bull; Facturación electrónica DGI</p>
          </div>
        </div>

        {/* Indicadores en Tiempo Real y Acciones Rápidas */}
        <div className="flex items-center gap-3">
          {/* Botón de Estado y Contingencia */}
          <button
            onClick={() => setContingenciaForzada(!contingenciaForzada)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-all border ${
              !isOnline || contingenciaForzada
                ? 'bg-warning-bg text-warning border-warning/40'
                : 'bg-success-bg text-success border-success/40'
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
              className="bg-warning hover:bg-warning/90 text-white font-bold text-xs h-9 px-3 shadow-premium"
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
          <div className="flex items-center gap-3 bg-card p-3 rounded-lg border border-border shadow-premium">
            <Search className="h-5 w-5 text-muted-foreground ml-1 flex-shrink-0" />
            <Input
              placeholder="Buscar producto por SKU, nombre o código de barras..."
              value={buscar}
              onChange={(e) => setBuscar(e.target.value)}
              className="text-sm h-11"
            />
            {buscar && (
              <Button size="sm" variant="ghost" onClick={() => setBuscar('')} className="text-muted-foreground hover:text-foreground">
                Limpiar
              </Button>
            )}
          </div>

          {/* Grid de Productos (Botones Grandes Touch-First) */}
          {loading ? (
            <div className="flex-1 flex items-center justify-center text-muted-foreground animate-pulse">Cargando inventario para POS...</div>
          ) : errorCatalogo ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center gap-2 p-8 text-muted-foreground">
              <p className="text-sm font-medium">{errorCatalogo}</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 pb-4">
              {productosFiltrados.map((prod) => {
                const esServicio = prod.unidadMedida === 'SRV';
                const agotado = !esServicio && prod.stockActual <= 0;
                return (
                <button
                  key={prod.id}
                  onClick={() => agregarAlCarrito(prod)}
                  disabled={agotado}
                  className={`flex flex-col justify-between text-left p-3.5 rounded-xl border transition-all select-none group shadow-premium ${
                    agotado
                      ? 'bg-muted/40 border-border opacity-50 cursor-not-allowed'
                      : 'bg-card border-border hover:border-primary hover:shadow-premium-hover active:scale-95'
                  }`}
                >
                  <div>
                    <div className="flex justify-between items-start gap-1 mb-1">
                      <span className="text-[10px] font-mono font-bold text-muted-foreground bg-secondary px-1.5 py-0.5 rounded">
                        {prod.codigoInterno}
                      </span>
                      {prod.codigoTasaItbms === '01' && (
                        <span className="text-[10px] font-bold text-primary bg-accent px-1.5 py-0.5 rounded">
                          7% ITBMS
                        </span>
                      )}
                    </div>
                    <h3 className="text-xs sm:text-sm font-bold text-foreground group-hover:text-primary line-clamp-2 transition-colors">
                      {prod.descripcion}
                    </h3>
                  </div>

                  <div className="mt-4 flex items-end justify-between border-t border-border pt-2">
                    <div>
                      <span className="text-[11px] text-muted-foreground block">Precio</span>
                      <span className="text-base font-bold font-mono text-primary">
                        ${prod.precioVenta.toFixed(2)}
                      </span>
                    </div>
                    <div className="text-right">
                      {esServicio ? (
                        <span className="text-[10px] font-bold text-info bg-info-bg px-1.5 py-0.5 rounded">Servicio</span>
                      ) : (
                        <>
                          <span className="text-[10px] text-muted-foreground block">Stock</span>
                          <span className={`text-xs font-mono font-bold ${prod.stockActual <= 5 ? 'text-warning' : 'text-foreground'}`}>
                            {prod.stockActual}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </button>
                );
              })}
            </div>
          )}
        </div>

        {/* PANEL DERECHO: CARRITO Y TICKET DE VENTA (4 COLUMNAS EN DESKTOP) */}
        <div className="lg:col-span-4 bg-card rounded-xl border border-border flex flex-col h-[calc(100vh-6rem)] shadow-premium overflow-hidden">
          {/* Header Carrito */}
          <div className="p-4 border-b border-border bg-secondary flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-primary" />
              <h2 className="text-sm font-bold text-foreground uppercase">Ticket en Curso ({carrito.reduce((a, b) => a + b.cantidad, 0)} ítems)</h2>
            </div>
            {carrito.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCarrito([])}
                className="text-destructive hover:text-destructive hover:bg-danger-bg text-xs h-7 px-2"
              >
                <Trash2 className="h-3.5 w-3.5 mr-1" /> Vaciar
              </Button>
            )}
          </div>

          {/* Lista de Ítems en Carrito */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2.5 divide-y divide-border">
            {carrito.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground p-6">
                <ShoppingCart className="h-12 w-12 text-muted-foreground/50 mb-2" />
                <p className="text-xs font-medium">El carrito está vacío</p>
                <p className="text-[11px] text-muted-foreground mt-1">Selecciona productos del catálogo para comenzar el cobro</p>
              </div>
            ) : (
              carrito.map((item) => (
                <div key={item.productoId} className="pt-2 flex flex-col gap-1.5 text-xs">
                  <div className="flex justify-between items-start font-bold text-foreground">
                    <span className="line-clamp-1">{item.descripcion}</span>
                    <span className="font-mono text-primary flex-shrink-0 ml-2">
                      ${(item.cantidad * item.precioUnitario).toFixed(2)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-muted-foreground text-[11px]">
                    <span>${item.precioUnitario.toFixed(2)} c/u {item.itbmsPorcentaje > 0 && `(+${item.itbmsPorcentaje}%)`}</span>

                    {/* Botones Touch + / - */}
                    <div className="flex items-center gap-2 bg-secondary px-1 py-0.5 rounded border border-border">
                      <button
                        onClick={() => modificarCantidad(item.productoId, -1)}
                        className="h-6 w-6 rounded bg-muted hover:bg-muted-foreground/20 text-foreground flex items-center justify-center active:scale-90"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="font-mono font-bold text-foreground w-6 text-center">{item.cantidad}</span>
                      <button
                        onClick={() => modificarCantidad(item.productoId, 1)}
                        className="h-6 w-6 rounded bg-primary text-primary-foreground font-bold flex items-center justify-center active:scale-90"
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
          <div className="p-4 border-t border-border bg-secondary space-y-2">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Subtotal:</span>
              <span className="font-mono text-foreground">${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>ITBMS 7% (Impuesto):</span>
              <span className="font-mono text-foreground">${itbmsTotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-base font-bold text-foreground pt-2 border-t border-border">
              <span>TOTAL A COBRAR:</span>
              <span className="font-mono text-2xl text-primary">${total.toFixed(2)}</span>
            </div>

            {/* Botón COBRAR Touch */}
            <Button
              onClick={() => {
                if (carrito.length === 0) return;
                setEfectivoRecibido(total.toFixed(2));
                setShowPagoModal(true);
              }}
              disabled={carrito.length === 0}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-black text-base h-12 shadow-premium mt-3 tracking-wider active:scale-[0.98] transition-all"
            >
              <DollarSign className="h-5 w-5 mr-1" />
              COBRAR ${total.toFixed(2)}
            </Button>
          </div>
        </div>
      </main>

      {/* MODAL DE COBRO MULTIPUNTO (EFECTIVO, YAPPY, TARJETA) */}
      {showPagoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 backdrop-blur-sm p-4">
          <Card className="bg-card border-border w-full max-w-lg shadow-premium-hover">
            <CardHeader className="border-b border-border pb-4">
              <CardTitle className="text-lg font-bold text-foreground flex items-center justify-between">
                <span>Pagar Venta: <strong className="text-primary font-mono">${total.toFixed(2)}</strong></span>
                <Badge className="bg-secondary text-secondary-foreground font-mono text-xs">{carrito.length} ítems</Badge>
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Seleccione el método de cobro e identifique al cliente para emisión tributaria DGI.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4 pt-4 text-xs">
              {errorPago && (
                <div className="p-3 rounded bg-danger-bg border border-destructive/30 text-destructive font-medium">
                  {errorPago}
                </div>
              )}

              {/* Selector Tipo Comprobante DGI */}
              <div className="grid grid-cols-2 gap-2 bg-secondary p-1.5 rounded-lg border border-border">
                <button
                  type="button"
                  onClick={() => setTipoDoc('02')}
                  className={`py-2 rounded font-bold transition-all flex items-center justify-center gap-1.5 ${
                    tipoDoc === '02' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Boleta Electrónica (02)
                </button>
                <button
                  type="button"
                  onClick={() => setTipoDoc('01')}
                  className={`py-2 rounded font-bold transition-all flex items-center justify-center gap-1.5 ${
                    tipoDoc === '01' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Factura Fiscal (01 - RUC)
                </button>
              </div>

              {/* RUC / Cédula Cliente */}
              <div>
                <label className="font-semibold text-foreground block mb-1">
                  {tipoDoc === '01' ? 'RUC o Cédula del Cliente (*Obligatorio para Factura 01):' : 'RUC o Cédula (Opcional, Consumidor Final):'}
                </label>
                <Input
                  placeholder={tipoDoc === '01' ? 'Ej. 8-NT-1-1234 o 8-800-1234' : 'CF (Consumidor Final)'}
                  value={clienteRuc}
                  onChange={(e) => setClienteRuc(e.target.value)}
                  className="font-mono"
                />
              </div>

              {/* Selector de Métodos de Pago Pluggable */}
              <div>
                <label className="font-semibold text-foreground block mb-2">Método de Pago:</label>
                <div className="grid grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => setMetodoPago('EFECTIVO')}
                    className={`p-3 rounded-lg border flex flex-col items-center justify-center gap-1 transition-all ${
                      metodoPago === 'EFECTIVO' ? 'border-primary bg-accent text-primary font-bold' : 'border-border bg-secondary text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <DollarSign className="h-5 w-5" />
                    <span>Efectivo</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setMetodoPago('YAPPY')}
                    className={`p-3 rounded-lg border flex flex-col items-center justify-center gap-1 transition-all ${
                      metodoPago === 'YAPPY' ? 'border-primary bg-accent text-primary font-bold' : 'border-border bg-secondary text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <Smartphone className="h-5 w-5" />
                    <span>Yappy</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setMetodoPago('TARJETA')}
                    className={`p-3 rounded-lg border flex flex-col items-center justify-center gap-1 transition-all ${
                      metodoPago === 'TARJETA' ? 'border-primary bg-accent text-primary font-bold' : 'border-border bg-secondary text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <CreditCard className="h-5 w-5" />
                    <span>Tarjeta</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setMetodoPago('MIXTO')}
                    className={`p-3 rounded-lg border flex flex-col items-center justify-center gap-1 transition-all ${
                      metodoPago === 'MIXTO' ? 'border-primary bg-accent text-primary font-bold' : 'border-border bg-secondary text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <Layers className="h-5 w-5" />
                    <span>Mixto</span>
                  </button>
                </div>
              </div>

              {/* Pestaña dinámica según método */}
              {metodoPago === 'EFECTIVO' && (
                <div className="bg-secondary p-3 rounded-lg border border-border space-y-3">
                  <div className="flex justify-between items-center">
                    <label className="font-semibold text-foreground">Efectivo Recibido ($):</label>
                    <div className="flex gap-1.5">
                      {[10, 20, 50, 100].map(monto => (
                        <button
                          key={monto}
                          type="button"
                          onClick={() => setEfectivoRecibido(monto.toString())}
                          className="bg-muted hover:bg-muted-foreground/20 text-foreground px-2 py-1 rounded text-[11px] font-mono font-bold"
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
                    className="text-lg font-mono font-bold text-primary"
                  />
                  <div className="flex justify-between items-center pt-2 border-t border-border text-sm">
                    <span className="text-muted-foreground font-bold">Vuelto a entregar:</span>
                    <span className={`font-mono font-black ${vuelto < 0 ? 'text-destructive' : 'text-success text-lg'}`}>
                      ${vuelto < 0 ? '0.00' : vuelto.toFixed(2)}
                    </span>
                  </div>
                </div>
              )}

              {metodoPago === 'YAPPY' && (
                <div className="bg-secondary p-4 rounded-lg border border-primary/30 text-center space-y-2">
                  <div className="inline-block bg-white p-3 rounded-lg border border-border">
                    <QrCode className="h-24 w-24 text-ink mx-auto" />
                  </div>
                  <p className="text-xs font-bold text-primary">Escanee con la App de Yappy para pagar ${total.toFixed(2)}</p>
                  <p className="text-[11px] text-muted-foreground">Directorio comercial: @ERPPANAMA_POS (o confirmación por webhook)</p>
                </div>
              )}
            </CardContent>

            <div className="p-4 border-t border-border flex justify-end gap-3 bg-secondary">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowPagoModal(false)}
                className="text-xs"
              >
                Cancelar
              </Button>
              <Button
                type="button"
                onClick={handleProcesarVenta}
                disabled={procesandoVenta}
                className="bg-primary hover:bg-primary/90 text-primary-foreground font-black text-xs px-6 shadow-premium"
              >
                {procesandoVenta ? 'Emitiendo PAC...' : `CONFIRMAR COBRO ($${total.toFixed(2)})`}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* MODAL RECIBO TÉRMICO (80mm) & QR CUFE */}
      {reciboVenta && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/70 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white text-ink font-mono text-xs w-full max-w-[340px] p-5 rounded shadow-premium-hover my-auto print:max-w-full print:shadow-none print:m-0">
            <div className="text-center border-b-2 border-ink pb-3 mb-3">
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

            <div className="border-b border-ink pb-2 mb-2">
              <div className="flex justify-between font-bold text-[11px] border-b border-muted-foreground pb-1 mb-1">
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

            <div className="space-y-1 text-right text-[11px] border-b-2 border-ink pb-3 mb-3">
              <div className="flex justify-between"><span>Subtotal:</span><span>${reciboVenta.subtotal.toFixed(2)}</span></div>
              <div className="flex justify-between"><span>ITBMS (7%):</span><span>${reciboVenta.itbms.toFixed(2)}</span></div>
              <div className="flex justify-between font-black text-sm pt-1 border-t border-muted-foreground">
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
              <div className="inline-block border border-border p-1 bg-white">
                <QrCode className="h-28 w-28 text-ink mx-auto" />
              </div>
              {reciboVenta.cufe && (
                <p className="text-[9px] break-all font-mono text-ink-secondary">CUFE: {reciboVenta.cufe}</p>
              )}
              <p className="text-[9px] italic text-muted-foreground border-t border-border pt-2 leading-tight">
                {reciboVenta.mensajeLegal}
              </p>
            </div>

            {/* Botones de Acción No imprimibles */}
            <div className="pt-3 border-t border-border flex flex-col gap-2 print:hidden">
              <Button onClick={imprimirTicket} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs h-10">
                <Printer className="h-4 w-4 mr-2" />
                Imprimir Recibo Térmico (80mm)
              </Button>
              <Button variant="outline" onClick={() => setReciboVenta(null)} className="w-full text-xs h-9">
                Cerrar / Nueva Venta
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
