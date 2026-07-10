import QRCode from 'qrcode';

type Money = number | { toNumber(): number };

function n(v: Money): number {
  return typeof v === 'number' ? v : v.toNumber();
}

function money(v: Money): string {
  return `$${n(v).toFixed(2)}`;
}

function esc(s: string | null | undefined): string {
  if (!s) return '';
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

const TASA_LABEL: Record<string, string> = {
  '00': 'Exento',
  '01': '7%',
  '02': '10%',
  '03': '15%',
};

// Vocabulario en español ya establecido en toda la app (ver DgiStatus en status-badge.tsx).
// Un documento que nunca fue realmente timbrado por un PAC NO debe mostrar CUFE/QR — el PDF
// debe reflejar honestamente el estado real, igual que el badge en la pantalla de la factura.
const ESTADO_INFO: Record<string, { label: string; bg: string; fg: string; detail: string }> = {
  aceptada: { label: 'Factura Electrónica Autorizada', bg: '#e9f8f1', fg: '#15a378', detail: 'Documento fiscal válido, autorizado por la Dirección General de Ingresos (DGI) de Panamá.' },
  pendiente: { label: 'Pendiente de Autorización DGI', bg: '#fcf2db', fg: '#e0901f', detail: 'Este documento fue enviado a la DGI y está a la espera de respuesta. Aún no es válido como factura fiscal.' },
  procesando: { label: 'Procesando ante la DGI', bg: '#edf2fe', fg: '#4178e6', detail: 'Este documento está siendo procesado por el proveedor autorizado (PAC). Aún no es válido como factura fiscal.' },
  rechazada: { label: 'Rechazada por la DGI', bg: '#fdeeec', fg: '#ec6a64', detail: 'La DGI rechazó este documento. No es válido como factura fiscal hasta ser corregido y reenviado.' },
  anulada: { label: 'Anulada', bg: '#F3F4F6', fg: '#2D3D53', detail: 'Este documento fue anulado y no tiene efecto fiscal.' },
  borrador: { label: 'Borrador', bg: '#F3F4F6', fg: '#2D3D53', detail: 'Documento en borrador, aún no emitido. No es válido como factura fiscal.' },
  local: { label: 'Documento Local (sin DGI)', bg: '#F3F4F6', fg: '#2D3D53', detail: 'Esta empresa aún no tiene facturación electrónica activa ante la DGI. Este documento es un comprobante interno, no una factura electrónica fiscal.' },
};

export interface InvoicePdfEmpresa {
  razonSocial: string;
  nombreComercial?: string | null;
  ruc: string;
  dv: string;
  direccion: string;
  telefono?: string | null;
  email?: string | null;
  logo?: string | null;
}

export interface InvoicePdfCliente {
  razonSocial: string;
  ruc: string;
  dv?: string | null;
  direccion?: string | null;
  email?: string | null;
  telefono?: string | null;
  condicionPago?: string | null;
}

export interface InvoicePdfItem {
  descripcion: string;
  cantidad: Money;
  precioUnitario: Money;
  descuento: Money;
  codigoTasaItbms: string;
  montoItbms: Money;
  montoTotal: Money;
}

export interface InvoicePdfFactura {
  numeroCompleto: string;
  tipoDocumento: string;
  fechaEmision: Date;
  fechaVencimiento?: Date | null;
  subtotal: Money;
  totalDescuento: Money;
  totalItbms: Money;
  totalNeto: Money;
  totalPagado: Money;
  saldoPendiente: Money;
  estadoDgi: string;
  cufe?: string | null;
  qrContent?: string | null;
  protocoloAutorizacion?: string | null;
  fechaAutorizacionDGI?: Date | null;
  errorDgi?: string | null;
  motivoAnulacionDGI?: string | null;
  sucursalNombre?: string | null;
  creadorNombre?: string | null;
  items: InvoicePdfItem[];
}

export async function buildInvoicePdfHtml(
  empresa: InvoicePdfEmpresa,
  cliente: InvoicePdfCliente,
  factura: InvoicePdfFactura
): Promise<string> {
  const estado = ESTADO_INFO[factura.estadoDgi] || ESTADO_INFO.local;
  const timbrada = factura.estadoDgi === 'aceptada' && !!factura.cufe;

  let qrImg = '';
  if (timbrada && factura.qrContent) {
    try {
      qrImg = await QRCode.toDataURL(factura.qrContent, { margin: 1, width: 140, color: { dark: '#073674', light: '#FFFFFF' } });
    } catch {
      qrImg = '';
    }
  }

  // Desglose de ITBMS por tasa (7% / 10% / 15% / Exento) — formato habitual en facturas
  // fiscales panameñas, en vez de un solo total de impuesto sin detalle.
  const desglosePorTasa = new Map<string, number>();
  for (const item of factura.items) {
    const actual = desglosePorTasa.get(item.codigoTasaItbms) || 0;
    desglosePorTasa.set(item.codigoTasaItbms, actual + n(item.montoItbms));
  }

  const fecha = (d?: Date | null) => (d ? new Date(d).toLocaleDateString('es-PA', { year: 'numeric', month: 'long', day: 'numeric' }) : '—');

  return `
<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<title>${esc(factura.numeroCompleto)}</title>
<style>
  * { box-sizing: border-box; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
    color: #172436;
    margin: 0;
    padding: 40px 48px;
    font-size: 13px;
    line-height: 1.5;
  }
  .mono { font-family: 'Courier New', Courier, monospace; }
  .top {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    border-bottom: 3px solid #073674;
    padding-bottom: 20px;
    margin-bottom: 24px;
  }
  .company { display: flex; align-items: center; gap: 14px; max-width: 60%; }
  .company img { max-height: 56px; max-width: 160px; object-fit: contain; }
  .company-name { font-size: 18px; font-weight: 700; color: #073674; }
  .company-meta { font-size: 11.5px; color: #2D3D53; margin-top: 3px; }
  .doc-title { text-align: right; }
  .doc-title .label { font-size: 20px; font-weight: 700; color: #073674; text-transform: uppercase; letter-spacing: 0.5px; }
  .doc-title .num { font-size: 15px; font-weight: 600; margin-top: 2px; }
  .doc-title .date { font-size: 11.5px; color: #2D3D53; margin-top: 4px; }

  .grid2 { display: flex; gap: 24px; margin-bottom: 24px; }
  .box { flex: 1; background: #F3F4F6; border-radius: 8px; padding: 16px 18px; }
  .box h4 { margin: 0 0 8px; font-size: 10.5px; text-transform: uppercase; letter-spacing: 0.5px; color: #2D3D53; font-weight: 700; }
  .box .name { font-size: 14px; font-weight: 700; color: #172436; margin-bottom: 4px; }
  .box .line { font-size: 12px; color: #2D3D53; margin-top: 2px; }

  table.items { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
  table.items thead th {
    background: #073674; color: #FFFFFF; text-align: left; font-size: 10.5px;
    text-transform: uppercase; letter-spacing: 0.4px; padding: 10px 12px; font-weight: 600;
  }
  table.items thead th.right { text-align: right; }
  table.items tbody td { padding: 9px 12px; border-bottom: 1px solid #DEE4ED; font-size: 12.5px; vertical-align: top; }
  table.items tbody td.right { text-align: right; }
  table.items tbody tr:nth-child(even) { background: #FAFBFC; }

  .bottom { display: flex; justify-content: space-between; gap: 24px; }
  .dgi-block { flex: 1.3; }
  .dgi-banner { border-radius: 8px; padding: 14px 16px; }
  .dgi-banner .status-label { font-weight: 700; font-size: 13px; margin-bottom: 4px; }
  .dgi-banner .status-detail { font-size: 11px; opacity: 0.9; }
  .dgi-cufe { margin-top: 10px; font-size: 10.5px; word-break: break-all; background: #FFFFFF; border-radius: 6px; padding: 8px 10px; border: 1px solid #DEE4ED; }
  .dgi-extra { font-size: 11px; color: #2D3D53; margin-top: 8px; }
  .qr-wrap { display: flex; align-items: center; gap: 14px; margin-top: 12px; }
  .qr-wrap img { border: 1px solid #DEE4ED; border-radius: 6px; }

  .totals { flex: 1; }
  .totals table { width: 100%; border-collapse: collapse; }
  .totals td { padding: 6px 0; font-size: 12.5px; }
  .totals td.label { color: #2D3D53; }
  .totals td.val { text-align: right; font-weight: 600; }
  .totals tr.grand td { border-top: 2px solid #073674; padding-top: 10px; font-size: 16px; font-weight: 700; color: #073674; }
  .totals tr.saldo td { font-weight: 700; color: ${n(factura.saldoPendiente) > 0 ? '#ec6a64' : '#15a378'}; }
  .itbms-detail { font-size: 10.5px; color: #2D3D53; margin-top: 2px; }

  .footer { margin-top: 36px; padding-top: 14px; border-top: 1px solid #DEE4ED; font-size: 10px; color: #2D3D53; text-align: center; }
</style>
</head>
<body>

  <div class="top">
    <div class="company">
      ${empresa.logo ? `<img src="${esc(empresa.logo)}" alt="logo" />` : ''}
      <div>
        <div class="company-name">${esc(empresa.nombreComercial || empresa.razonSocial)}</div>
        <div class="company-meta">
          RUC: ${esc(empresa.ruc)}-${esc(empresa.dv)}<br>
          ${esc(empresa.direccion)}<br>
          ${[empresa.telefono, empresa.email].filter(Boolean).map(esc).join(' &nbsp;·&nbsp; ')}
        </div>
      </div>
    </div>
    <div class="doc-title">
      <div class="label">${factura.tipoDocumento === 'FE' ? 'Factura' : esc(factura.tipoDocumento)}</div>
      <div class="num mono">${esc(factura.numeroCompleto)}</div>
      <div class="date">Emisión: ${fecha(factura.fechaEmision)}</div>
      ${factura.fechaVencimiento ? `<div class="date">Vencimiento: ${fecha(factura.fechaVencimiento)}</div>` : ''}
    </div>
  </div>

  <div class="grid2">
    <div class="box">
      <h4>Facturar a</h4>
      <div class="name">${esc(cliente.razonSocial)}</div>
      <div class="line">RUC: ${esc(cliente.ruc)}${cliente.dv ? '-' + esc(cliente.dv) : ''}</div>
      ${cliente.direccion ? `<div class="line">${esc(cliente.direccion)}</div>` : ''}
      ${[cliente.telefono, cliente.email].filter(Boolean).length ? `<div class="line">${[cliente.telefono, cliente.email].filter(Boolean).map(esc).join(' &nbsp;·&nbsp; ')}</div>` : ''}
    </div>
    <div class="box">
      <h4>Detalles</h4>
      <div class="line">Condición de pago: <strong>${esc(cliente.condicionPago || 'Contado')}</strong></div>
      ${factura.sucursalNombre ? `<div class="line">Sucursal: ${esc(factura.sucursalNombre)}</div>` : ''}
      ${factura.creadorNombre ? `<div class="line">Emitida por: ${esc(factura.creadorNombre)}</div>` : ''}
    </div>
  </div>

  <table class="items">
    <thead>
      <tr>
        <th style="width:45%">Descripción</th>
        <th class="right" style="width:10%">Cant.</th>
        <th class="right" style="width:13%">Precio Unit.</th>
        <th class="right" style="width:10%">Dscto.</th>
        <th class="right" style="width:10%">ITBMS</th>
        <th class="right" style="width:12%">Total</th>
      </tr>
    </thead>
    <tbody>
      ${factura.items.map(item => `
        <tr>
          <td>${esc(item.descripcion)}</td>
          <td class="right">${n(item.cantidad)}</td>
          <td class="right">${money(item.precioUnitario)}</td>
          <td class="right">${n(item.descuento) > 0 ? money(item.descuento) : '—'}</td>
          <td class="right">${TASA_LABEL[item.codigoTasaItbms] || item.codigoTasaItbms}</td>
          <td class="right">${money(item.montoTotal)}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <div class="bottom">
    <div class="dgi-block">
      <div class="dgi-banner" style="background:${estado.bg}; color:${estado.fg};">
        <div class="status-label">${estado.label}</div>
        <div class="status-detail">${estado.detail}</div>
        ${factura.estadoDgi === 'rechazada' && factura.errorDgi ? `<div class="dgi-extra">Motivo: ${esc(factura.errorDgi)}</div>` : ''}
        ${factura.estadoDgi === 'anulada' && factura.motivoAnulacionDGI ? `<div class="dgi-extra">Motivo de anulación: ${esc(factura.motivoAnulacionDGI)}</div>` : ''}
      </div>
      ${timbrada ? `
        <div class="dgi-cufe mono">CUFE: ${esc(factura.cufe)}</div>
        <div class="qr-wrap">
          ${qrImg ? `<img src="${qrImg}" width="90" height="90" alt="QR DGI" />` : ''}
          <div class="itbms-detail">
            ${factura.protocoloAutorizacion ? `Protocolo de autorización: ${esc(factura.protocoloAutorizacion)}<br>` : ''}
            ${factura.fechaAutorizacionDGI ? `Autorizada el: ${fecha(factura.fechaAutorizacionDGI)}` : ''}
          </div>
        </div>
      ` : ''}
    </div>
    <div class="totals">
      <table>
        <tr><td class="label">Subtotal</td><td class="val">${money(factura.subtotal)}</td></tr>
        ${n(factura.totalDescuento) > 0 ? `<tr><td class="label">Descuento</td><td class="val">-${money(factura.totalDescuento)}</td></tr>` : ''}
        <tr>
          <td class="label">
            ITBMS
            ${Array.from(desglosePorTasa.entries()).filter(([, v]) => v > 0).map(([tasa]) =>
              `<div class="itbms-detail">${TASA_LABEL[tasa] || tasa}</div>`
            ).join('')}
          </td>
          <td class="val">
            ${money(factura.totalItbms)}
            ${Array.from(desglosePorTasa.entries()).filter(([, v]) => v > 0).map(([, v]) =>
              `<div class="itbms-detail">${money(v)}</div>`
            ).join('')}
          </td>
        </tr>
        <tr class="grand"><td>Total</td><td class="val">${money(factura.totalNeto)}</td></tr>
        ${n(factura.totalPagado) > 0 ? `<tr><td class="label">Pagado</td><td class="val">${money(factura.totalPagado)}</td></tr>` : ''}
        <tr class="saldo"><td class="label">Saldo pendiente</td><td class="val">${money(factura.saldoPendiente)}</td></tr>
      </table>
    </div>
  </div>

  <div class="footer">
    Documento generado el ${new Date().toLocaleString('es-PA')} · ${esc(empresa.razonSocial)}
  </div>

</body>
</html>
`;
}
