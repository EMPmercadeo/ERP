'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert } from '@/components/ui/alert';
import { Upload, FileUp, Loader2 } from 'lucide-react';
import { importClients } from '@/app/(dashboard)/clients/actions';
import { useRouter } from 'next/navigation';
import ExcelJS from 'exceljs';

// Parseo mínimo de una línea CSV que respeta campos entre comillas dobles (soporta comas
// dentro de direcciones, ej. `"Calle 5, Local 2"`) y comillas escapadas (`""`).
// No es un parser CSV completo (no maneja saltos de línea dentro de un campo), pero cubre
// el caso real de exportaciones simples con direcciones que contienen comas.
function parseCsvLine(line: string): string[] {
    const values: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];

        if (inQuotes) {
            if (char === '"') {
                if (line[i + 1] === '"') {
                    current += '"';
                    i++;
                } else {
                    inQuotes = false;
                }
            } else {
                current += char;
            }
        } else {
            if (char === '"') {
                inQuotes = true;
            } else if (char === ',') {
                values.push(current.trim());
                current = '';
            } else {
                current += char;
            }
        }
    }
    values.push(current.trim());
    return values;
}

export function ImportClientsDialog() {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [summary, setSummary] = useState<{ count: number; errors: string[] } | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const router = useRouter();

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setSummary(null);
            setErrorMessage(null);
        }
    };

    const handleImport = async () => {
        if (!file) return;

        setLoading(true);
        setSummary(null);
        setErrorMessage(null);
        try {
            const buffer = await file.arrayBuffer();
            const workbook = new ExcelJS.Workbook();
            const rows: Record<string, string>[] = [];

            if (file.name.endsWith('.csv')) {
                const text = await file.text();
                const lines = text.split('\n');

                lines.forEach((line, index) => {
                    if (index === 0) return; // Skip header
                    if (!line.trim()) return;

                    const values = parseCsvLine(line);

                    // Expected: RUC, Razon Social, Email, Telefono, Direccion
                    rows.push({
                        ruc: values[0],
                        razonSocial: values[1],
                        email: values[2],
                        telefono: values[3],
                        direccion: values[4]
                    });
                });
            } else {
                await workbook.xlsx.load(buffer);
                const worksheet = workbook.worksheets[0];
                worksheet.eachRow((row, rowNumber) => {
                    if (rowNumber === 1) return;
                    rows.push({
                        ruc: row.getCell(1).text,
                        razonSocial: row.getCell(2).text,
                        email: row.getCell(3).text,
                        telefono: row.getCell(4).text,
                        direccion: row.getCell(5).text
                    });
                });
            }

            const result = await importClients(rows);

            if (result.success) {
                setSummary({ count: result.count ?? 0, errors: result.errors ?? [] });
                setFile(null);
                router.refresh();
            } else {
                setErrorMessage('Error importando: ' + result.error);
            }

        } catch (error) {
            console.error(error);
            setErrorMessage('Error procesando el archivo.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog
            open={open}
            onOpenChange={(next) => {
                setOpen(next);
                if (!next) {
                    // Limpiar el reporte al cerrar para no mostrar resultados de una importación anterior.
                    setSummary(null);
                    setErrorMessage(null);
                    setFile(null);
                }
            }}
        >
            <DialogTrigger asChild>
                <Button variant="outline">
                    <FileUp className="mr-2 h-4 w-4" />
                    Importar
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[480px] max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Importar Clientes</DialogTitle>
                    <DialogDescription>
                        Sube un archivo Excel (.xlsx) o CSV.
                        <br />
                        Columnas: RUC, Razón Social, Email, Teléfono, Dirección.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid w-full max-w-sm items-center gap-1.5">
                        <Label htmlFor="file">Archivo de Clientes</Label>
                        <Input id="file" type="file" accept=".csv, .xlsx" onChange={handleFileChange} />
                    </div>

                    {errorMessage && (
                        <Alert variant="error">{errorMessage}</Alert>
                    )}

                    {summary && (
                        <div className="space-y-2">
                            <Alert variant={summary.errors.length > 0 ? 'warning' : 'success'}>
                                {summary.count} cliente{summary.count === 1 ? '' : 's'} importado{summary.count === 1 ? '' : 's'} correctamente.
                                {summary.errors.length > 0 && ` ${summary.errors.length} fila(s) con incidencias (ver detalle abajo).`}
                            </Alert>
                            {summary.errors.length > 0 && (
                                <div className="max-h-40 overflow-y-auto rounded-lg border border-border bg-muted/50 p-3">
                                    <ul className="space-y-1 text-xs text-muted-foreground">
                                        {summary.errors.map((err, idx) => (
                                            <li key={idx}>{err}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    )}
                </div>
                <DialogFooter>
                    <Button onClick={handleImport} disabled={!file || loading}>
                        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                        Importar
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
