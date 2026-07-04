'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import ExcelJS from 'exceljs';
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
import { Upload, FileUp, Loader2 } from 'lucide-react';
import { importMovimientosBancarios } from '@/lib/actions/bank-accounts';

export function ImportMovimientosDialog({ cuentaBancariaId }: { cuentaBancariaId: string }) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const router = useRouter();

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const handleImport = async () => {
        if (!file) return;

        setLoading(true);
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

                    const values = line.split(',').map(v => v.trim());

                    // Esperado: fecha, descripcion, monto
                    rows.push({
                        fecha: values[0],
                        descripcion: values[1],
                        monto: values[2],
                    });
                });
            } else {
                await workbook.xlsx.load(buffer);
                const worksheet = workbook.worksheets[0];
                worksheet.eachRow((row, rowNumber) => {
                    if (rowNumber === 1) return;
                    rows.push({
                        fecha: row.getCell(1).text,
                        descripcion: row.getCell(2).text,
                        monto: row.getCell(3).text,
                    });
                });
            }

            const result = await importMovimientosBancarios(cuentaBancariaId, file.name, rows);

            if (result.success) {
                toast.success(`Importados ${result.count ?? 0} movimientos bancarios.`);
                if (result.errors && result.errors.length > 0) {
                    toast.warning(`${result.errors.length} fila(s) con errores. Revisa la consola.`);
                    console.warn('Errores de importación:', result.errors);
                }
                setOpen(false);
                router.refresh();
            } else {
                toast.error('Error importando: ' + (result.error || 'Error desconocido'));
            }
        } catch (error) {
            console.error(error);
            toast.error('Error procesando el archivo');
        } finally {
            setLoading(false);
            setFile(null);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline">
                    <FileUp className="mr-2 h-4 w-4" />
                    Importar movimientos
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Importar Movimientos Bancarios</DialogTitle>
                    <DialogDescription>
                        Sube un archivo Excel (.xlsx) o CSV.
                        <br />
                        Columnas: fecha, descripcion, monto (positivo = depósito, negativo = retiro).
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid w-full max-w-sm items-center gap-1.5">
                        <Label htmlFor="file">Archivo de Movimientos</Label>
                        <Input id="file" type="file" accept=".csv, .xlsx" onChange={handleFileChange} />
                    </div>
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
