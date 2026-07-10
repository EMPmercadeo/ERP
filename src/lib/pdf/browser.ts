import type { Browser } from 'puppeteer-core';

/**
 * Lanza un Chromium headless para renderizar PDFs desde HTML, funcionando tanto en
 * desarrollo local (Windows/Mac/Linux) como en producción (Vercel serverless).
 *
 * Antes cada ruta de PDF (RRHH) importaba `puppeteer` completo directamente, que trae su
 * propio Chromium sin optimizar para funciones serverless — en Vercel eso casi siempre
 * excede el límite de tamaño de la función o el binario no viaja con el deploy. Aquí:
 *   - En local (`next dev` / build local): usa el paquete `puppeteer` completo, que ya
 *     descarga un Chromium compatible con tu máquina al hacer `npm install`.
 *   - En producción (Vercel u otro entorno serverless): usa `puppeteer-core` (sin Chromium
 *     propio, mucho más liviano) + `@sparticuz/chromium`, que trae un binario comprimido
 *     pensado específicamente para funciones Lambda/Vercel.
 *
 * Cualquier ruta que necesite generar un PDF (facturas, expedientes RRHH, etc.) debe usar
 * este helper en vez de importar puppeteer directamente, para que el comportamiento en
 * producción sea consistente y no se repita este problema por cada ruta nueva.
 */
// Viewport fijo para que el layout del PDF sea idéntico en local y en producción. Antes se
// usaba `chromium.defaultViewport` de @sparticuz/chromium, pero esa propiedad se eliminó del
// paquete en versiones recientes (>=140), rompiendo el build de TypeScript en Vercel. La
// plantilla de factura no usa CSS @media print, así que este ancho fijo mantiene el diseño
// estable sin depender de un valor que el paquete ya no expone.
const PDF_VIEWPORT = { width: 816, height: 1056, deviceScaleFactor: 1 };

export async function launchPdfBrowser(): Promise<Browser> {
  const isServerless = !!process.env.VERCEL || process.env.NODE_ENV === 'production';

  if (isServerless) {
    const chromium = (await import('@sparticuz/chromium')).default;
    const puppeteerCore = await import('puppeteer-core');
    const executablePath = await chromium.executablePath();
    return puppeteerCore.launch({
      args: chromium.args,
      defaultViewport: PDF_VIEWPORT,
      executablePath,
      headless: true,
    }) as unknown as Promise<Browser>;
  }

  const puppeteer = (await import('puppeteer')).default;
  return puppeteer.launch({
    headless: true,
    defaultViewport: PDF_VIEWPORT,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  }) as unknown as Promise<Browser>;
}

/**
 * Convierte un string de HTML en un Buffer de PDF. Se encarga de abrir la página, esperar
 * a que cargue, generar el PDF y cerrar el navegador incluso si algo falla en el camino.
 */
export async function renderHtmlToPdf(
  html: string,
  options?: { format?: 'letter' | 'a4'; margin?: { top?: string; bottom?: string; left?: string; right?: string } }
): Promise<Buffer> {
  const browser = await launchPdfBrowser();
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'domcontentloaded' });
    const pdf = await page.pdf({
      format: options?.format || 'letter',
      printBackground: true,
      margin: options?.margin || { top: '0px', bottom: '0px', left: '0px', right: '0px' },
    });
    return Buffer.from(pdf);
  } finally {
    await browser.close();
  }
}
