// Must be first line — sets test environment before modules are evaluated
process.env.NODE_ENV = 'test';

import { LocalStorageProvider, RemoteStorageProvider, getStorageProvider } from '../src/lib/storage';
import fs from 'fs/promises';
import path from 'path';

async function runStorageTests() {
    console.log('🚀 Iniciando pruebas unitarias de StorageProviders...');
    let passedCount = 0;
    let failedCount = 0;

    const dummyBuffer = Buffer.from('fake-image-content-magic-bytes-png-here');
    const filename = `test-${Date.now()}.png`;

    try {
        // --- TEST 1: LocalStorageProvider writes to public/uploads ---
        console.log('\n🔍 TEST 1: LocalStorageProvider escribe en el disco local...');
        const localProvider = new LocalStorageProvider();
        const url = await localProvider.uploadFile(dummyBuffer, filename, 'image/png');

        const localPath = path.join(process.cwd(), 'public', 'uploads', 'products', filename);
        const fileExists = await fs.access(localPath).then(() => true).catch(() => false);

        if (url.startsWith('/uploads/products/') && fileExists) {
            console.log('💚 PASS: Archivo guardado físicamente en public/uploads/products.');
            passedCount++;
        } else {
            console.error('❌ FAIL: LocalStorageProvider no guardó el archivo en la ruta esperada.');
            failedCount++;
        }

        // Cleanup local file
        await localProvider.deleteFile(url);
        const fileExistsAfterDelete = await fs.access(localPath).then(() => true).catch(() => false);
        if (!fileExistsAfterDelete) {
            console.log('💚 PASS: LocalStorageProvider eliminó el archivo físico correctamente.');
            passedCount++;
        } else {
            console.error('❌ FAIL: No se pudo eliminar el archivo local.');
            failedCount++;
        }

        // --- TEST 2: RemoteStorageProvider throws when no credentials ---
        console.log('\n🔍 TEST 2: RemoteStorageProvider falla explícitamente si no hay credenciales...');
        const originalAwsKey = process.env.AWS_ACCESS_KEY_ID;
        const originalBlobToken = process.env.BLOB_READ_WRITE_TOKEN;

        delete process.env.AWS_ACCESS_KEY_ID;
        delete process.env.BLOB_READ_WRITE_TOKEN;

        const remoteProvider = new RemoteStorageProvider();
        let errorThrown = false;
        try {
            await remoteProvider.uploadFile(dummyBuffer, filename, 'image/png');
        } catch (e: any) {
            if (e.message.includes('Almacenamiento remoto no configurado')) {
                errorThrown = true;
            }
        }

        if (errorThrown) {
            console.log('💚 PASS: Se arrojó error explícito al intentar subir archivos sin credenciales.');
            passedCount++;
        } else {
            console.error('❌ FAIL: RemoteStorageProvider no falló ante la falta de credenciales.');
            failedCount++;
        }

        // --- TEST 3: RemoteStorageProvider mock success with keys ---
        console.log('\n🔍 TEST 3: RemoteStorageProvider no toca public/uploads cuando tiene credenciales...');
        process.env.BLOB_READ_WRITE_TOKEN = 'mock-blob-token';

        const remoteUrl = await remoteProvider.uploadFile(dummyBuffer, filename, 'image/png');
        const remoteFilePath = path.join(process.cwd(), 'public', 'uploads', 'products', filename);
        const writtenToDisk = await fs.access(remoteFilePath).then(() => true).catch(() => false);

        if (remoteUrl.includes('vercel-storage.com') && !writtenToDisk) {
            console.log('💚 PASS: Subida simulada a Vercel Blob exitosa sin escribir nada en local.');
            passedCount++;
        } else {
            console.error('❌ FAIL: Se escribió un archivo local en producción o la URL es incorrecta:', { remoteUrl, writtenToDisk });
            failedCount++;
        }

        // Restaurar env variables
        if (originalAwsKey) process.env.AWS_ACCESS_KEY_ID = originalAwsKey;
        if (originalBlobToken) process.env.BLOB_READ_WRITE_TOKEN = originalBlobToken;

    } catch (e: any) {
        console.error('Crash durante tests de storage:', e);
        failedCount++;
    }

    console.log(`\n🎉 Resumen de Pruebas de Storage: ${passedCount} PASSED, ${failedCount} FAILED.`);
    if (failedCount > 0) {
        process.exit(1);
    }
}

runStorageTests().catch(e => {
    console.error('Fatal storage test error:', e);
    process.exit(1);
});
