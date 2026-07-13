import fs from 'fs/promises';
import path from 'path';
import { put, del } from '@vercel/blob';

export interface StorageProvider {
    /**
     * Sube un archivo a partir de un buffer y retorna su URL pública accesible.
     */
    uploadFile(buffer: Buffer, filename: string, mimeType: string): Promise<string>;
    
    /**
     * Elimina un archivo mediante su URL o ruta guardada.
     */
    deleteFile(filepathOrUrl: string): Promise<void>;
}

export class LocalStorageProvider implements StorageProvider {
    async uploadFile(buffer: Buffer, filename: string, _mimeType: string): Promise<string> {
        const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'products');
        await fs.mkdir(uploadDir, { recursive: true });
        const filepath = path.join(uploadDir, filename);
        await fs.writeFile(filepath, buffer);
        return `/uploads/products/${filename}`;
    }

    async deleteFile(filepathOrUrl: string): Promise<void> {
        const filename = path.basename(filepathOrUrl);
        const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'products');
        const filepath = path.join(uploadDir, filename);
        try {
            await fs.unlink(filepath);
        } catch (err) {
            console.warn(`No se pudo eliminar el archivo local: ${filepath}`, err);
        }
    }
}

export class RemoteStorageProvider implements StorageProvider {
    async uploadFile(buffer: Buffer, filename: string, mimeType: string): Promise<string> {
        const token = process.env.BLOB_READ_WRITE_TOKEN;

        if (!token) {
            throw new Error(
                'Almacenamiento remoto no configurado (falta BLOB_READ_WRITE_TOKEN). Las subidas están deshabilitadas en producción para evitar pérdida de datos.'
            );
        }

        // Subir a Vercel Blob de verdad (excepto en ambiente de test)
        const isTest = process.env.NODE_ENV === 'test' || token === 'mock-blob-token';
        if (isTest) {
            return `https://erp-panama.public.blob.vercel-storage.com/products/${filename}`;
        }

        const blob = await put(`products/${filename}`, buffer, {
            access: 'public',
            contentType: mimeType,
            token: token
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
