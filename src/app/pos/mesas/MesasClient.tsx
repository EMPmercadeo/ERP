'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  ChevronDown,
  Clock3,
  RefreshCw,
  Settings2,
  UtensilsCrossed,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';

type Item = {
  productoId: string;
  descripcion: string;
  cantidad: number;
  precioUnitario: number;
  itbmsPorcentaje: number;
  descuentoPorcentaje: number;
};
type Mesa = {
  id: string;
  nombre: string;
  estado: string;
  sesionId: string | null;
  tipo: string | null;
  abiertaAt: string | null;
  salonero: string | null;
};
type Sesion = {
  id: string;
  mesa: string;
  salonero: string;
  tipo: string;
  abiertaAt: string;
  version: number;
  items: Item[];
};
type Producto = {
  id: string;
  descripcion: string;
  precioVenta: number;
  codigoTasaItbms: string;
  stockActual: number;
  unidadMedida: string;
  esElaborado: boolean;
};
type Listado = {
  mesas: Mesa[];
  esAdmin: boolean;
  horaCierreNegocio: string;
  alertas: { id: string; mensaje: string; tipo: string }[];
  cierres: { fecha: string }[];
  historial: {
    id: string;
    mesa: string;
    salonero: string;
    tipo: string;
    abiertaAt: string;
    cerradaAt: string;
    ventaId: string;
    total: number;
    metodoPago: string;
  }[];
};
const money = (n: number) => `$${n.toFixed(2)}`;

export default function MesasClient({ active = true }: { active?: boolean }) {
  const [listado, setListado] = useState<Listado | null>(null);
  const [cargando, setCargando] = useState(true);
  const [mesaId, setMesaId] = useState<string | null>(null);
  const [sesion, setSesion] = useState<Sesion | null>(null);
  const [cargandoDetalle, setCargandoDetalle] = useState(false);
  const [draft, setDraft] = useState<Item[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [turno, setTurno] = useState<{ id: string } | null>(null);
  const [resumenTurno, setResumenTurno] = useState<{ montoEsperado: number } | null>(null);
  const [montoInicial, setMontoInicial] = useState('0');
  const [montoContado, setMontoContado] = useState('');
  const [nombreMesa, setNombreMesa] = useState('');
  const [horaCierre, setHoraCierre] = useState('22:00');
  const [busqueda, setBusqueda] = useState('');
  const [tipo, setTipo] = useState<'normal' | 'reserva' | 'evento'>('normal');
  const [metodoPago, setMetodoPago] = useState<'EFECTIVO' | 'TARJETA' | 'YAPPY' | 'TRANSFERENCIA'>(
    'EFECTIVO'
  );
  const [referenciaPago, setReferenciaPago] = useState('');
  const [tipoDoc, setTipoDoc] = useState<'01' | '02'>('02');
  const [clienteRuc, setClienteRuc] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [errorCarga, setErrorCarga] = useState('');
  const [errorDetalle, setErrorDetalle] = useState('');
  const [ocupado, setOcupado] = useState(false);
  const [mostrarGestion, setMostrarGestion] = useState(false);
  const [filtro, setFiltro] = useState<'todas' | 'libres' | 'atendiendo'>('todas');
  const [mesaPendiente, setMesaPendiente] = useState<Mesa | null>(null);
  const detalleRef = useRef<HTMLElement>(null);
  const detalleSolicitudRef = useRef(0);

  const abrirGestion = () => {
    setMostrarGestion(true);
    window.setTimeout(
      () =>
        document
          .getElementById('gestion-salon')
          ?.scrollIntoView({ behavior: 'smooth', block: 'start' }),
      50
    );
  };

  const cargar = useCallback(async () => {
    try {
      const [m, p, t] = await Promise.all([
        fetch('/api/pos/mesas'),
        fetch('/api/pos/productos'),
        fetch('/api/pos/turno'),
      ]);
      if (!m.ok) {
        setErrorCarga('No se pudieron cargar las mesas. Revisa tu sesión e intenta de nuevo.');
        return;
      }
      const lista = await m.json();
      setErrorCarga('');
      setListado(lista);
      setHoraCierre(lista.horaCierreNegocio);
      if (p.ok) setProductos((await p.json()).items ?? []);
      if (t.ok) {
        const caja = await t.json();
        setTurno(caja.turno ?? null);
        setResumenTurno(caja.resumen ?? null);
      }
    } catch {
      setErrorCarga('No se pudo conectar con el salón. Intenta actualizar.');
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    if (!active) return;
    const timer = setTimeout(() => {
      void cargar();
    }, 0);
    return () => clearTimeout(timer);
  }, [active, cargar]);

  const abrirDetalle = async (mesa: Mesa) => {
    const solicitud = ++detalleSolicitudRef.current;
    setMesaId(mesa.id);
    setSesion(null);
    setDraft([]);
    setMensaje('');
    setErrorDetalle('');
    setCargandoDetalle(!!mesa.sesionId);
    if (window.innerWidth < 1024) {
      window.setTimeout(
        () => detalleRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }),
        50
      );
    }
    if (!mesa.sesionId) return;
    try {
      const res = await fetch(`/api/pos/mesas/${mesa.id}`);
      const data = await res.json();
      if (solicitud !== detalleSolicitudRef.current) return;
      if (!res.ok) {
        setErrorDetalle(data.error ?? 'No se pudo abrir el detalle.');
        return;
      }
      setSesion(data.sesion);
      setDraft(data.sesion.items);
    } catch {
      if (solicitud === detalleSolicitudRef.current)
        setErrorDetalle('No se pudo cargar el pedido de esta mesa.');
    } finally {
      if (solicitud === detalleSolicitudRef.current) setCargandoDetalle(false);
    }
  };

  const enviar = async (url: string, method: 'POST' | 'PATCH', body: object) => {
    setOcupado(true);
    setMensaje('');
    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'No se pudo guardar.');
      await cargar();
      return data;
    } catch (e) {
      setMensaje(e instanceof Error ? e.message : 'Error de conexión.');
      return null;
    } finally {
      setOcupado(false);
    }
  };

  const abrir = async () => {
    if (!mesaId) return;
    const data = await enviar(`/api/pos/mesas/${mesaId}`, 'PATCH', { accion: 'abrir', tipo });
    if (data) {
      const res = await fetch(`/api/pos/mesas/${mesaId}`);
      const detalle = await res.json();
      setSesion(detalle.sesion);
      setDraft([]);
    }
  };

  const ajustar = (productoId: string, delta: number) => {
    setDraft((actual) => {
      const existente = actual.find((i) => i.productoId === productoId);
      if (!existente && delta < 0) return actual;
      const producto = productos.find((p) => p.id === productoId);
      if (!producto) return actual;
      const cantidad = (existente?.cantidad ?? 0) + delta;
      if (
        cantidad > 100 ||
        (producto.unidadMedida !== 'SRV' &&
          !producto.esElaborado &&
          cantidad > producto.stockActual)
      )
        return actual;
      if (existente)
        return actual
          .map((i) => (i.productoId === productoId ? { ...i, cantidad } : i))
          .filter((i) => i.cantidad > 0);
      return [
        ...actual,
        {
          productoId,
          descripcion: producto.descripcion,
          cantidad: 1,
          precioUnitario: producto.precioVenta,
          itbmsPorcentaje:
            producto.codigoTasaItbms === '01'
              ? 7
              : producto.codigoTasaItbms === '02'
                ? 10
                : producto.codigoTasaItbms === '03'
                  ? 15
                  : 0,
          descuentoPorcentaje: 0,
        },
      ];
    });
  };

  const guardar = async () => {
    if (!mesaId || !sesion) return;
    const data = await enviar(`/api/pos/mesas/${mesaId}`, 'PATCH', {
      accion: 'pedido',
      version: sesion.version,
      items: draft.map((i) => ({ productoId: i.productoId, cantidad: i.cantidad })),
    });
    if (data) {
      setSesion({ ...sesion, version: data.version, items: data.items });
      setDraft(data.items);
      setMensaje('Pedido guardado.');
    }
  };

  const sucio =
    JSON.stringify(draft.map((i) => [i.productoId, i.cantidad])) !==
    JSON.stringify((sesion?.items ?? []).map((i) => [i.productoId, i.cantidad]));
  const total = useMemo(
    () =>
      draft.reduce((s, i) => s + i.cantidad * i.precioUnitario * (1 + i.itbmsPorcentaje / 100), 0),
    [draft]
  );
  const seleccionada = listado?.mesas.find((m) => m.id === mesaId);
  const libres = listado?.mesas.filter((m) => m.estado === 'libre').length ?? 0;
  const ocupadas = (listado?.mesas.length ?? 0) - libres;
  const atendiendo = listado?.mesas.filter((m) => m.estado === 'abierta' && m.sesionId).length ?? 0;
  const mesasFiltradas =
    listado?.mesas.filter((m) =>
      filtro === 'libres'
        ? m.estado === 'libre'
        : filtro === 'atendiendo'
          ? m.estado === 'abierta' && !!m.sesionId
          : true
    ) ?? [];

  const cobrar = async () => {
    if (!sesion || !turno || sucio || !sesion.items.length) return;
    if ((metodoPago === 'TARJETA' || metodoPago === 'YAPPY') && !referenciaPago.trim()) {
      setMensaje('Ingresa la referencia del pago.');
      return;
    }
    if (tipoDoc === '01' && clienteRuc.trim().length < 5) {
      setMensaje('La factura requiere el RUC o cédula del cliente.');
      return;
    }
    const data = await enviar('/api/pos/ventas', 'POST', {
      mesaSesionId: sesion.id,
      tipoDoc,
      clienteRuc,
      items: sesion.items,
      metodoPago,
      referenciaPago,
      offline: false,
    });
    if (data) {
      setSesion(null);
      setDraft([]);
      setMesaId(null);
      setMensaje(
        `Mesa cobrada y cerrada. Comprobante ${data.venta?.id ?? ''}. ${data.warning ?? ''}`
      );
    }
  };

  return (
    <div className="mx-auto max-w-[1600px] space-y-4 px-3 pb-10 pt-4 sm:px-5 sm:pt-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="label-caps text-muted-foreground">Restaurante / Servicio en mesa</p>
          <h2 className="text-lg font-semibold tracking-tight">Salón</h2>
          <p className="text-xs text-muted-foreground">
            Elige una mesa para tomar el pedido. Se libera cuando registras el pago.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => void cargar()}
            aria-label="Actualizar salón"
          >
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            <span className="hidden sm:inline">Actualizar</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setMostrarGestion((actual) => !actual)}
            aria-expanded={mostrarGestion}
            aria-controls="gestion-salon"
          >
            <Settings2 className="h-4 w-4" aria-hidden="true" />
            Caja y ajustes
            <ChevronDown
              className={`h-3.5 w-3.5 transition-transform ${mostrarGestion ? 'rotate-180' : ''}`}
              aria-hidden="true"
            />
          </Button>
        </div>
      </div>

      {mensaje && (
        <div role="status" className="rounded-md border border-border bg-card px-3 py-2 text-sm">
          {mensaje}
        </div>
      )}
      {errorCarga && (
        <div
          role="alert"
          className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-destructive/30 bg-danger-bg px-3 py-2 text-sm text-destructive"
        >
          <span>{errorCarga}</span>
          <Button size="sm" variant="outline" onClick={() => void cargar()}>
            Reintentar
          </Button>
        </div>
      )}
      {!!listado?.alertas.length && (
        <section
          aria-label="Alertas operativas"
          className="flex gap-2 rounded-md border border-warning/40 bg-warning-bg p-3 text-sm text-warning"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <div>
            <strong>Atención requerida</strong>
            <ul className="mt-1 space-y-1">
              {listado.alertas.slice(0, 3).map((a) => (
                <li key={a.id}>{a.mensaje}</li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {!cargando && listado && (
        <div
          className={`flex flex-wrap items-center justify-between gap-2 rounded-md border px-3 py-2 text-xs ${turno ? 'border-border bg-card' : 'border-warning/40 bg-warning-bg'}`}
        >
          <div className="flex items-center gap-2">
            <span
              className={`h-2 w-2 rounded-full ${turno ? 'bg-success' : 'bg-warning-dot'}`}
              aria-hidden="true"
            />
            <span className="font-semibold">{turno ? 'Caja abierta' : 'Caja sin turno'}</span>
            <span className="text-muted-foreground">
              {turno
                ? `Efectivo esperado ${money(resumenTurno?.montoEsperado ?? 0)}`
                : 'Abre un turno para atender y cobrar.'}
            </span>
          </div>
          {!turno && (
            <button
              type="button"
              className="font-semibold text-primary hover:underline"
              onClick={abrirGestion}
            >
              Abrir turno
            </button>
          )}
        </div>
      )}

      {(cargando || listado) && (
        <section
          aria-label="Estado del salón"
          className="flex flex-wrap items-end justify-between gap-3 border-b border-border pb-3"
        >
          <div>
            <h3 className="text-sm font-semibold">Mesas</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              <span className="font-semibold tabular-nums text-success">{libres} libres</span>
              <span className="px-2" aria-hidden="true">
                ·
              </span>
              <span className="font-semibold tabular-nums text-foreground">
                {ocupadas} ocupadas
              </span>
              {atendiendo > 0 && <span className="ml-2">· {atendiendo} en atención</span>}
            </p>
          </div>
          <div role="group" aria-label="Filtrar mesas" className="flex gap-1">
            {(
              [
                ['todas', 'Todas'],
                ['libres', 'Libres'],
                ['atendiendo', listado?.esAdmin ? 'En atención' : 'Mis mesas'],
              ] as const
            ).map(([valor, etiqueta]) => (
              <button
                key={valor}
                type="button"
                aria-pressed={filtro === valor}
                onClick={() => setFiltro(valor)}
                className={`h-8 rounded-md px-3 text-xs font-medium transition-colors focus-visible:outline-2 focus-visible:outline-primary ${filtro === valor ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-secondary hover:text-foreground'}`}
              >
                {etiqueta}
              </button>
            ))}
          </div>
        </section>
      )}

      {(cargando || listado) && (
        <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(320px,410px)]">
          <section
            aria-label="Listado de mesas"
            className="grid auto-rows-min grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-4"
          >
            {cargando &&
              Array.from({ length: 6 }, (_, index) => (
                <div
                  key={index}
                  className="h-28 animate-pulse rounded-md border border-border bg-card"
                />
              ))}
            {mesasFiltradas.map((m) => (
              <button
                type="button"
                key={m.id}
                aria-pressed={mesaId === m.id}
                aria-label={`${m.nombre}, ${m.estado === 'libre' ? 'libre' : m.sesionId ? 'en atención' : 'ocupada por otro salonero'}`}
                disabled={m.estado === 'abierta' && !m.sesionId}
                onClick={() => {
                  if (mesaId === m.id) return;
                  if (sucio) setMesaPendiente(m);
                  else void abrirDetalle(m);
                }}
                className={`flex min-h-28 flex-col justify-between rounded-md border p-3 text-left transition-colors focus-visible:outline-2 focus-visible:outline-primary ${mesaId === m.id ? 'border-primary bg-info-bg' : 'border-border bg-card hover:border-primary/50 hover:bg-secondary'} disabled:cursor-not-allowed disabled:bg-secondary disabled:opacity-70`}
              >
                <span className="flex items-start justify-between gap-2">
                  <span className="truncate text-sm font-semibold">{m.nombre}</span>
                  <span
                    className={`mt-1 h-2 w-2 shrink-0 rounded-full ${m.estado === 'libre' ? 'bg-success' : m.sesionId ? 'bg-primary' : 'bg-muted-foreground'}`}
                    aria-hidden="true"
                  />
                </span>
                <span className="block text-xs text-muted-foreground">
                  {m.estado === 'libre'
                    ? 'Disponible'
                    : m.sesionId
                      ? `${m.tipo === 'normal' ? 'En servicio' : m.tipo} · ${m.salonero}`
                      : 'Ocupada'}
                  {m.abiertaAt && m.sesionId && (
                    <span className="mt-1 flex items-center gap-1 tabular-nums">
                      <Clock3 className="h-3 w-3" aria-hidden="true" />
                      {new Date(m.abiertaAt).toLocaleTimeString('es-PA', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  )}
                </span>
              </button>
            ))}
            {!cargando && listado?.mesas.length === 0 && (
              <div className="col-span-full flex min-h-52 flex-col items-center justify-center rounded-md border border-dashed border-border bg-card px-5 py-8 text-center">
                <UtensilsCrossed className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
                <h4 className="mt-3 text-sm font-semibold">El salón aún no tiene mesas</h4>
                <p className="mt-1 max-w-xs text-xs text-muted-foreground">
                  {listado.esAdmin
                    ? 'Agrega la primera mesa para empezar a atender pedidos.'
                    : 'Pide a un administrador que configure las mesas.'}
                </p>
                {listado.esAdmin && (
                  <Button size="sm" className="mt-4" onClick={abrirGestion}>
                    Configurar mesas
                  </Button>
                )}
              </div>
            )}
            {!cargando && !!listado?.mesas.length && mesasFiltradas.length === 0 && (
              <p className="col-span-full rounded-md border border-dashed border-border bg-card p-6 text-center text-xs text-muted-foreground">
                No hay mesas en este filtro.
              </p>
            )}
          </section>

          {!!listado?.mesas.length && (
            <aside
              ref={detalleRef}
              aria-label="Pedido de la mesa"
              className="min-w-0 scroll-mt-4 rounded-md border border-border bg-card p-4 lg:sticky lg:top-4"
            >
              {!seleccionada ? (
                <div className="flex min-h-52 flex-col items-center justify-center text-center">
                  <UtensilsCrossed className="h-7 w-7 text-muted-foreground" aria-hidden="true" />
                  <h3 className="mt-3 text-sm font-semibold">Selecciona una mesa</h3>
                  <p className="mt-1 max-w-52 text-xs text-muted-foreground">
                    Aquí verás el pedido, los productos y el cobro.
                  </p>
                </div>
              ) : cargandoDetalle ? (
                <p className="py-8 text-center text-sm text-muted-foreground">Cargando pedido...</p>
              ) : errorDetalle ? (
                <div className="space-y-3 text-sm">
                  <h3 className="font-semibold">No se pudo mostrar {seleccionada.nombre}</h3>
                  <p className="text-destructive">{errorDetalle}</p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => void abrirDetalle(seleccionada)}
                  >
                    Reintentar
                  </Button>
                </div>
              ) : !sesion ? (
                <div className="space-y-4">
                  <h2 className="text-lg font-semibold">{seleccionada.nombre}</h2>
                  <p className="text-sm text-muted-foreground">
                    Al abrirla quedará asignada a tu usuario.
                  </p>
                  <label className="block text-sm">
                    Tipo de servicio
                    <select
                      className="mt-1 block h-10 w-full rounded-md border border-border bg-background px-2"
                      value={tipo}
                      onChange={(e) => setTipo(e.target.value as typeof tipo)}
                    >
                      <option value="normal">Normal</option>
                      <option value="reserva">Reserva</option>
                      <option value="evento">Evento</option>
                    </select>
                  </label>
                  <Button
                    onClick={() => void abrir()}
                    disabled={ocupado || !turno || seleccionada.estado !== 'libre'}
                    className="w-full"
                  >
                    Abrir mesa
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold">{sesion.mesa}</h3>
                    <p className="text-xs text-muted-foreground">
                      {sesion.tipo} · Abierta por {sesion.salonero} ·{' '}
                      {new Date(sesion.abiertaAt).toLocaleString('es-PA')}
                    </p>
                  </div>
                  <div className="max-h-64 space-y-2 overflow-auto">
                    {draft.map((i) => (
                      <div
                        key={i.productoId}
                        className="flex items-center gap-2 border-b border-border pb-2 text-sm"
                      >
                        <span className="min-w-0 flex-1 truncate">
                          {i.descripcion}
                          <span className="block text-xs text-muted-foreground">
                            {money(i.precioUnitario)} c/u
                          </span>
                        </span>
                        <Button
                          size="sm"
                          variant="outline"
                          aria-label={`Quitar ${i.descripcion}`}
                          onClick={() => ajustar(i.productoId, -1)}
                        >
                          −
                        </Button>
                        <span className="w-5 text-center tabular-nums">{i.cantidad}</span>
                        <Button
                          size="sm"
                          variant="outline"
                          aria-label={`Agregar ${i.descripcion}`}
                          onClick={() => ajustar(i.productoId, 1)}
                        >
                          +
                        </Button>
                      </div>
                    ))}
                    {!draft.length && (
                      <p className="text-sm text-muted-foreground">Pedido vacío.</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="buscarProducto" className="text-sm font-medium">
                      Agregar producto
                    </label>
                    <Input
                      id="buscarProducto"
                      value={busqueda}
                      onChange={(e) => setBusqueda(e.target.value)}
                      placeholder="Buscar en el catálogo"
                    />
                    <div className="max-h-40 space-y-1 overflow-auto">
                      {productos
                        .filter((p) => p.descripcion.toLowerCase().includes(busqueda.toLowerCase()))
                        .slice(0, 30)
                        .map((p) => (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => ajustar(p.id, 1)}
                            className="flex min-h-10 w-full items-center justify-between rounded px-2 text-left text-sm hover:bg-accent focus-visible:outline-2 focus-visible:outline-primary"
                          >
                            <span className="truncate pr-2">{p.descripcion}</span>
                            <span className="shrink-0 tabular-nums">{money(p.precioVenta)}</span>
                          </button>
                        ))}
                    </div>
                  </div>
                  <div className="flex items-center justify-between border-t border-border pt-3 font-semibold">
                    <span>Total estimado</span>
                    <span className="font-mono tabular-nums">{money(total)}</span>
                  </div>
                  <Button
                    disabled={ocupado || !sucio}
                    onClick={() => void guardar()}
                    className="w-full"
                  >
                    Guardar pedido
                  </Button>
                  {sucio && (
                    <p className="text-xs text-warning">Guarda los cambios antes de cobrar.</p>
                  )}
                  <div className="space-y-2 border-t border-border pt-4">
                    <h3 className="font-semibold">Cobrar y cerrar mesa</h3>
                    <select
                      aria-label="Tipo de comprobante"
                      className="h-10 w-full rounded-md border border-border bg-background px-2 text-sm"
                      value={tipoDoc}
                      onChange={(e) => setTipoDoc(e.target.value as typeof tipoDoc)}
                    >
                      <option value="02">Boleta (02)</option>
                      <option value="01">Factura (01)</option>
                    </select>
                    {tipoDoc === '01' && (
                      <Input
                        aria-label="RUC o cédula"
                        placeholder="RUC o cédula del cliente"
                        value={clienteRuc}
                        onChange={(e) => setClienteRuc(e.target.value)}
                      />
                    )}
                    <select
                      aria-label="Método de pago"
                      className="h-10 w-full rounded-md border border-border bg-background px-2 text-sm"
                      value={metodoPago}
                      onChange={(e) => setMetodoPago(e.target.value as typeof metodoPago)}
                    >
                      <option value="EFECTIVO">Efectivo</option>
                      <option value="TARJETA">Tarjeta · referencia manual</option>
                      <option value="YAPPY">Yappy · referencia manual</option>
                      <option value="TRANSFERENCIA">Transferencia · referencia manual</option>
                    </select>
                    {(metodoPago === 'TARJETA' ||
                      metodoPago === 'YAPPY' ||
                      metodoPago === 'TRANSFERENCIA') && (
                      <Input
                        aria-label="Referencia del pago"
                        placeholder="Referencia del pago"
                        value={referenciaPago}
                        onChange={(e) => setReferenciaPago(e.target.value)}
                      />
                    )}
                    <Button
                      disabled={ocupado || !turno || sucio || !sesion.items.length}
                      onClick={() => void cobrar()}
                      className="w-full"
                    >
                      Confirmar pago y cerrar · {money(total)}
                    </Button>
                    <p className="text-xs text-muted-foreground">
                      Confirma solo después de recibir el pago. Se registra la venta; la
                      autorización fiscal puede quedar pendiente del PAC.
                    </p>
                  </div>
                </div>
              )}
            </aside>
          )}
        </div>
      )}

      {mostrarGestion && (
        <section
          id="gestion-salon"
          aria-label="Caja y ajustes del salón"
          className="rounded-md border border-border bg-card p-4"
        >
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold">Caja y ajustes</h3>
              <p className="text-xs text-muted-foreground">Configuración y cierre de turno.</p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setMostrarGestion(false)}>
              Ocultar
            </Button>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <div className="space-y-3 rounded-md border border-border bg-background p-3">
              <div>
                <h4 className="text-sm font-semibold">Turno de caja</h4>
                <p className="text-xs text-muted-foreground">
                  {turno
                    ? `Efectivo esperado: ${money(resumenTurno?.montoEsperado ?? 0)}. Cobra todas las mesas antes de cerrar.`
                    : 'Declara el efectivo inicial para empezar a atender.'}
                </p>
              </div>
              {!turno ? (
                <div className="flex flex-wrap items-end gap-2">
                  <div>
                    <label htmlFor="inicial" className="text-xs font-medium">
                      Efectivo inicial ($)
                    </label>
                    <Input
                      id="inicial"
                      type="number"
                      min="0"
                      step="0.01"
                      value={montoInicial}
                      onChange={(e) => setMontoInicial(e.target.value)}
                      className="mt-1 w-36"
                    />
                  </div>
                  <Button
                    disabled={ocupado || montoInicial === '' || Number(montoInicial) < 0}
                    onClick={async () => {
                      const data = await enviar('/api/pos/turno/abrir', 'POST', {
                        montoInicial: Number(montoInicial),
                      });
                      if (data) setTurno(data.turno);
                    }}
                  >
                    Abrir turno
                  </Button>
                </div>
              ) : (
                <div className="flex flex-wrap items-end gap-2">
                  <div>
                    <label htmlFor="contado" className="text-xs font-medium">
                      Efectivo contado ($)
                    </label>
                    <Input
                      id="contado"
                      type="number"
                      min="0"
                      step="0.01"
                      value={montoContado}
                      onChange={(e) => setMontoContado(e.target.value)}
                      className="mt-1 w-36"
                    />
                  </div>
                  <Button
                    variant="outline"
                    disabled={ocupado || montoContado === '' || Number(montoContado) < 0}
                    onClick={async () => {
                      const data = await enviar('/api/pos/turno/cerrar', 'POST', {
                        montoContadoCierre: Number(montoContado),
                      });
                      if (data) {
                        setMontoContado('');
                        setMensaje(
                          `Turno cerrado. Diferencia de caja: ${money(Number(data.turno?.diferencia ?? 0))}.`
                        );
                      }
                    }}
                  >
                    Cerrar turno
                  </Button>
                </div>
              )}
            </div>
            {listado?.esAdmin && (
              <div className="space-y-3 rounded-md border border-border bg-background p-3">
                <div>
                  <h4 className="text-sm font-semibold">Mesas del salón</h4>
                  <p className="text-xs text-muted-foreground">
                    Pon nombres fáciles de identificar al atender.
                  </p>
                </div>
                <div className="flex flex-wrap items-end gap-2">
                  <div>
                    <label htmlFor="mesaNueva" className="text-xs font-medium">
                      Nombre de la mesa
                    </label>
                    <Input
                      id="mesaNueva"
                      value={nombreMesa}
                      onChange={(e) => setNombreMesa(e.target.value)}
                      placeholder="Ej. Mesa 8"
                      className="mt-1 w-44"
                    />
                  </div>
                  <Button
                    variant="outline"
                    disabled={ocupado || !nombreMesa.trim()}
                    onClick={async () => {
                      if (await enviar('/api/pos/mesas', 'POST', { nombre: nombreMesa }))
                        setNombreMesa('');
                    }}
                  >
                    Agregar mesa
                  </Button>
                </div>
              </div>
            )}
            {listado?.esAdmin && (
              <div className="space-y-3 rounded-md border border-border bg-background p-3">
                <div>
                  <h4 className="text-sm font-semibold">Horario del negocio</h4>
                  <p className="text-xs text-muted-foreground">
                    Se avisa si falta el cierre Z después de esta hora.
                  </p>
                </div>
                <div className="flex flex-wrap items-end gap-2">
                  <div>
                    <label htmlFor="horaCierre" className="text-xs font-medium">
                      Hora de cierre · Panamá
                    </label>
                    <Input
                      id="horaCierre"
                      type="time"
                      value={horaCierre}
                      onChange={(e) => setHoraCierre(e.target.value)}
                      className="mt-1 w-36"
                    />
                  </div>
                  <Button
                    variant="outline"
                    disabled={ocupado || horaCierre === listado.horaCierreNegocio}
                    onClick={async () => {
                      await enviar('/api/pos/configuracion-cierre', 'PATCH', { hora: horaCierre });
                    }}
                  >
                    Guardar hora
                  </Button>
                </div>
              </div>
            )}
          </div>
        </section>
      )}
      {listado?.esAdmin && listado.historial.length > 0 && (
        <section className="rounded-md border border-border bg-card p-4">
          <h2 className="font-semibold">Mesas cobradas recientemente</h2>
          <div className="mt-2 space-y-2 sm:hidden">
            {listado.historial.map((s) => (
              <div key={s.id} className="rounded border border-border p-3 text-sm">
                <div className="flex justify-between gap-2 font-medium">
                  <span>{s.mesa}</span>
                  <span className="tabular-nums">{money(s.total)}</span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {s.salonero} · {s.metodoPago} · {new Date(s.cerradaAt).toLocaleString('es-PA')}
                </p>
              </div>
            ))}
          </div>
          <div className="mt-2 hidden overflow-x-auto sm:block">
            <table className="w-full min-w-[550px] text-left text-sm">
              <thead>
                <tr className="border-b border-border text-muted-foreground">
                  <th className="py-2">Mesa</th>
                  <th>Salonero</th>
                  <th>Cierre</th>
                  <th>Método</th>
                  <th className="text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {listado.historial.map((s) => (
                  <tr key={s.id} className="border-b border-border last:border-0">
                    <td className="py-2">{s.mesa}</td>
                    <td>{s.salonero}</td>
                    <td>{new Date(s.cerradaAt).toLocaleString('es-PA')}</td>
                    <td>{s.metodoPago}</td>
                    <td className="text-right tabular-nums">{money(s.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
      <ConfirmDialog
        open={!!mesaPendiente}
        onOpenChange={(open) => {
          if (!open) setMesaPendiente(null);
        }}
        title="Hay cambios sin guardar"
        description="Si cambias de mesa, perderás los cambios del pedido actual."
        confirmLabel="Cambiar de mesa"
        onConfirm={() => {
          const siguiente = mesaPendiente;
          setMesaPendiente(null);
          if (siguiente) void abrirDetalle(siguiente);
        }}
      />
    </div>
  );
}
