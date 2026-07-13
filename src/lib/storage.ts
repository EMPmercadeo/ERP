import fs from 'fs/promises';
import path from 'path';
import { put, del } from '@vercel/blob';

export interface StorageProvider {
    /**
     * Sube un archivo a partir de un buffer y retorna su URL pública accesible.
     * `empresaId` (opcional, pero se debe pasar siempre que exista un tenant) se usa
     * para aislar físicamente los archivos de cada empresa en su propio prefijo de
     * ruta (`products/{empresaId}/{filename}`), de modo que dos empresas nunca
     * comparten carpeta ni pueden enumerar archivos ajenas por convención de nombre.
     */
    uploadFile(buffer: Buffer, filename: string, mimeType: string, empresaId?: string): Promise<string>;

    /**
     * Elimina un archivo mediante su URL o ruta guardada.
     */
    deleteFile(filepathOrUrl: string): Promise<void>;
}

export class LocalStorageProvider implements StorageProvider {
    async uploadFile(buffer: Buffer, filename: string, _mimeType: string, empresaId?: string): Promise<string> {
        const segment = empresaId ? `products/${empresaId}` : 'products';
        const uploadDir = path.join(process.cwd(), 'public', 'uploads', segment);
        await fs.mkdir(uploadDir, { recursive: true });
        const filepath = path.join(uploadDir, filename);
        await fs.writeFile(filepath, buffer);
        return `/uploads/${segment}/${filename}`;
    }

    async deleteFile(filepathOrUrl: string): Promise<void> {
        // filepathOrUrl viene como `/uploads/products/{empresaId}/{filename}` (o legado
        // `/uploads/products/{filename}` sin empresaId) — reconstruimos la ruta relativa
        // completa en vez de solo el basename, para no intentar borrar en la carpeta
        // equivocada cuando hay subcarpetas por empresa.
        const relative = filepathOrUrl.replace(/^\/?uploads\//, '');
        const filepath = path.join(process.cwd(), 'public', 'uploads', relative);
        try {
            await fs.unlink(filepath);
        } catch (err) {
            console.warn(`No se pudo eliminar el archivo local: ${filepath}`, err);
        }
    }
}

export class RemoteStorageProvider implements StorageProvider {
    async uploadFile(buffer: Buffer, filename: string, mimeType: string, empresaId?: string): Promise<string> {
        const token = process.env.BLOB_READ_WRITE_TOKEN;

        if (!token) {
            throw new Error(
                'Almacenamiento remoto no configurado (falta BLOB_READ_WRITE_TOKEN). Las subidas están deshabilitadas en producción para evitar pérdida de datos.'
            );
        }

        // Aislamiento por tenant: cada empresa sube a su propio prefijo de carpeta.
        // Las imágenes de producto son de naturaleza pública (catálogo/tienda), por lo
        // que se mantienen en acceso público de Vercel Blob (no confidenciales); el
        // prefijo por empresa es para evitar colisiones de nombre y facilitar
        // auditoría/borrado por tenant, no para ocultar el archivo.
        const pathPrefix = empresaId ? `products/${empresaId}` : 'products';

        // Subir a Vercel Blob de verdad (excepto en ambiente de test)
        const isTest = process.env.NODE_ENV === 'test' || token === 'mock-blob-token';
        if (isTest) {
            return `https://erp-panama.public.blob.vercel-storage.com/${pathPrefix}/${filename}`;
        }

        const blob = await put(`${pathPrefix}/${filename}`, buffer, {
            access: 'public',
            contentType: mimeType,
            token: token,
            addRandomSuffix: true,
        });
        return blob.url;
    }

    async deleteFile(filepathOrUrl: string): Promise<void> {
        const token = process.env.BLOB_READ_WRITE_TOKEN;

        if (!token) {
            return;
        }

        // Eliminar de Vercel Blob si la URL corresponde a este almacenamiento
        if (filepathOrUrl.includes('public.blob.vercel-storage.com')) {
            const isTest = process.env.NODE_ENV === 'test' || token === 'mock-blob-token';
            if (isTest) {
                return;
            }
            try {
                await del(filepathOrUrl, { token });
            } catch (err) {
                console.error(`Error al eliminar archivo de Vercel Blob: ${filepathOrUrl}`, err);
            }
        }
    }
}

export function getStorageProvider(): StorageProvider {
    const isProd = process.env.NODE_ENV === 'production';
    const providerType = process.env.STORAGE_PROVIDER || (isProd ? 'vercel' : 'local');

    // 'vercel', 'remote' y 's3' todos utilizan el proveedor remoto
    if (providerType === 'vercel' || providerType === 'remote' || providerType === 's3') {
        return new RemoteStorageProvider();
    }
    return new LocalStorageProvider();
}
