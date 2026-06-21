'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Topbar } from '@/components/layout/Topbar';
import { ContentContainer } from '@/components/layout/Content';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { ClientSearch } from '@/components/quotes/ClientSearch';
import { QuoteItemsTable, type QuoteItem } from '@/components/quotes/QuoteItemsTable';
import { QuoteSummarySidebar } from '@/components/quotes/QuoteSummarySidebar';

interface Client {
    id: string;
    razonSocial: string;
    ruc: string;
    dv?: string;
    email?: string;
    telefono?: string;
    direccion?: string;
}

export default function NewQuotePage() {
    const router = useRouter();
    const [selectedClient, setSelectedClient] = useState<Client | null>(null);
    const [items, setItems] = useState<QuoteItem[]>([]);
    const [notes, setNotes] = useState('');
    const [terms, setTerms] = useState('contado');
    const [validUntil, setValidUntil] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    // Calculated totals
    const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const discountTotal = items.reduce((sum, item) => sum + ((item.price * item.quantity) * (item.discount / 100)), 0);
    const taxTotal = items.reduce((sum, item) => {
        const lineSub = item.price * item.quantity;
        const lineDisc = lineSub * (item.discount / 100);
        return sum + ((lineSub - lineDisc) * (Number(item.taxRate) / 100));
    }, 0);
    const total = subtotal - discountTotal + taxTotal;

    const handleSave = async () => {
        if (!selectedClient) {
            alert('Por favor seleccione un cliente');
            return;
        }
        if (items.length === 0) {
            alert('Por favor agregue al menos un ítem');
            return;
        }

        setIsSaving(true);
        try {
            const res = await fetch('/api/quotes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    client: selectedClient,
                    items,
                    totals: { subtotal, discountTotal, taxTotal, total },
                    notes,
                    terms,
                    validUntil: validUntil || new Date(Date.now() + 15 * 86400000).toISOString()
                })
            });

            const json = await res.json();

            if (!res.ok) {
                throw new Error(json.error || 'Error al guardar');
            }

            alert(`Cotización ${json.data.numero} guardada exitosamente`);
            router.push('/quotes');
        } catch (error: any) {
            console.error(error);
            alert(error.message);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <>
            <Topbar title="Nueva Cotización">
                <Button variant="ghost" asChild className="-ml-2">
                    <Link href="/quotes" className="flex items-center text-muted-foreground hover:text-foreground">
                        <ChevronLeft className="mr-1 h-4 w-4" />
                        Volver
                    </Link>
                </Button>
            </Topbar>
            <ContentContainer>
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pb-20">

                    {/* LEFTSIDE: Main Form (8 cols) */}
                    <div className="lg:col-span-8 space-y-6">
                        {/* Client & Info Card */}
                        <Card>
                            <CardContent className="p-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Client Selection */}
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <Label>Cliente</Label>
                                            <ClientSearch onSelect={(c) => setSelectedClient(c)} />
                                        </div>

                                        {selectedClient && (
                                            <div className="rounded-md border p-4 bg-muted/30 text-sm space-y-2 relative group">
                                                <div className="font-medium text-base">{selectedClient.razonSocial}</div>
                                                <div className="grid grid-cols-2 gap-y-1 gap-x-4 text-muted-foreground">
                                                    <div>
                                                        <span className="font-semibold block text-xs uppercase tracking-wider">RUC</span>
                                                        {selectedClient.ruc}{selectedClient.dv && `-${selectedClient.dv}`}
                                                    </div>
                                                    <div>
                                                        <span className="font-semibold block text-xs uppercase tracking-wider">Email</span>
                                                        <span className="truncate block">{selectedClient.email || 'N/A'}</span>
                                                    </div>
                                                    <div className="col-span-2">
                                                        <span className="font-semibold block text-xs uppercase tracking-wider">Dirección</span>
                                                        <span className="truncate block">{selectedClient.direccion || 'N/A'}</span>
                                                    </div>
                                                </div>
                                                <Button
                                                    variant="secondary"
                                                    size="sm"
                                                    className="absolute top-2 right-2 h-7 opacity-0 group-hover:opacity-100 transition-opacity"
                                                    onClick={() => setSelectedClient(null)}
                                                >
                                                    Cambiar
                                                </Button>
                                            </div>
                                        )}
                                    </div>

                                    {/* Metadata */}
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label>Fecha Emisión</Label>
                                                <Input type="date" className="bg-muted/30" disabled value={new Date().toISOString().split('T')[0]} />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Válida Hasta</Label>
                                                <Input
                                                    type="date"
                                                    value={validUntil}
                                                    onChange={(e) => setValidUntil(e.target.value)}
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Vendedor</Label>
                                            <Input value="Usuario Demo" disabled className="bg-muted/30" />
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Items Table */}
                        <Card className="min-h-[400px]">
                            <CardContent className="p-0">
                                <div className="p-6">
                                    <h3 className="text-lg font-semibold mb-4">Items y Servicios</h3>
                                    <QuoteItemsTable items={items} onUpdate={setItems} />
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* RIGHTSIDE: Sticky Summary (4 cols) */}
                    <div className="lg:col-span-4 space-y-6">
                        <div className="sticky top-[5.5rem] space-y-6">
                            <QuoteSummarySidebar
                                subtotal={subtotal}
                                discountTotal={discountTotal}
                                taxTotal={taxTotal}
                                total={total}
                                notes={notes}
                                terms={terms}
                                items={items}
                                client={selectedClient}
                                onNotesChange={setNotes}
                                onTermsChange={setTerms}
                                onSave={handleSave}
                                onLoading={isSaving}
                            />
                        </div>
                    </div>

                </div>
            </ContentContainer>
        </>
    );
}
