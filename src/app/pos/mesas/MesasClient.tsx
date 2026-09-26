'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

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

export default function MesasClient() {
  const [listado, setListado] = useState<Listado | null>(null);
  const [mesaId, setMesaId] = useState<string | null>(null);
  const [sesion, setSesion] = useState<Sesion | null>(null);
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
  const [ocupado, setOcupado] = useState(false);

  const cargar = useCallback(async () => {
    const [m, p, t] = await Promise.all([
      fetch('/api/pos/mesas'),
      fetch('/api/pos/productos'),
      fetch('/api/pos/turno'),
    ]);
    if (!m.ok) {
      setMensaje('No se pudieron cargar las mesas. Revisa tu sesión.');
      return;
    }
    const lista = await m.json();
    setListado(lista);
    setHoraCierre(lista.horaCierreNegocio);
    if (p.ok) setProductos((await p.json()).items ?? []);
    if (t.ok) {
      const caja = await t.json();
      setTurno(caja.turno ?? null);
      setResumenTurno(caja.resumen ?? null);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      void cargar();
    }, 0);
    return () => clearTimeout(timer);
  }, [cargar]);

  const abrirDetalle = async (mesa: Mesa) => {
    setMesaId(mesa.id);
    setSesion(null);
    setDraft([]);
    setMensaje('');
    if (!mesa.sesionId) return;
    const res = await fetch(`/api/pos/mesas/${mesa.id}`);
    const data = await res.json();
    if (!res.ok) {
      setMensaje(data.error ?? 'No se pudo abrir el detalle.');
      return;
    }
    setSesion(data.sesion);
    setDraft(data.sesion.items);
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
    <main className="mx-auto max-w-7xl space-y-5 px-3 py-5 sm:px-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs text-muted-foreground">Restaurante · servicio en mesa</p>
          <h1 className="text-2xl font-semibold tracking-tight">Mesas</h1>
          <p className="text-sm text-muted-foreground">
            Abre la mesa, guarda el pedido y ciérrala al registrar el pago.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => void cargar()}>
            Actualizar
          </Button>
          {listado?.esAdmin && (
            <Button asChild variant="outline">
              <Link href="/pos">Punto de venta</Link>
            </Button>
          )}
          {listado?.esAdmin && (
            <Button asChild variant="outline">
              <Link href="/pos/reporte-z">Cierre Z diario</Link>
            </Button>
          )}
        </div>
      </header>

      {mensaje && (
        <div role="status" className="rounded-md border border-border bg-card px-3 py-2 text-sm">
          {mensaje}
        </div>
      )}
      {!!listado?.alertas.length && (
        <section
          aria-label="Alertas operativas"
          className="rounded-md border border-warning/40 bg-warning-bg p-3 text-sm"
        >
          <strong>Alertas</strong>
          <ul className="mt-1 list-disc pl-5">
            {listado.alertas.slice(0, 3).map((a) => (
              <li key={a.id}>{a.mensaje}</li>
            ))}
          </ul>
        </section>
      )}
      {!turno && (
        <section className="flex flex-wrap items-end gap-3 rounded-md border border-border bg-card p-4">
          <div>
            <p className="font-medium">Abre tu turno antes de cobrar</p>
            <label htmlFor="inicial" className="text-xs text-muted-foreground">
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
            disabled={ocupado}
            onClick={async () => {
              const data = await enviar('/api/pos/turno/abrir', 'POST', {
                montoInicial: Number(montoInicial),
              });
              if (data) setTurno(data.turno);
            }}
          >
            Abrir turno
          </Button>
        </section>
      )}
      {turno && (
        <section className="flex flex-wrap items-end gap-3 rounded-md border border-border bg-card p-3">
          <div className="flex-1">
            <p className="text-sm font-medium">Turno de caja abierto</p>
            <p className="text-xs text-muted-foreground">
              Efectivo esperado: {money(resumenTurno?.montoEsperado ?? 0)}. Cobra todas tus mesas
              antes de cerrar.
            </p>
          </div>
          <div>
            <label htmlFor="contado" className="text-xs text-muted-foreground">
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
        </section>
      )}

      {listado?.esAdmin && (
        <section className="flex flex-wrap items-end gap-3 rounded-md border border-border bg-card p-3">
          <div>
            <label htmlFor="mesaNueva" className="text-sm font-medium">
              Agregar mesa
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
              if (await enviar('/api/pos/mesas', 'POST', { nombre: nombreMesa })) setNombreMesa('');
            }}
          >
            Agregar
          </Button>
          <div className="sm:ml-auto">
            <label htmlFor="horaCierre" className="text-sm font-medium">
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
        </section>
      )}

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(320px,400px)]">
        <section
          aria-label="Listado de mesas"
          className="grid auto-rows-min grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-4"
        >
          {listado?.mesas.map((m) => (
            <button
              type="button"
              key={m.id}
              disabled={m.estado === 'abierta' && !m.sesionId}
              onClick={() => void abrirDetalle(m)}
              className={`min-h-24 rounded-md border p-3 text-left transition-colors focus-visible:outline-2 focus-visible:outline-primary ${mesaId === m.id ? 'border-primary bg-accent' : 'border-border bg-card hover:border-primary/50'} disabled:opacity-60`}
            >
              <span className="block truncate font-semibold">{m.nombre}</span>
              <span className="text-xs text-muted-foreground">
                {m.estado === 'libre'
                  ? 'Libre'
                  : m.sesionId
                    ? `${m.tipo} · ${m.salonero}`
                    : 'Ocupada'}
              </span>
            </button>
          ))}
          {listado?.mesas.length === 0 && (
            <p className="col-span-full rounded-md border border-dashed p-6 text-sm text-muted-foreground">
              Aún no hay mesas. El administrador puede agregarlas arriba.
            </p>
          )}
        </section>

        <aside className="min-w-0 rounded-md border border-border bg-card p-4">
          {!seleccionada ? (
            <p className="text-sm text-muted-foreground">Selecciona una mesa para atenderla.</p>
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
                <h2 className="text-lg font-semibold">{sesion.mesa}</h2>
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
                {!draft.length && <p className="text-sm text-muted-foreground">Pedido vacío.</p>}
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
                <span className="tabular-nums">{money(total)}</span>
              </div>
              <Button
                disabled={ocupado || !sucio}
                onClick={() => void guardar()}
                className="w-full"
              >
                Guardar pedido
              </Button>
              {sucio && <p className="text-xs text-warning">Guarda los cambios antes de cobrar.</p>}
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
                  Confirma solo después de recibir el pago. Se registra la venta; la autorización
                  fiscal puede quedar pendiente del PAC.
                </p>
              </div>
            </div>
          )}
        </aside>
      </div>
      {listado?.esAdmin && (
        <section className="rounded-md border border-border bg-card p-4">
          <h2 className="font-semibold">Mesas cobradas recientemente</h2>
          {!listado.historial.length && (
            <p className="pt-3 text-sm text-muted-foreground">Todavía no hay mesas cobradas.</p>
          )}
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
    </main>
  );
}
