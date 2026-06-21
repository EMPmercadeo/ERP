'use client';

import * as React from 'react';
import { Save, Send, FileText, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardFooter
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';

interface QuoteItem {
    id: string;
    sku: string;
    description: string;
    quantity: number;
    price: number;
    discount: number;
    taxRate: string;
    total: number;
}

interface QuoteSummarySidebarProps {
    subtotal: number;
    discountTotal: number;
    taxTotal: number;
    total: number;
    notes: string;
    terms: string;
    items?: QuoteItem[]; // Added for PDF
    client?: any; // Added for PDF
    onNotesChange: (value: string) => void;
    onTermsChange: (value: string) => void;
    onSave: () => void;
    onLoading?: boolean;
}

// Dynamic import to avoid SSR issues with react-pdf? 
// Actually standard import should work if we only use it in client handler.
import { pdf } from '@react-pdf/renderer';
import { QuotePDF } from './QuotePDF';

export function QuoteSummarySidebar({
    subtotal,
    discountTotal,
    taxTotal,
    total,
    notes,
    terms,
    items = [],
    client,
    onNotesChange,
    onTermsChange,
    onSave,
    onLoading
}: QuoteSummarySidebarProps) {
    const [isGeneratingPdf, setIsGeneratingPdf] = React.useState(false);

    const handleDownloadPDF = async () => {
        if (!client) {
            alert("Seleccione un cliente primero");
            return;
        }
        
        setIsGeneratingPdf(true);
        try {
            const doc = <QuotePDF data={{
                quoteNumber: 'BORRADOR', // Placeholder
                date: new Date().toLocaleDateString('es-PA'),
                validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('es-PA'), // 30 days
                salesperson: 'Usuario Demo',
                company: {
                    name: 'Mi Empresa S.A.',
                    ruc: '123456-1-123456',
                    address: 'Ciudad de Panamá, Panamá',
                    phone: '+507 1234-5678',
                    email: 'ventas@miempresa.com'
                },
                client: {
                    name: client.razonSocial,
                    ruc: client.ruc + (client.dv ? `-${client.dv}` : ''),
                    address: client.direccion || 'N/A',
                    phone: client.telefono,
                    email: client.email
                },
                items: items,
                totals: {
                    subtotal,
                    discount: discountTotal,
                    tax: taxTotal,
                    total
                },
                terms: terms,
                notes: notes
            }} />;

            const blob = await pdf(doc).toBlob();
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `cotizacion_borrador.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (error) {
            console.error('Error generating PDF:', error);
            alert('Error al generar PDF');
        } finally {
            setIsGeneratingPdf(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Totals Card */}
            <Card>
                <CardHeader>
                    <CardTitle>Resumen</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Subtotal</span>
                            <span>${subtotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Descuento</span>
                            <span className="text-red-600">-${discountTotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">ITBMS (7%)</span>
                            <span>${taxTotal.toFixed(2)}</span>
                        </div>
                        <Separator className="my-2" />
                        <div className="flex justify-between font-bold text-lg">
                            <span>Total</span>
                            <span>${total.toFixed(2)}</span>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Terms & Notes */}
            <Card>
                <CardContent className="p-6 space-y-4">
                    <div className="space-y-2">
                        <Label>Términos de Pago</Label>
                        <Select value={terms} onValueChange={onTermsChange}>
                            <SelectTrigger>
                                <SelectValue placeholder="Seleccionar..." />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="contado">Contado</SelectItem>
                                <SelectItem value="credito_15">Crédito 15 días</SelectItem>
                                <SelectItem value="credito_30">Crédito 30 días</SelectItem>
                                <SelectItem value="anticipo_50">50% Anticipo</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label>Notas</Label>
                        <Textarea
                            placeholder="Notas visibles para el cliente..."
                            className="min-h-[100px]"
                            value={notes}
                            onChange={(e) => onNotesChange(e.target.value)}
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Actions */}
            <Card>
                <CardContent className="p-6 space-y-3">
                    <Button
                        className="w-full"
                        onClick={onSave}
                        disabled={onLoading}
                    >
                        <Save className="mr-2 h-4 w-4" />
                        Guardar Borrador
                    </Button>
                    <Button variant="outline" className="w-full" disabled={true}>
                        <Send className="mr-2 h-4 w-4" />
                        Enviar al Cliente
                    </Button>
                    <Button 
                        variant="ghost" 
                        className="w-full" 
                        onClick={handleDownloadPDF}
                        disabled={isGeneratingPdf || !client}
                    >
                        {isGeneratingPdf ? (
                            "Generando PDF..."
                        ) : (
                            <>
                                <Download className="mr-2 h-4 w-4" />
                                Descargar PDF
                            </>
                        )}
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
