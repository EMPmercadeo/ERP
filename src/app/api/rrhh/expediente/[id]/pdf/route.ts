import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import puppeteer from 'puppeteer';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const empleado = await prisma.empleado.findUnique({
      where: { id },
      include: {
        empresa: true,
        actas: { orderBy: { fechaHecho: 'asc' } }
      }
    });

    if (!empleado) {
      return NextResponse.json({ error: 'Colaborador no encontrado' }, { status: 404 });
    }

    // Generamos estructura formateada y lista para renderizado probatorio en juzgado / MITRADEL
    const htmlReporte = `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <title>Expediente Laboral - ${empleado.nombre} (${empleado.cedula})</title>
        <style>
          body { font-family: 'Arial', sans-serif; color: #111; margin: 40px; line-height: 1.5; }
          .header { border-bottom: 2px solid #000; padding-bottom: 15px; margin-bottom: 25px; }
          .title { font-size: 22px; font-weight: bold; text-transform: uppercase; }
          .meta { font-size: 14px; margin-top: 10px; }
          .acta-card { border: 1px solid #ccc; padding: 20px; margin-bottom: 20px; border-radius: 4px; page-break-inside: avoid; }
          .acta-header { display: flex; justify-content: space-between; font-weight: bold; border-bottom: 1px solid #eee; padding-bottom: 8px; margin-bottom: 12px; }
          .badge { padding: 4px 8px; font-size: 11px; text-transform: uppercase; border-radius: 3px; font-weight: bold; }
          .badge-verbal { background: #fff3cd; color: #856404; }
          .badge-escrita { background: #ffeeba; color: #856404; }
          .badge-memo { background: #d4edda; color: #155724; }
          .badge-suspension { background: #f8d7da; color: #721c24; }
          .footer { margin-top: 50px; font-size: 12px; border-top: 1px solid #ccc; padding-top: 15px; color: #666; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="title">EXPEDIENTE DISCIPLINARIO Y PROBATORIO (MITRADEL)</div>
          <div class="meta">
            <strong>Empresa:</strong> ${empleado.empresa?.razonSocial || empleado.empresa?.nombreComercial || 'Empresa'} (RUC: ${empleado.empresa?.ruc || 'N/A'})<br>
            <strong>Colaborador:</strong> ${empleado.nombre} &nbsp;|&nbsp; <strong>Cédula:</strong> ${empleado.cedula}<br>
            <strong>Cargo:</strong> ${empleado.cargo} &nbsp;|&nbsp; <strong>Tipo Contrato:</strong> ${empleado.tipoContrato}<br>
            <strong>Fecha de Ingreso:</strong> ${empleado.fechaIngreso.toLocaleDateString('es-PA')} &nbsp;|&nbsp; 
            <strong>Estado:</strong> ${empleado.activo ? 'ACTIVO' : 'BAJA (' + (empleado.fechaSalida ? empleado.fechaSalida.toLocaleDateString('es-PA') : 'N/A') + ')'}
          </div>
        </div>

        <h3>HISTORIAL CRONOLÓGICO DE ACTAS (${empleado.actas.length} REGISTROS)</h3>

        ${empleado.actas.length === 0 ? '<p>No existen sanciones ni llamados de atención registrados para este colaborador.</p>' : ''}

        ${empleado.actas.map((acta, index) => `
          <div class="acta-card">
            <div class="acta-header">
              <span>ACTA #${index + 1}: ${acta.falta}</span>
              <span class="badge badge-${acta.tipo.split('_')[1]?.toLowerCase() || 'escrita'}">${acta.tipo.replace('_', ' ')}</span>
            </div>
            <p><strong>Fecha del Hecho:</strong> ${acta.fechaHecho.toLocaleDateString('es-PA')}</p>
            <p><strong>Descripción de la Falta:</strong><br>${acta.descripcion}</p>
            <p><strong>Emitida por:</strong> ${acta.emitidaPor}</p>
            ${acta.evidenciaUrl ? `<p><strong>Evidencia Adjunta:</strong> <a href="${acta.evidenciaUrl}" target="_blank">Ver Documento/Respaldo</a></p>` : ''}
            <div style="margin-top: 15px; padding: 10px; background: #f9f9f9; border-left: 3px solid ${acta.acuseEmpleado ? '#28a745' : '#dc3545'};">
              <strong>Estado de Acuse (Art. 213 Código de Trabajo):</strong><br>
              ${acta.acuseEmpleado 
                ? `✔ RECIBIDO Y FIRMADO EL ${acta.fechaAcuse ? acta.fechaAcuse.toLocaleDateString('es-PA') + ' ' + acta.fechaAcuse.toLocaleTimeString('es-PA') : 'N/A'} (Firma electrónica/digital con trazabilidad de IP del colaborador)` 
                : '✘ PENDIENTE DE ACUSE O NEGATIVA A FIRMAR (Se sugiere adjuntar constancia de 2 testigos ante negativa)'}
            </div>
          </div>
        `).join('')}

        <div class="footer">
          Generado oficialmente por ERP Panamá (Módulo Planilla & RRHH - Auditoría Forense MITRADEL) el ${new Date().toLocaleString('es-PA')}.
        </div>
      </body>
      </html>
    `;

    // Renderizamos el HTML a un PDF real en servidor (el endpoint promete un PDF, no HTML crudo)
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    let pdfBuffer: Buffer;
    try {
      const page = await browser.newPage();
      await page.setContent(htmlReporte, { waitUntil: 'domcontentloaded' });
      pdfBuffer = Buffer.from(
        await page.pdf({
          format: 'letter',
          printBackground: true,
          margin: { top: '20px', bottom: '20px', left: '20px', right: '20px' }
        })
      );
    } finally {
      await browser.close();
    }

    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="Expediente_Laboral_${empleado.cedula.replace(/\s+/g, '_')}.pdf"`
      }
    });
  } catch (error: any) {
    console.error('Error GET /api/rrhh/expediente/[id]/pdf:', error);
    return NextResponse.json({ error: 'Error al generar reporte probatorio' }, { status: 500 });
  }
}
