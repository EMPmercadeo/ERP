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
import { Upload, FileUp, Loader2 } from 'lucide-react';
import { importQuotes } from '@/app/(dashboard)/quotes/actions';
import { useRouter } from 'next/navigation';
import ExcelJS from 'exceljs';

export function ImportQuotesDialog() {
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
            let rows: any[] = [];

            if (file.name.endsWith('.csv')) {
                const text = await file.text();
                const lines = text.split('\n');

                lines.forEach((line, index) => {
                    if (index === 0) return; // Skip header
                    if (!line.trim()) return;

                    const values = line.split(',').map(v => v.trim());

                    // Expected: Numero, Fecha, Cliente, Total, Estado
                    rows.push({
                        numero: values[0],
                        fecha: values[1],
                        cliente: values[2],
                        total: values[3],
                        estado: values[4]
                    });
                });
            } else {
                await workbook.xlsx.load(buffer);
                const worksheet = workbook.worksheets[0];
                worksheet.eachRow((row, rowNumber) => {
                    if (rowNumber === 1) return;
                    rows.push({
                        numero: row.getCell(1).text,
                        fecha: row.getCell(2).text,
                        cliente: row.getCell(3).text,
                        total: row.getCell(4).text,
                        estado: row.getCell(5).text
                    });
                });
            }

            const result = await importQuotes(rows);

            if (result.success) {
                alert(`Importado exitosamente: ${result.count} cotizaciones.`);
                setOpen(false);
                router.refresh();
            } else {
                alert('Error importando: ' + result.error);
            }

        } catch (error) {
            console.error(error);
            alert('Error procesando el archivo');
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
                    Importar
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Importar Cotizaciones</DialogTitle>
                    <DialogDescription>
                        Sube un archivo Excel (.xlsx) o CSV.
                        <br />
                        Columnas: Número, Fecha, Cliente, Total, Estado.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid w-full max-w-sm items-center gap-1.5">
                        <Label htmlFor="file">Archivo de Cotizaciones</Label>
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
