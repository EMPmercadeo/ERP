'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ArrowLeft, ArrowRightLeft, Search, PackageCheck, XCircle } from 'lucide-react';
import { recibirTransferencia, cancelarTransferencia } from '@/lib/actions/transferencias';
import { ContentContainer } from '@/components/layout/Content';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { NewTransferModal, BodegaOption } from './NewTransferModal';

export interface TransferListItem {
    id: string;
    numero: string;
    estado: string;
    bodegaOrigenNombre: string;
    bodegaDestinoNombre: string;
    creadorNombre: string;
    receptorNombre: string | null;
    fechaEnvio: string;
    fechaRecepcion: string | null;
    notas: string | null;
    items: { descripcion: string; cantidad: number }[];
}

const ESTADO_INFO: Record<string, { label: string; className: string }> = {
    en_transito: { label: 'En Tránsito', className: 'bg-info-bg text-info border border-info/20 hover:bg-info-bg' },
    recibido: { label: 'Recibido', className: 'bg-success-bg text-success border border-success/20 hover:bg-success-bg' },
    cancelado: { label: 'Cancelado', className: 'bg-muted text-muted-foreground border border-border hover:bg-muted' },
};

export function TransferList({
    initialData,
    bodegas,
}: {
    initialData: TransferListItem[];
    bodegas: BodegaOption[];
}) {
    const [search, setSearch] = useState('');
    const [transferencias, setTransferencias] = useState<TransferListItem[]>(initialData);
    const [processingId, setProcessingId] = useState<string | null>(null);
    const router = useRouter();

    const filtered = useMemo(() => {
        const query = search.toLowerCase();
        return transferencias.filter((t) =>
            !query ||
            t.numero.toLowerCase().includes(query) ||
            t.bodegaOrigenNombre.toLowerCase().includes(query) ||
            t.bodegaDestinoNombre.toLowerCase().includes(query)
        );
    }, [transferencias, search]);

    const handleRecibir = async (id: string) => {
        if (!confirm('¿Confirmas que recibiste esta transferencia? El stock se acreditará en la bodega de destino.')) return;
        setProcessingId(id);
        try {
            const res = await recibirTransferencia(id);
            if (res.success) {
                toast.success(res.message);
                setTransferencias((prev) => prev.map((t) => t.id === id ? { ...t, estado: 'recibido' } : t));
                router.refresh();
            } else {
                toast.error(res.message);
            }
        } catch {
            toast.error('Error al conectar con el servidor.');
        } finally {
            setProcessingId(null);
        }
    };

    const handleCancelar = async (id: string) => {
        if (!confirm('¿Cancelar esta transferencia? El stock se revertirá a la bodega de origen.')) return;
        setProcessingId(id);
        try {
            const res = await cancelarTransferencia(id);
            if (res.success) {
                toast.success(res.message);
                setTransferencias((prev) => prev.map((t) => t.id === id ? { ...t, estado: 'cancelado' } : t));
                router.refresh();
            } else {
                toast.error(res.message);
            }
        } catch {
            toast.error('Error al conectar con el servidor.');
        } finally {
            setProcessingId(null);
        }
    };

    return (
        <ContentContainer>
            <div className="flex flex-col gap-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <Link href="/warehouses" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-1">
                            <ArrowLeft className="h-4 w-4 mr-1" />
                            Volver a Bodegas
                        </Link>
                        <h1 className="text-2xl font-bold tracking-tight text-foreground dark:text-white">Transferencias entre Bodegas</h1>
                        <p className="text-sm text-muted-foreground">
                            Traslada stock entre bodegas con seguimiento de estado (en tránsito / recibido).
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <NewTransferModal bodegas={bodegas} />
                    </div>
                </div>

                <Card className="border-border shadow-sm">
                    <CardContent className="p-4 flex flex-col md:flex-row gap-3">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Buscar por número o bodega..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="h-10 pl-9 border-border focus-visible:ring-brand-1 text-sm rounded-lg"
                            />
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-border shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader className="bg-muted/50">
                                <TableRow>
                                    <TableHead className="w-[12%]">Número</TableHead>
                                    <TableHead className="w-[20%]">Origen</TableHead>
                                    <TableHead className="w-[20%]">Destino</TableHead>
                                    <TableHead className="w-[15%]">Productos</TableHead>
                                    <TableHead className="w-[13%]">Estado</TableHead>
                                    <TableHead className="text-right w-[20%]">Acciones</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filtered.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                                            <div className="flex flex-col items-center justify-center gap-2">
                                                <ArrowRightLeft className="h-8 w-8 text-muted-foreground" />
                                                <p className="text-sm font-medium">No se encontraron transferencias</p>
                                                <p className="text-xs">
                                                    Crea una nueva transferencia para trasladar stock entre bodegas.
                                                </p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filtered.map((t) => {
                                        const estado = ESTADO_INFO[t.estado] || ESTADO_INFO.en_transito;
                                        return (
                                            <TableRow key={t.id} className="hover:bg-accent/30">
                                                <TableCell className="font-mono font-medium text-foreground">{t.numero}</TableCell>
                                                <TableCell className="text-muted-foreground">{t.bodegaOrigenNombre}</TableCell>
                                                <TableCell className="text-muted-foreground">{t.bodegaDestinoNombre}</TableCell>
                                                <TableCell className="text-xs text-muted-foreground">
                                                    {t.items.length} producto{t.items.length !== 1 ? 's' : ''}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge className={estado.className}>{estado.label}</Badge>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    {t.estado === 'en_transito' ? (
                                                        <div className="flex items-center justify-end gap-1">
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => handleRecibir(t.id)}
                                                                disabled={processingId === t.id}
                                                                className="h-8 text-xs text-success border-success/20 hover:bg-success-bg"
                                                            >
                                                                <PackageCheck className="h-3.5 w-3.5 mr-1" />
                                                                Recibir
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={() => handleCancelar(t.id)}
                                                                disabled={processingId === t.id}
                                                                aria-label="Cancelar transferencia"
                                                                className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                                            >
                                                                <XCircle className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    ) : (
                                                        <span className="text-xs text-muted-foreground">
                                                            {t.estado === 'recibido' && t.receptorNombre ? `Recibido por ${t.receptorNombre}` : '—'}
                                                        </span>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </Card>
            </div>
        </ContentContainer>
    );
}
