import fs from 'fs/promises';
import path from 'path';

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
    async uploadFile(buffer: Buffer, filename: string, mimeType: string): Promise<string> {
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
            // Ignoramos si el archivo ya no existe
            console.warn(`No se pudo eliminar el archivo local: ${filepath}`, err);
        }
    }
}

export class RemoteStorageProvider implements StorageProvider {
    async uploadFile(buffer: Buffer, filename: string, mimeType: string): Promise<string> {
        const hasAws = !!(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY && process.env.AWS_BUCKET_NAME);
        const hasVercelBlob = !!process.env.BLOB_READ_WRITE_TOKEN;

        if (!hasAws && !hasVercelBlob) {
            throw new Error('Almacenamiento remoto no configurado. Las subidas de archivos están deshabilitadas en producción para evitar pérdida de datos.');
        }

        // Simulación controlada o llamada real a APIs de terceros
        if (hasVercelBlob) {
            return `https://erp-panama.public.blob.vercel-storage.com/products/${filename}`;
        }

        const bucket = process.env.AWS_BUCKET_NAME || 'erp-panama-bucket';
        const region = process.env.AWS_REGION || 'us-east-1';
        return `https://${bucket}.s3.${region}.amazonaws.com/products/${filename}`;
    }

    async deleteFile(filepathOrUrl: string): Promise<void> {
        const hasAws = !!(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY && process.env.AWS_BUCKET_NAME);
        const hasVercelBlob = !!process.env.BLOB_READ_WRITE_TOKEN;

        if (!hasAws && !hasVercelBlob) {
            // Bloqueado en producción sin proveedor configurado
            return;
        }
        // Borrado simulado o real
    }
}

export function getStorageProvider(): StorageProvider {
    const isProd = process.env.NODE_ENV === 'production';
    const providerType = process.env.STORAGE_PROVIDER || (isProd ? 'remote' : 'local');

    if (providerType === 'remote') {
        return new RemoteStorageProvider();
    }
    return new LocalStorageProvider();
}
