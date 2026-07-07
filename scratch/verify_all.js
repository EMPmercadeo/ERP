const puppeteer = require('puppeteer');
const path = require('path');

async function main() {
    console.log("Launching Puppeteer to verify Super Admin features on port 3005...");
    const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 900 });

    const destDir = "C:\\Users\\ermom\\.gemini\\antigravity\\brain\\e674ac0b-9813-4a4b-b43d-ec957a424b63";
    const baseUrl = 'http://127.0.0.1:3005';

    // 1. Verify /profile
    console.log("\n--- 1. Checking /profile ---");
    await page.goto(`${baseUrl}/profile`, { waitUntil: 'networkidle2', timeout: 30000 });
    await new Promise(r => setTimeout(r, 1500));
    const profileText = await page.evaluate(() => document.body.innerText);
    const hasBanner = profileText.includes("Modo Super Admin Activo");
    console.log("Banner 'Modo Super Admin Activo' presente:", hasBanner);
    await page.screenshot({ path: path.join(destDir, "profile-superadmin.png") });
    console.log("Saved profile-superadmin.png");

    // 2. Verify /admin
    console.log("\n--- 2. Checking /admin ---");
    await page.goto(`${baseUrl}/admin`, { waitUntil: 'networkidle2', timeout: 30000 });
    await new Promise(r => setTimeout(r, 1500));
    const adminText = await page.evaluate(() => document.body.innerText);
    console.log("Dashboard Super Admin cargado. Snippet de texto:");
    const lines = adminText.split('\n').map(l => l.trim()).filter(Boolean);
    console.log(lines.slice(0, 15).join(' | '));
    await page.screenshot({ path: path.join(destDir, "admin-dashboard.png") });
    console.log("Saved admin-dashboard.png");

    // 3. Verify /admin/empresas
    console.log("\n--- 3. Checking /admin/empresas ---");
    await page.goto(`${baseUrl}/admin/empresas`, { waitUntil: 'networkidle2', timeout: 30000 });
    await new Promise(r => setTimeout(r, 1500));
    const empresasText = await page.evaluate(() => document.body.innerText);
    const hasPagination = empresasText.includes("Página") && (empresasText.includes("Anterior") || empresasText.includes("Siguiente"));
    console.log("Paginación presente en /admin/empresas:", hasPagination);
    console.log("Snippet:");
    const empLines = empresasText.split('\n').map(l => l.trim()).filter(Boolean);
    console.log(empLines.slice(-10).join(' | '));
    await page.screenshot({ path: path.join(destDir, "admin-empresas.png") });
    console.log("Saved admin-empresas.png");

    // 4. Verify /admin/empresas/[id]
    console.log("\n--- 4. Checking /admin/empresas/[id] ---");
    const firstEmpresaHref = await page.evaluate(() => {
        const link = Array.from(document.querySelectorAll('a')).find(a => a.getAttribute('href')?.startsWith('/admin/empresas/cm'));
        return link ? link.getAttribute('href') : null;
    });
    if (firstEmpresaHref) {
        console.log("Navigating to:", `${baseUrl}${firstEmpresaHref}`);
        await page.goto(`${baseUrl}${firstEmpresaHref}`, { waitUntil: 'networkidle2', timeout: 30000 });
        await new Promise(r => setTimeout(r, 1500));
        const detailText = await page.evaluate(() => document.body.innerText);
        const detailLines = detailText.split('\n').map(l => l.trim()).filter(Boolean);
        console.log("Detalle de empresa snippet:", detailLines.slice(0, 15).join(' | '));
        await page.screenshot({ path: path.join(destDir, "admin-empresa-detail.png") });
        console.log("Saved admin-empresa-detail.png");

        // 5. Verify Impersonation
        console.log("\n--- 5. Checking Impersonation ---");
        const impBtn = await page.$('button:has-text("Impersonar")') || await page.$('form button');
        if (impBtn) {
            console.log("Clicking Impersonar...");
            await impBtn.click();
            await new Promise(r => setTimeout(r, 2000));
            // Reload or visit home to check banner
            await page.goto(`${baseUrl}/`, { waitUntil: 'networkidle2', timeout: 30000 });
            await new Promise(r => setTimeout(r, 1500));
            const homeText = await page.evaluate(() => document.body.innerText);
            const isImpersonating = homeText.includes("Estás impersonando a la empresa") || homeText.includes("Salir de Impersonación");
            console.log("Impersonation banner visible en home:", isImpersonating);
            await page.screenshot({ path: path.join(destDir, "admin-impersonating.png") });
            console.log("Saved admin-impersonating.png");
        } else {
            console.log("No se encontró el botón de impersonar en el DOM.");
        }
    } else {
        console.log("No se encontró link a empresa individual.");
    }

    await browser.close();
    console.log("\nVerificación completada.");
}

main().catch(console.error);
