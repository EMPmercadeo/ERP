'use client';

import React, { useState, useEffect, useCallback } from 'react';
import QRCode from 'qrcode';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import EscanerCodigoBarras from './components/EscanerCodigoBarras';
import YappyBotonPago from './components/YappyBotonPago';
import { haySoporteSerial, conectarImpresoraSerial, desconectarImpresoraSerial, imprimirReciboEscPos, abrirCajonDinero } from '@/lib/pos/hardwareEscPos';
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
  Store,
  ScanLine,
  Lock,
  Wallet,
  LogOut,
  Usb
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
  descuentoSugerido: number; // % preaprobado por el dueño (producto o su categoría)
}

interface ItemCarrito {
  productoId: string;
  descripcion: string;
  cantidad: number;
  precioUnitario: number;
  itbmsPorcentaje: number;
  descuentoPorcentaje: number; // % manual/sugerido aplicado a esta línea
}

interface VentaOfflineQueueItem {
  id: string;
  tipoDoc: '01' | '02';
  clienteRuc: string | null;
  items: ItemCarrito[];
  metodoPago: 'EFECTIVO' | 'TARJETA' | 'YAPPY' | 'MIXTO';
  subtotal: number;
  itbms: number;
  total: number;
  offline: boolean;
  autorizacion?: { adminEmail: string; pin: string };
  estado: string;
  createdAt: string;
  turnoCajaId?: string;
  referenciaPago?: string;
}

interface TurnoCajaActivo {
  id: string;
  fechaApertura: string;
  montoInicial: number;
  observaciones?: string | null;
}

interface TurnoCajaResumen {
  totalEfectivoVentas: number;
  montoEsperado: number;
}

interface ReciboVenta {
  numero: string;
  fecha: string;
  tipo: string;
  cliente: string;
  items: ItemCarrito[];
  subtotal: number;
  itbms: number;
  total: number;
  metodoPago: string;
  referenciaPago?: string;
  efectivoRecibido: number;
  vuelto: number;
  cufe?: string;
  cafUrl?: string;
  contingencia: boolean;
  mensajeLegal: string;
}

interface ProductoPOSRaw {
  id: string;
  codigoInterno?: string;
  codigoBarras?: string;
  descripcion?: string;
  precioVenta?: number | string;
  codigoTasaItbms?: string;
  stockActual?: number;
  unidadMedida?: string;
  descuentoSugerido?: number | string;
}

interface VentaPayload {
  tipoDoc: '01' | '02';
  clienteRuc: string | null;
  items: ItemCarrito[];
  metodoPago: 'EFECTIVO' | 'TARJETA' | 'YAPPY' | 'MIXTO';
  subtotal: number;
  itbms: number;
  total: number;
  offline: boolean;
  autorizacion?: { adminEmail: string; pin: string };
  referenciaPago?: string;
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
  const [colaLocal, setColaLocal] = useState<VentaOfflineQueueItem[]>([]);
  const [sincronizando, setSincronizando] = useState(false);

  // Modal Pago
  const [showPagoModal, setShowPagoModal] = useState(false);
  const [metodoPago, setMetodoPago] = useState<'EFECTIVO' | 'TARJETA' | 'YAPPY' | 'MIXTO'>('EFECTIVO');
  const [efectivoRecibido, setEfectivoRecibido] = useState<string>('');
  // Numero de referencia/autorizacion del datafono o de Yappy: no hay integracion real con un
  // procesador de pagos (requiere credenciales reales del usuario), asi que Tarjeta/Yappy son
  // un flujo manual mejorado -- se cobra fisicamente por fuera y se anota la referencia aqui
  // para conciliar despues.
  const [referenciaPago, setReferenciaPago] = useState('');
  const [tipoDoc, setTipoDoc] = useState<'02' | '01'>('02'); // 02 Boleta, 01 Factura
  const [clienteRuc, setClienteRuc] = useState<string>('');
  const [procesandoVenta, setProcesandoVenta] = useState(false);
  const [errorPago, setErrorPago] = useState('');

  // Descuento especial del cliente encontrado por RUC (preaprobado por el dueño)
  const [clienteEncontrado, setClienteEncontrado] = useState<{ razonSocial: string; descuentoEspecial: number } | null>(null);
  const [topeDescuento, setTopeDescuento] = useState<number>(10);

  // Modal de autorización de admin/gerente (PIN) para descuentos fuera del tope
  const [showAutorizacionModal, setShowAutorizacionModal] = useState(false);
  const [adminEmailAutorizacion, setAdminEmailAutorizacion] = useState('');
  const [pinAutorizacion, setPinAutorizacion] = useState('');
  const [errorAutorizacion, setErrorAutorizacion] = useState('');

  // Modal Recibo Térmico (80mm)
  const [reciboVenta, setReciboVenta] = useState<ReciboVenta | null>(null);
  // QR real (librería `qrcode`) que codifica el CUFE / link de verificación DGI del recibo
  const [qrReciboDataUrl, setQrReciboDataUrl] = useState<string>('');

  // Turno de Caja: no se puede vender sin uno abierto (el bloqueo real ocurre en el
  // servidor en /api/pos/ventas; esto es solo para guiar al cajero en la UI).
  const [turnoActivo, setTurnoActivo] = useState<TurnoCajaActivo | null>(null);
  const [cargandoTurno, setCargandoTurno] = useState(true);
  const [montoInicialTurno, setMontoInicialTurno] = useState('');
  const [abriendoTurno, setAbriendoTurno] = useState(false);
  const [errorTurno, setErrorTurno] = useState('');

  const [showCierreTurnoModal, setShowCierreTurnoModal] = useState(false);
  const [resumenCierreTurno, setResumenCierreTurno] = useState<TurnoCajaResumen | null>(null);
  const [montoContadoCierre, setMontoContadoCierre] = useState('');
  const [cerrandoTurno, setCerrandoTurno] = useState(false);
  const [turnoRecienCerrado, setTurnoRecienCerrado] = useState<{ id?: string; montoEsperadoCierre: number; montoContadoCierre: number; diferencia: number } | null>(null);

  // Escaneo de código de barras por cámara
  const [showEscanerModal, setShowEscanerModal] = useState(false);
  const [avisoEscaneo, setAvisoEscaneo] = useState('');

  // Avisos inline de carrito (stock agotado/máximo) y de sincronización con el PAC,
  // en vez de `window.alert()` (congela la pantalla a mitad de una venta activa).
  const [avisoCarrito, setAvisoCarrito] = useState('');
  const [avisoSync, setAvisoSync] = useState<{ tipo: 'success' | 'error'; mensaje: string } | null>(null);

  // Hardware físico opcional (impresora térmica ESC/POS + cajón de dinero) vía Web Serial.
  // Nada de esto se puede probar en este entorno de desarrollo (no hay hardware real
  // conectado) -- se degrada a no-op si el navegador no soporta Web Serial o el usuario no
  // conecta nada; `window.print()` (imprimirTicket) sigue funcionando siempre como opción.
  const [soportaSerial, setSoportaSerial] = useState(false);
  const [impresoraPort, setImpresoraPort] = useState<SerialPort | null>(null);
  const [conectandoImpresora, setConectandoImpresora] = useState(false);
  const [errorHardware, setErrorHardware] = useState('');

  // Cobro real con Yappy Comercial (si la empresa lo configuró y habilitó en Configuración);
  // si no, el panel de YAPPY sigue usando el flujo manual de referencia ya existente.
  const [yappyDisponible, setYappyDisponible] = useState(false);
  const [yappyAmbiente, setYappyAmbiente] = useState<'produccion' | 'pruebas'>('pruebas');

  // Cargar el tope de descuento sin autorización del usuario actual (solo informativo
  // para la UI; la validación real y obligatoria siempre ocurre en el servidor).
  useEffect(() => {
    fetch('/api/pos/tope-descuento')
      .then(res => res.ok ? res.json() : { tope: 10 })
      .then(data => setTopeDescuento(Number(data.tope ?? 10)))
      .catch(() => setTopeDescuento(10));
  }, []);

  // Buscar cliente por RUC (con debounce simple) para sugerir su descuento especial
  useEffect(() => {
    if (!clienteRuc || clienteRuc.length < 3) {
      setClienteEncontrado(null);
      return;
    }
    const timeout = setTimeout(() => {
      fetch(`/api/pos/clientes?ruc=${encodeURIComponent(clienteRuc)}`)
        .then(res => res.ok ? res.json() : { cliente: null })
        .then(data => setClienteEncontrado(data.cliente || null))
        .catch(() => setClienteEncontrado(null));
    }, 400);
    return () => clearTimeout(timeout);
  }, [clienteRuc]);

  const aplicarDescuentoCliente = () => {
    if (!clienteEncontrado || clienteEncontrado.descuentoEspecial <= 0) return;
    setCarrito(carrito.map(it => ({
      ...it,
      descuentoPorcentaje: Math.max(it.descuentoPorcentaje, clienteEncontrado.descuentoEspecial)
    })));
  };

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
    cargarTurno();
    setSoportaSerial(haySoporteSerial());
    fetch('/api/pos/yappy/estado')
      .then(res => res.ok ? res.json() : { disponible: false })
      .then(data => {
        setYappyDisponible(!!data.disponible);
        if (data.ambiente === 'produccion') setYappyAmbiente('produccion');
      })
      .catch(() => setYappyDisponible(false));

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleConectarImpresora = async () => {
    setErrorHardware('');
    setConectandoImpresora(true);
    try {
      const port = await conectarImpresoraSerial();
      setImpresoraPort(port);
    } catch (err) {
      setErrorHardware(err instanceof Error ? err.message : 'No se pudo conectar la impresora térmica.');
    } finally {
      setConectandoImpresora(false);
    }
  };

  const handleDesconectarImpresora = async () => {
    await desconectarImpresoraSerial(impresoraPort);
    setImpresoraPort(null);
  };

  // Best-effort: si hay una impresora/cajón conectado, se intenta abrir el cajón después de
  // un cobro en efectivo (comportamiento estándar de POS). Nunca bloquea ni rompe el flujo de
  // venta si falla o si no hay hardware conectado.
  const intentarAbrirCajon = async () => {
    if (!impresoraPort) return;
    try {
      await abrirCajonDinero(impresoraPort);
    } catch {
      // Sin hardware real para probar en este entorno; si el comando falla (cajón
      // desconectado, impresora sin puerto de cajón, etc.) simplemente se ignora.
    }
  };

  const cargarTurno = async () => {
    setCargandoTurno(true);
    try {
      const res = await fetch('/api/pos/turno');
      const data = await res.json().catch(() => ({ turno: null }));
      setTurnoActivo(res.ok ? (data.turno || null) : null);
    } catch {
      setTurnoActivo(null);
    } finally {
      setCargandoTurno(false);
    }
  };

  const handleAbrirTurno = async () => {
    setErrorTurno('');
    const monto = Number(montoInicialTurno);
    if (montoInicialTurno === '' || isNaN(monto) || monto < 0) {
      setErrorTurno('Ingresa el monto inicial de efectivo en caja (puede ser 0).');
      return;
    }
    setAbriendoTurno(true);
    try {
      const res = await fetch('/api/pos/turno/abrir', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ montoInicial: monto })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErrorTurno(data.error || 'No se pudo abrir el turno de caja.');
        // Si el servidor dice que ya hay uno abierto, sincronizamos el estado con ese turno.
        if (data.turno) setTurnoActivo(data.turno);
      } else {
        setTurnoActivo(data.turno);
        setMontoInicialTurno('');
      }
    } catch {
      setErrorTurno('Error de conexión al abrir el turno de caja.');
    } finally {
      setAbriendoTurno(false);
    }
  };

  const abrirModalCierreTurno = async () => {
    setShowCierreTurnoModal(true);
    setMontoContadoCierre('');
    try {
      const res = await fetch('/api/pos/turno');
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.resumen) setResumenCierreTurno(data.resumen);
    } catch {
      setResumenCierreTurno(null);
    }
  };

  const handleCerrarTurno = async () => {
    if (montoContadoCierre === '' || isNaN(Number(montoContadoCierre)) || Number(montoContadoCierre) < 0) {
      setErrorTurno('Ingresa el monto de efectivo contado en caja.');
      return;
    }
    setCerrandoTurno(true);
    setErrorTurno('');
    try {
      const res = await fetch('/api/pos/turno/cerrar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ montoContadoCierre: Number(montoContadoCierre) })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErrorTurno(data.error || 'No se pudo cerrar el turno de caja.');
      } else {
        setTurnoRecienCerrado({
          id: data.turno.id,
          montoEsperadoCierre: data.turno.montoEsperadoCierre,
          montoContadoCierre: data.turno.montoContadoCierre,
          diferencia: data.turno.diferencia
        });
        setShowCierreTurnoModal(false);
        setTurnoActivo(null);
      }
    } catch {
      setErrorTurno('Error de conexión al cerrar el turno de caja.');
    } finally {
      setCerrandoTurno(false);
    }
  };

  const cargarProductos = async () => {
    setLoading(true);
    try {
      // El catálogo se scopea a la empresa de la sesión actual en el servidor
      // (getTenantContext), no por un empresaId que mande el cliente.
      const res = await fetch('/api/pos/productos');
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        const lista = (data.items || []).map((p: ProductoPOSRaw) => ({
          id: p.id,
          codigoInterno: p.codigoInterno || 'SKU-01',
          codigoBarras: p.codigoBarras,
          descripcion: p.descripcion || 'Producto',
          precioVenta: Number(p.precioVenta ?? 0),
          codigoTasaItbms: p.codigoTasaItbms || '00',
          stockActual: p.stockActual ?? 0,
          unidadMedida: p.unidadMedida || 'UND',
          descuentoSugerido: Number(p.descuentoSugerido ?? 0)
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

  const mostrarAvisoCarrito = (mensaje: string) => {
    setAvisoCarrito(mensaje);
    setTimeout(() => setAvisoCarrito(''), 4000);
  };

  const agregarAlCarrito = useCallback((p: ProductoPOS) => {
    const esServicio = p.unidadMedida === 'SRV';
    if (!esServicio && p.stockActual <= 0) {
      mostrarAvisoCarrito('Stock agotado para ' + p.descripcion);
      return;
    }
    const existe = carrito.find(it => it.productoId === p.id);
    const itbmsPorcentaje = p.codigoTasaItbms === '01' ? 7 : 0;

    if (existe) {
      if (!esServicio && existe.cantidad + 1 > p.stockActual) {
        mostrarAvisoCarrito('No puedes agregar más del stock disponible (' + p.stockActual + ')');
        return;
      }
      setCarrito(carrito.map(it => it.productoId === p.id ? { ...it, cantidad: it.cantidad + 1 } : it));
    } else {
      setCarrito([...carrito, {
        productoId: p.id,
        descripcion: p.descripcion,
        cantidad: 1,
        precioUnitario: p.precioVenta,
        itbmsPorcentaje,
        // Se sugiere automáticamente el descuento preaprobado del producto/categoría;
        // el vendedor puede cambiarlo manualmente en el carrito.
        descuentoPorcentaje: p.descuentoSugerido || 0
      }]);
    }
  }, [carrito]);

  const modificarDescuento = (productoId: string, valor: number) => {
    const pct = Math.min(100, Math.max(0, isNaN(valor) ? 0 : valor));
    setCarrito(carrito.map(it => it.productoId === productoId ? { ...it, descuentoPorcentaje: pct } : it));
  };

  const modificarCantidad = (productoId: string, delta: number) => {
    setCarrito(carrito.map(it => {
      if (it.productoId === productoId) {
        const p = productos.find(prod => prod.id === productoId);
        const maxStock = p?.unidadMedida === 'SRV' ? Infinity : (p?.stockActual || 999);
        const nueva = it.cantidad + delta;
        if (nueva <= 0) return null;
        if (nueva > maxStock) {
          mostrarAvisoCarrito('Stock máximo excedido');
          return it;
        }
        return { ...it, cantidad: nueva };
      }
      return it;
    }).filter(Boolean) as ItemCarrito[]);
  };

  // Cálculo de totales en tiempo real (el descuento de cada línea se aplica antes del ITBMS)
  const totalDescuento = carrito.reduce((acc, it) => acc + (it.cantidad * it.precioUnitario * (it.descuentoPorcentaje / 100)), 0);
  const subtotal = carrito.reduce((acc, it) => {
    const bruto = it.cantidad * it.precioUnitario;
    const desc = bruto * (it.descuentoPorcentaje / 100);
    return acc + (bruto - desc);
  }, 0);
  const itbmsTotal = carrito.reduce((acc, it) => {
    const bruto = it.cantidad * it.precioUnitario;
    const neto = bruto - (bruto * (it.descuentoPorcentaje / 100));
    return acc + (neto * (it.itbmsPorcentaje / 100));
  }, 0);
  const total = subtotal + itbmsTotal;
  const vuelto = metodoPago === 'EFECTIVO' && efectivoRecibido ? Number(efectivoRecibido) - total : 0;
  const maxDescuentoCarrito = carrito.reduce((max, it) => Math.max(max, it.descuentoPorcentaje), 0);
  const requiereAutorizacion = maxDescuentoCarrito > topeDescuento;

  const handleProcesarVenta = async (autorizacion?: { adminEmail: string; pin: string }) => {
    if (carrito.length === 0) return;
    if (!turnoActivo) {
      setErrorPago('No tienes un turno de caja abierto. Ábrelo antes de cobrar.');
      setShowPagoModal(false);
      return;
    }
    if (metodoPago === 'EFECTIVO' && Number(efectivoRecibido) < total && Number(efectivoRecibido) > 0) {
      setErrorPago('El monto en efectivo recibido no cubre el total de la venta.');
      return;
    }
    if ((metodoPago === 'TARJETA' || metodoPago === 'YAPPY') && !referenciaPago.trim()) {
      setErrorPago('Ingresa el número de referencia/autorización del pago para poder conciliarlo después.');
      return;
    }
    if (tipoDoc === '01' && (!clienteRuc || clienteRuc.length < 5)) {
      setErrorPago('Para Factura Fiscal (01), es obligatorio ingresar el RUC o Cédula del cliente.');
      return;
    }

    // Si el descuento aplicado excede lo que este vendedor puede dar sin permiso, se
    // requiere el PIN de un admin/gerente antes de continuar (o ya haberlo capturado
    // desde el modal de autorización, en cuyo caso `autorizacion` viene informado).
    const useOfflineCheck = !isOnline || contingenciaForzada;
    if (requiereAutorizacion && !autorizacion && !useOfflineCheck) {
      setShowAutorizacionModal(true);
      return;
    }

    setErrorPago('');
    setProcesandoVenta(true);
    const useOffline = !isOnline || contingenciaForzada;

    const payload: VentaPayload = {
      tipoDoc,
      clienteRuc: clienteRuc || (tipoDoc === '01' ? 'CF' : null),
      items: carrito,
      metodoPago,
      subtotal: Number(subtotal.toFixed(2)),
      itbms: Number(itbmsTotal.toFixed(2)),
      total: Number(total.toFixed(2)),
      offline: useOffline
    };
    if (autorizacion) payload.autorizacion = autorizacion;
    if (referenciaPago.trim()) payload.referenciaPago = referenciaPago.trim();

    try {
      if (useOffline) {
        // Almacenar directamente en cola local IndexedDB / localStorage (Modo Contingencia DGI)
        const ventaOffline = {
          id: 'sync-' + Date.now(),
          ...payload,
          turnoCajaId: turnoActivo.id,
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
          referenciaPago: referenciaPago.trim() || undefined,
          efectivoRecibido: Number(efectivoRecibido) || total,
          vuelto: Math.max(0, vuelto),
          contingencia: true,
          mensajeLegal: 'Emitido en Modo Contingencia DGI (Ley 462). Su comprobante será retransmitido al PAC para autorización definitiva dentro de las 72h reglamentarias.'
        });

        if (metodoPago === 'EFECTIVO') intentarAbrirCajon();
        setCarrito([]);
        setReferenciaPago('');
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
          if (data.requiereTurno) {
            // El servidor es la fuente de verdad: si de todos modos rechazó por no tener un
            // turno abierto (se cerró en otra pestaña, expiró, etc.), sincronizamos el estado.
            setTurnoActivo(null);
            setShowPagoModal(false);
            setErrorPago(data.error || 'No tienes un turno de caja abierto. Ábrelo antes de cobrar.');
          } else if (data.requiereAutorizacion) {
            // El servidor es la fuente de verdad: si igual rechazó por falta/invalidez de
            // autorización (tope cambió, PIN incorrecto, etc.), reabrir el modal.
            setShowAutorizacionModal(true);
            setErrorAutorizacion(data.error || 'Se requiere autorización de un admin/gerente para este descuento.');
          } else {
            setErrorPago(data.error || 'Error en la autorización PAC');
          }
        } else {
          // Actualizar stock local con el resultado del backend
          cargarProductos();
          cargarTurno();

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
            referenciaPago: referenciaPago.trim() || undefined,
            efectivoRecibido: Number(efectivoRecibido) || total,
            vuelto: Math.max(0, vuelto),
            cufe: data.cufe || data.venta?.cufe || 'FE019999999000000000000000001000010001111111111',
            cafUrl: data.cafUrl,
            contingencia: false,
            mensajeLegal: 'Autorizado y certificado por PAC DGI. Consulte su factura electrónica por CUFE o código QR en el portal tributario.'
          });

          if (metodoPago === 'EFECTIVO') intentarAbrirCajon();
          setCarrito([]);
          setReferenciaPago('');
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
    setAvisoSync(null);
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
        setAvisoSync({ tipo: 'success', mensaje: data.message || 'Ventas retransmitidas correctamente.' });
        setColaLocal([]);
        localStorage.removeItem('pos_ventas_queue');
        cargarProductos();
      } else {
        setAvisoSync({ tipo: 'error', mensaje: 'Error al retransmitir: ' + (data.error || 'Error desconocido.') });
      }
    } catch {
      setAvisoSync({ tipo: 'error', mensaje: 'Error de conexión con el servidor PAC.' });
    } finally {
      setSincronizando(false);
      setTimeout(() => setAvisoSync(null), 6000);
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

  // Agregar automáticamente al carrito cuando el texto de búsqueda coincide exacto con un
  // código de barras (lectora física que "escribe" el código + Enter, o el escáner de cámara
  // dejando el código en el buscador): evita el tap manual extra en cada venta.
  useEffect(() => {
    const query = buscar.trim();
    if (!query) return;
    const match = productos.find(p =>
      p.codigoBarras && p.codigoBarras.trim() !== '' && p.codigoBarras.toLowerCase() === query.toLowerCase()
    );
    if (!match) return;
    const id = setTimeout(() => {
      agregarAlCarrito(match);
      setBuscar('');
    }, 0);
    return () => clearTimeout(id);
  }, [buscar, productos, agregarAlCarrito]);

  // Genera el QR real del recibo: codifica el link de verificación DGI (cafUrl, que ya trae
  // el CUFE embebido) o, si no hay link, el CUFE crudo. En contingencia no hay CUFE todavía
  // (se retransmitirá dentro de 72h), así que no se genera QR y se explica en su lugar.
  useEffect(() => {
    if (!reciboVenta) {
      setQrReciboDataUrl('');
      return;
    }
    const contenidoQr = reciboVenta.cafUrl || (reciboVenta.cufe ? `CUFE:${reciboVenta.cufe}` : null);
    if (!contenidoQr) {
      setQrReciboDataUrl('');
      return;
    }
    let cancelado = false;
    QRCode.toDataURL(contenidoQr, { margin: 1, width: 220 })
      .then((url) => { if (!cancelado) setQrReciboDataUrl(url); })
      .catch(() => { if (!cancelado) setQrReciboDataUrl(''); });
    return () => { cancelado = true; };
  }, [reciboVenta]);

  // Buscar por código de barras exacto tras un escaneo con la cámara: si hay match en el
  // catálogo cargado, se agrega directo al carrito (misma ruta que un click manual); si no,
  // se deja el código en el buscador para que el cajero vea por qué no encontró nada.
  const handleCodigoBarrasDetectado = (codigo: string) => {
    setShowEscanerModal(false);
    const encontrado = productos.find(p => p.codigoBarras === codigo);
    if (encontrado) {
      agregarAlCarrito(encontrado);
      setAvisoEscaneo(`Agregado: ${encontrado.descripcion}`);
      setBuscar('');
    } else {
      setBuscar(codigo);
      setAvisoEscaneo(`Código "${codigo}" no coincide con ningún producto del catálogo.`);
    }
    setTimeout(() => setAvisoEscaneo(''), 4000);
  };

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
          {/* Turno de Caja Activo */}
          {turnoActivo && (
            <button
              onClick={abrirModalCierreTurno}
              title="Cerrar turno de caja"
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-all border bg-secondary text-foreground border-border hover:border-primary"
            >
              <Wallet className="h-4 w-4 text-primary" />
              Turno abierto (${turnoActivo.montoInicial.toFixed(2)} inicial)
              <LogOut className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
          )}

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

          {/* Impresora térmica / cajón de dinero (Web Serial, solo Chrome/Edge desktop y Android;
              no-op si el navegador no lo soporta o no hay hardware conectado) */}
          {soportaSerial && (
            <button
              onClick={impresoraPort ? handleDesconectarImpresora : handleConectarImpresora}
              disabled={conectandoImpresora}
              title={impresoraPort ? 'Impresora térmica conectada (click para desconectar)' : 'Conectar impresora térmica / cajón de dinero (USB-Serial)'}
              className={`hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-all border ${
                impresoraPort ? 'bg-success-bg text-success border-success/40' : 'bg-secondary text-muted-foreground border-border hover:border-primary'
              }`}
            >
              <Usb className="h-4 w-4" />
              {conectandoImpresora ? 'Conectando...' : impresoraPort ? 'Impresora conectada' : 'Conectar impresora'}
            </button>
          )}

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

      {errorHardware && (
        <div className="px-4 pt-2 text-[11px] font-semibold text-warning bg-warning-bg border-b border-warning/30 py-1.5 text-center">
          {errorHardware}
        </div>
      )}

      {avisoSync && (
        <div className={`px-4 py-1.5 text-[11px] font-semibold text-center border-b ${
          avisoSync.tipo === 'success'
            ? 'text-success bg-success-bg border-success/30'
            : 'text-destructive bg-danger-bg border-destructive/30'
        }`}>
          {avisoSync.mensaje}
        </div>
      )}

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
            <Button
              type="button"
              size="sm"
              onClick={() => setShowEscanerModal(true)}
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs h-9 px-3 shrink-0"
            >
              <ScanLine className="h-4 w-4 mr-1.5" />
              Escanear
            </Button>
          </div>

          {avisoEscaneo && (
            <div className="text-[11px] font-semibold text-info bg-info-bg border border-info/30 rounded px-3 py-2">
              {avisoEscaneo}
            </div>
          )}

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

          {avisoCarrito && (
            <div className="mx-3 mt-3 text-[11px] font-semibold text-warning bg-warning-bg border border-warning/30 rounded px-3 py-2">
              {avisoCarrito}
            </div>
          )}

          {/* Lista de Ítems en Carrito */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2.5 divide-y divide-border">
            {carrito.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground p-6">
                <ShoppingCart className="h-12 w-12 text-muted-foreground/50 mb-2" />
                <p className="text-xs font-medium">El carrito está vacío</p>
                <p className="text-[11px] text-muted-foreground mt-1">Selecciona productos del catálogo para comenzar el cobro</p>
              </div>
            ) : (
              carrito.map((item) => {
                const bruto = item.cantidad * item.precioUnitario;
                const neto = bruto - (bruto * (item.descuentoPorcentaje / 100));
                return (
                <div key={item.productoId} className="pt-2 flex flex-col gap-1.5 text-xs">
                  <div className="flex justify-between items-start font-bold text-foreground">
                    <span className="line-clamp-1">{item.descripcion}</span>
                    <span className="font-mono text-primary flex-shrink-0 ml-2 text-right">
                      {item.descuentoPorcentaje > 0 && (
                        <span className="block text-[10px] text-muted-foreground line-through font-normal">${bruto.toFixed(2)}</span>
                      )}
                      ${neto.toFixed(2)}
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

                  {/* Descuento por línea */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] text-muted-foreground">Descuento:</span>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        min={0}
                        max={100}
                        step={0.5}
                        value={item.descuentoPorcentaje}
                        onChange={(e) => modificarDescuento(item.productoId, parseFloat(e.target.value))}
                        className="w-14 h-6 text-[11px] font-mono text-right bg-secondary border border-border rounded px-1"
                      />
                      <span className="text-[10px] text-muted-foreground">%</span>
                      {item.descuentoPorcentaje > topeDescuento && (
                        <span className="text-[9px] font-bold text-warning bg-warning-bg px-1.5 py-0.5 rounded">Requiere PIN</span>
                      )}
                    </div>
                  </div>
                </div>
                );
              })
            )}
          </div>

          {/* Subtotal, ITBMS y Total Exacto */}
          <div className="p-4 border-t border-border bg-secondary space-y-2">
            {totalDescuento > 0 && (
              <div className="flex justify-between text-xs text-warning font-semibold">
                <span>Descuento aplicado:</span>
                <span className="font-mono">-${totalDescuento.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Subtotal:</span>
              <span className="font-mono text-foreground">${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>ITBMS 7% (Impuesto):</span>
              <span className="font-mono text-foreground">${itbmsTotal.toFixed(2)}</span>
            </div>
            {requiereAutorizacion && (
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-warning bg-warning-bg border border-warning/40 rounded px-2 py-1.5">
                <span>⚠ Este descuento supera tu límite ({topeDescuento}%). Necesitarás el PIN de un admin/gerente para cobrar.</span>
              </div>
            )}
            <div className="flex justify-between text-base font-bold text-foreground pt-2 border-t border-border">
              <span>TOTAL A COBRAR:</span>
              <span className="font-mono text-2xl text-primary">${total.toFixed(2)}</span>
            </div>

            {/* Botón COBRAR Touch */}
            <Button
              onClick={() => {
                if (carrito.length === 0 || !turnoActivo) return;
                setEfectivoRecibido(total.toFixed(2));
                setShowPagoModal(true);
              }}
              disabled={carrito.length === 0 || !turnoActivo}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-black text-base h-12 shadow-premium mt-3 tracking-wider active:scale-[0.98] transition-all"
            >
              <DollarSign className="h-5 w-5 mr-1" />
              {turnoActivo ? `COBRAR $${total.toFixed(2)}` : 'Abre tu turno de caja para cobrar'}
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
                {clienteEncontrado && (
                  <div className="mt-1.5 flex items-center justify-between gap-2 text-[11px] bg-info-bg border border-info/30 rounded px-2 py-1.5">
                    <span className="text-info font-semibold">
                      {clienteEncontrado.razonSocial}
                      {clienteEncontrado.descuentoEspecial > 0 && ` — descuento especial: ${clienteEncontrado.descuentoEspecial}%`}
                    </span>
                    {clienteEncontrado.descuentoEspecial > 0 && (
                      <button
                        type="button"
                        onClick={aplicarDescuentoCliente}
                        className="text-info font-bold underline shrink-0"
                      >
                        Aplicar a todo el carrito
                      </button>
                    )}
                  </div>
                )}
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

              {metodoPago === 'YAPPY' && yappyDisponible && (
                <div className="bg-secondary p-4 rounded-lg border border-primary/30 text-center space-y-3">
                  <p className="text-xs font-bold text-primary">Cobro real con Yappy — ${total.toFixed(2)}</p>
                  <YappyBotonPago
                    ambiente={yappyAmbiente}
                    subtotal={subtotal}
                    itbms={itbmsTotal}
                    total={total}
                    onPagoConfirmado={(orderId) => {
                      setReferenciaPago(orderId);
                      setErrorPago('');
                      // El pago ya fue confirmado server-side (polling contra la notificación
                      // IPN validada); se finaliza la venta con la misma ruta de siempre.
                      handleProcesarVenta();
                    }}
                    onError={(msg) => setErrorPago(msg)}
                  />
                  <p className="text-[10px] text-muted-foreground">
                    El cliente confirma el pago desde su app de Yappy. La venta se registra automáticamente al confirmarse.
                  </p>
                </div>
              )}

              {metodoPago === 'YAPPY' && !yappyDisponible && (
                <div className="bg-secondary p-4 rounded-lg border border-primary/30 text-center space-y-3">
                  <div className="inline-block bg-white p-3 rounded-lg border border-border">
                    <QrCode className="h-24 w-24 text-ink mx-auto" />
                  </div>
                  <p className="text-xs font-bold text-primary">Escanee con la App de Yappy para pagar ${total.toFixed(2)}</p>
                  <p className="text-[11px] text-muted-foreground">Directorio comercial: @ERPPANAMA_POS (o confirmación por webhook)</p>
                  <div className="text-left pt-2 border-t border-border">
                    <label className="font-semibold text-foreground block mb-1">
                      Nº de referencia/autorización de Yappy (*obligatorio):
                    </label>
                    <Input
                      placeholder="Ej. 123456789"
                      value={referenciaPago}
                      onChange={(e) => setReferenciaPago(e.target.value)}
                      className="font-mono"
                    />
                    <p className="text-[10px] text-muted-foreground mt-1">
                      Cobro manual: cobra en la app de Yappy y anota aquí el número de la transacción para conciliar después. Configura tus credenciales de Yappy Comercial en Configuración para activar el cobro automático.
                    </p>
                  </div>
                </div>
              )}

              {metodoPago === 'TARJETA' && (
                <div className="bg-secondary p-4 rounded-lg border border-primary/30 space-y-3">
                  <p className="text-xs font-bold text-primary text-center">Cobre ${total.toFixed(2)} en el datáfono del banco</p>
                  <div>
                    <label className="font-semibold text-foreground block mb-1">
                      Nº de referencia/autorización del datáfono (*obligatorio):
                    </label>
                    <Input
                      placeholder="Ej. AUTH-004821"
                      value={referenciaPago}
                      onChange={(e) => setReferenciaPago(e.target.value)}
                      className="font-mono"
                    />
                    <p className="text-[10px] text-muted-foreground mt-1">
                      No hay integración real con un procesador de pagos todavía: cobra con el datáfono físico y anota aquí el número de autorización del voucher para conciliar después.
                    </p>
                  </div>
                </div>
              )}

              {metodoPago === 'MIXTO' && (
                <div className="bg-secondary p-4 rounded-lg border border-primary/30 space-y-3">
                  <p className="text-xs text-muted-foreground">
                    Combine efectivo con tarjeta/Yappy por fuera del sistema y registre aquí, si aplica, la referencia de la porción no efectiva para conciliarla después.
                  </p>
                  <div>
                    <label className="font-semibold text-foreground block mb-1">Nº de referencia/autorización (opcional):</label>
                    <Input
                      placeholder="Ej. AUTH-004821"
                      value={referenciaPago}
                      onChange={(e) => setReferenciaPago(e.target.value)}
                      className="font-mono"
                    />
                  </div>
                </div>
              )}
            </CardContent>

            <div className="p-4 border-t border-border flex justify-end gap-3 bg-secondary">
              <Button
                type="button"
                variant="outline"
                onClick={() => { setShowPagoModal(false); setReferenciaPago(''); }}
                className="text-xs"
              >
                Cancelar
              </Button>
              <Button
                type="button"
                onClick={() => handleProcesarVenta()}
                disabled={procesandoVenta}
                className="bg-primary hover:bg-primary/90 text-primary-foreground font-black text-xs px-6 shadow-premium"
              >
                {procesandoVenta ? 'Emitiendo PAC...' : `CONFIRMAR COBRO ($${total.toFixed(2)})`}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* MODAL DE AUTORIZACIÓN DE DESCUENTO (PIN de admin/gerente) */}
      {showAutorizacionModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-ink/60 backdrop-blur-sm p-4">
          <Card className="bg-card border-border w-full max-w-sm shadow-premium-hover">
            <CardHeader className="border-b border-border pb-4">
              <CardTitle className="text-base font-bold text-foreground">Autorización requerida</CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                El descuento aplicado ({maxDescuentoCarrito}%) supera tu límite ({topeDescuento}%). Un administrador o gerente debe ingresar su correo y PIN para autorizarlo.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 pt-4 text-xs">
              {errorAutorizacion && (
                <div className="text-destructive bg-danger-bg border border-destructive/30 rounded p-2 text-[11px] font-semibold">
                  {errorAutorizacion}
                </div>
              )}
              <div>
                <label className="font-semibold text-foreground block mb-1">Correo del admin/gerente</label>
                <Input
                  type="email"
                  placeholder="admin@empresa.com"
                  value={adminEmailAutorizacion}
                  onChange={(e) => setAdminEmailAutorizacion(e.target.value)}
                />
              </div>
              <div>
                <label className="font-semibold text-foreground block mb-1">PIN de autorización</label>
                <Input
                  type="password"
                  inputMode="numeric"
                  placeholder="••••"
                  value={pinAutorizacion}
                  onChange={(e) => setPinAutorizacion(e.target.value)}
                />
              </div>
            </CardContent>
            <div className="p-4 border-t border-border flex justify-end gap-3 bg-secondary">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowAutorizacionModal(false);
                  setErrorAutorizacion('');
                  setPinAutorizacion('');
                }}
                className="text-xs"
              >
                Cancelar
              </Button>
              <Button
                type="button"
                disabled={!adminEmailAutorizacion || !pinAutorizacion || procesandoVenta}
                onClick={() => {
                  setShowAutorizacionModal(false);
                  setErrorAutorizacion('');
                  handleProcesarVenta({ adminEmail: adminEmailAutorizacion, pin: pinAutorizacion });
                }}
                className="bg-primary hover:bg-primary/90 text-primary-foreground font-black text-xs px-6"
              >
                Autorizar y Cobrar
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
              {reciboVenta.referenciaPago && (
                <p><strong>Referencia/Autorización:</strong> {reciboVenta.referenciaPago}</p>
              )}
            </div>

            <div className="border-b border-ink pb-2 mb-2">
              <div className="flex justify-between font-bold text-[11px] border-b border-muted-foreground pb-1 mb-1">
                <span>DESCRIPCIÓN</span>
                <span>TOTAL</span>
              </div>
              {reciboVenta.items.map((it, i: number) => (
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

            {/* Código QR real del CUFE (o del link de verificación DGI) generado con `qrcode` */}
            <div className="text-center space-y-2 my-4">
              <div className="inline-block border border-border p-1 bg-white">
                {qrReciboDataUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={qrReciboDataUrl} alt="Código QR de verificación DGI" className="h-28 w-28 mx-auto" width={112} height={112} />
                ) : (
                  <div className="h-28 w-28 mx-auto flex items-center justify-center text-center px-2">
                    <span className="text-[9px] text-muted-foreground leading-tight">
                      QR pendiente: se generará cuando esta venta se retransmita y sea autorizada por el PAC DGI.
                    </span>
                  </div>
                )}
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
              {impresoraPort && (
                <Button
                  variant="outline"
                  onClick={async () => {
                    try {
                      await imprimirReciboEscPos(impresoraPort, reciboVenta);
                    } catch (err) {
                      setErrorHardware(err instanceof Error ? err.message : 'No se pudo imprimir en la impresora térmica conectada.');
                    }
                  }}
                  className="w-full text-xs h-9"
                >
                  <Usb className="h-4 w-4 mr-2" />
                  Imprimir directo (impresora USB/Serial conectada)
                </Button>
              )}
              <Button variant="outline" onClick={() => setReciboVenta(null)} className="w-full text-xs h-9">
                Cerrar / Nueva Venta
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ESCÁNER DE CÓDIGO DE BARRAS (cámara) */}
      {showEscanerModal && (
        <EscanerCodigoBarras
          onDetectado={handleCodigoBarrasDetectado}
          onCerrar={() => setShowEscanerModal(false)}
        />
      )}

      {/* MODAL BLOQUEANTE: APERTURA DE TURNO DE CAJA (no se puede vender sin esto) */}
      {!cargandoTurno && !turnoActivo && !turnoRecienCerrado && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-ink/80 backdrop-blur-sm p-4">
          <Card className="bg-card border-border w-full max-w-sm shadow-premium-hover">
            <CardHeader className="border-b border-border pb-4">
              <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
                <Lock className="h-5 w-5 text-primary" />
                Apertura de turno de caja
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Declara cuánto efectivo tienes en caja antes de empezar a vender. Este monto se usará para calcular lo esperado al cerrar el turno.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 pt-4 text-xs">
              {errorTurno && (
                <div className="text-destructive bg-danger-bg border border-destructive/30 rounded p-2 text-[11px] font-semibold">
                  {errorTurno}
                </div>
              )}
              <div>
                <label className="font-semibold text-foreground block mb-1">Efectivo inicial en caja ($)</label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={montoInicialTurno}
                  onChange={(e) => setMontoInicialTurno(e.target.value)}
                  className="text-lg font-mono font-bold text-primary"
                  autoFocus
                />
              </div>
            </CardContent>
            <div className="p-4 border-t border-border bg-secondary">
              <Button
                type="button"
                onClick={handleAbrirTurno}
                disabled={abriendoTurno}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-black text-xs h-11"
              >
                {abriendoTurno ? 'Abriendo turno...' : 'Abrir turno y empezar a vender'}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* MODAL DE CIERRE DE TURNO DE CAJA (conteo de efectivo y diferencia) */}
      {showCierreTurnoModal && turnoActivo && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-ink/70 backdrop-blur-sm p-4">
          <Card className="bg-card border-border w-full max-w-sm shadow-premium-hover">
            <CardHeader className="border-b border-border pb-4">
              <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
                <Wallet className="h-5 w-5 text-primary" />
                Cierre de turno de caja
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Cuenta el efectivo real en caja. Lo esperado se calcula con el efectivo inicial más las ventas en efectivo de este turno.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 pt-4 text-xs">
              {errorTurno && (
                <div className="text-destructive bg-danger-bg border border-destructive/30 rounded p-2 text-[11px] font-semibold">
                  {errorTurno}
                </div>
              )}
              <div className="bg-secondary rounded-lg border border-border p-3 space-y-1.5">
                <div className="flex justify-between"><span className="text-muted-foreground">Efectivo inicial:</span><span className="font-mono font-bold">${turnoActivo.montoInicial.toFixed(2)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Ventas en efectivo:</span><span className="font-mono font-bold">${(resumenCierreTurno?.totalEfectivoVentas ?? 0).toFixed(2)}</span></div>
                <div className="flex justify-between border-t border-border pt-1.5"><span className="font-semibold text-foreground">Esperado en caja:</span><span className="font-mono font-black text-primary">${(resumenCierreTurno?.montoEsperado ?? turnoActivo.montoInicial).toFixed(2)}</span></div>
              </div>
              <div>
                <label className="font-semibold text-foreground block mb-1">Efectivo contado ($)</label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={montoContadoCierre}
                  onChange={(e) => setMontoContadoCierre(e.target.value)}
                  className="text-lg font-mono font-bold text-primary"
                  autoFocus
                />
              </div>
              {montoContadoCierre !== '' && !isNaN(Number(montoContadoCierre)) && (
                (() => {
                  const esperado = resumenCierreTurno?.montoEsperado ?? turnoActivo.montoInicial;
                  const diferenciaPreview = Number(montoContadoCierre) - esperado;
                  return (
                    <div className={`flex justify-between items-center px-2 py-1.5 rounded text-[11px] font-bold ${
                      diferenciaPreview === 0 ? 'bg-success-bg text-success' : diferenciaPreview > 0 ? 'bg-info-bg text-info' : 'bg-warning-bg text-warning'
                    }`}>
                      <span>{diferenciaPreview === 0 ? 'Cuadra exacto' : diferenciaPreview > 0 ? 'Sobrante:' : 'Faltante:'}</span>
                      <span className="font-mono">${Math.abs(diferenciaPreview).toFixed(2)}</span>
                    </div>
                  );
                })()
              )}
            </CardContent>
            <div className="p-4 border-t border-border flex justify-end gap-3 bg-secondary">
              <Button type="button" variant="outline" onClick={() => setShowCierreTurnoModal(false)} className="text-xs">
                Cancelar
              </Button>
              <Button
                type="button"
                onClick={handleCerrarTurno}
                disabled={cerrandoTurno}
                className="bg-primary hover:bg-primary/90 text-primary-foreground font-black text-xs px-6"
              >
                {cerrandoTurno ? 'Cerrando...' : 'Confirmar cierre'}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* CONFIRMACIÓN DE ARQUEO TRAS CERRAR TURNO */}
      {turnoRecienCerrado && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-ink/80 backdrop-blur-sm p-4">
          <Card className="bg-card border-border w-full max-w-sm shadow-premium-hover">
            <CardHeader className="border-b border-border pb-4">
              <CardTitle className="text-base font-bold text-foreground">Turno cerrado</CardTitle>
              <CardDescription className="text-xs text-muted-foreground">Resultado del arqueo de caja de este turno.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 pt-4 text-xs">
              <div className="flex justify-between"><span className="text-muted-foreground">Esperado:</span><span className="font-mono font-bold">${turnoRecienCerrado.montoEsperadoCierre.toFixed(2)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Contado:</span><span className="font-mono font-bold">${turnoRecienCerrado.montoContadoCierre.toFixed(2)}</span></div>
              <div className={`flex justify-between font-black pt-2 border-t border-border ${
                turnoRecienCerrado.diferencia === 0 ? 'text-success' : turnoRecienCerrado.diferencia > 0 ? 'text-info' : 'text-warning'
              }`}>
                <span>{turnoRecienCerrado.diferencia === 0 ? 'Cuadró exacto' : turnoRecienCerrado.diferencia > 0 ? 'Sobrante' : 'Faltante'}:</span>
                <span className="font-mono">${Math.abs(turnoRecienCerrado.diferencia).toFixed(2)}</span>
              </div>
            </CardContent>
            <div className="p-4 border-t border-border bg-secondary space-y-2">
              {turnoRecienCerrado.id && (
                <a
                  href={`/pos/reporte-z?turnoId=${turnoRecienCerrado.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex w-full items-center justify-center rounded-md border border-border bg-card text-foreground hover:bg-accent font-black text-xs h-10"
                >
                  Ver Reporte Z
                </a>
              )}
              <Button
                type="button"
                onClick={() => { setTurnoRecienCerrado(null); cargarTurno(); }}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-black text-xs h-10"
              >
                Continuar
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
