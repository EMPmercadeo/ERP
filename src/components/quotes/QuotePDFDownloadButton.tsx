'use client';

import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { pdf } from '@react-pdf/renderer';
import { QuotePDF } from './QuotePDF';
import { useState } from 'react';

export function QuotePDFDownloadButton({ quote }: { quote: any }) {
    const [isLoading, setIsLoading] = useState(false);

    const handleDownload = async () => {
        setIsLoading(true);
        try {
            // Map DB quote object to PDF props
            const pdfData = {
                quoteNumber: quote.numero,
                date: new Date(quote.fechaEmision).toLocaleDateString('es-PA'),
                validUntil: new Date(quote.validaHasta).toLocaleDateString('es-PA'),
                salesperson: 'Usuario Demo', // Need creator name?
                company: {
                    name: quote.empresa?.razonSocial || 'Mi Empresa',
                    ruc: quote.empresa?.ruc || 'N/A',
                    address: quote.empresa?.direccion || 'N/A',
                    phone: quote.empresa?.telefono || 'N/A',
                    email: quote.empresa?.email || 'N/A'
                },
                client: {
                    name: quote.cliente.razonSocial,
                    ruc: quote.cliente.ruc + (quote.cliente.dv ? `-${quote.cliente.dv}` : ''),
                    address: quote.cliente.direccion || 'N/A',
                    phone: quote.cliente.telefono,
                    email: quote.cliente.email
                },
                items: quote.items.map((item: any) => ({
                    sku: 'N/A',
                    description: item.descripcion,
                    quantity: Number(item.cantidad),
                    price: Number(item.precioUnitario),
                    discount: Number(item.descuento),
                    taxRate: item.codigoTasaItbms === '01' ? '7' : '0', // Approx
                    total: Number(item.montoTotal)
                })),
                totals: {
                    subtotal: Number(quote.subtotal),
                    discount: Number(quote.totalDescuento),
                    tax: Number(quote.totalItbms),
                    total: Number(quote.totalNeto)
                },
                terms: 'Contado', // Need to store terms in DB?
                notes: '' // Need to store notes in DB?
            };

            const doc = <QuotePDF data={pdfData} />;
            const blob = await pdf(doc).toBlob();
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `cotizacion_${quote.numero}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

        } catch (error) {
            console.error(error);
            alert('Error al generar PDF');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Button variant="outline" onClick={handleDownload} disabled={isLoading}>
            <Download className="mr-2 h-4 w-4" />
            {isLoading ? 'Generando...' : 'Descargar PDF'}
        </Button>
    );
}
