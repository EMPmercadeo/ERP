'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { timbrarFacturaDGI, anularFacturaDGI, obtenerLogsPAC } from '@/lib/actions/billing-fe';
import { CheckCircle2, History, RotateCw, XCircle } from 'lucide-react';

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';

interface DgiActionsProps {
    facturaId: string;
    estadoDgi: string;
}

type PacLog = Awaited<ReturnType<typeof obtenerLogsPAC>>[number];

export function DgiActions({ facturaId, estadoDgi: initialEstado }: DgiActionsProps) {
    const [estadoDgi, setEstadoDgi] = useState(initialEstado);
    const [loading, setLoading] = useState(false);
    const [logs, setLogs] = useState<PacLog[]>([]);
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [motivoCancelacion, setMotivoCancelacion] = useState('');

    const cargarLogs = useCallback(async () => {
        const pacLogs = await obtenerLogsPAC(facturaId);
        setLogs(pacLogs);
    }, [facturaId]);

    useEffect(() => {
        cargarLogs();
    }, [cargarLogs, estadoDgi]);

    const handleTimbrar = async () => {
        setLoading(true);
        try {
            toast.loading('Enviando factura a la DGI...', { id: 'timbrado' });
            const res = await timbrarFacturaDGI(facturaId);
            if (res.success) {
                toast.success(res.message, { id: 'timbrado' });
                setEstadoDgi('aceptada');
                window.location.reload();
            } else {
                toast.error(res.message, { id: 'timbrado' });
                setEstadoDgi('rechazada');
            }
        } catch (e: unknown) {
            toast.error(e instanceof Error ? e.message : 'Error al conectar con el servidor.', { id: 'timbrado' });
        } finally {
            setLoading(false);
        }
    };

    const handleAnular = async () => {
        if (motivoCancelacion.trim().length < 5) {
            toast.error('El motivo de cancelación debe tener al menos 5 caracteres.');
            return;
        }

        setLoading(true);
        setShowCancelModal(false);
        try {
            toast.loading('Anulando documento en la DGI...', { id: 'anulacion' });
            const res = await anularFacturaDGI(facturaId, motivoCancelacion);
            if (res.success) {
                toast.success(res.message, { id: 'anulacion' });
                setEstadoDgi('anulada');
                window.location.reload();
            } else {
                toast.error(res.message, { id: 'anulacion' });
            }
        } catch (e: unknown) {
            toast.error(e instanceof Error ? e.message : 'Error de conexión.', { id: 'anulacion' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <Card className="border-border shadow-sm">
                <CardHeader>
                    <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Acciones Fiscales</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {loading ? (
                        <div className="flex items-center justify-center py-4">
                            <RotateCw className="h-6 w-6 animate-spin text-muted-foreground" />
                        </div>
                    ) : (
                        <div className="flex flex-col gap-2">
                            {(estadoDgi === 'borrador' || estadoDgi === 'rechazada' || estadoDgi === 'pendiente') && (
                                <Button onClick={handleTimbrar} className="w-full bg-brand-1 hover:bg-brand-2 text-white text-sm font-medium py-2">
                                    <RotateCw className="mr-2 h-4 w-4" />
                                    Enviar a DGI (Timbrar)
                                </Button>
                            )}

                            {estadoDgi === 'aceptada' && (
                                <Button onClick={() => setShowCancelModal(true)} variant="destructive" className="w-full text-sm font-medium py-2">
                                    <XCircle className="mr-2 h-4 w-4" />
                                    Anular en DGI
                                </Button>
                            )}

                            {estadoDgi === 'anulada' && (
                                <div className="text-sm text-center py-2 text-muted-foreground font-medium">
                                    Esta factura ya ha sido anulada fiscalmente.
                                </div>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Modal de Cancelación */}
            {showCancelModal && (
                <div className="fixed inset-0 bg-primary/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <Card className="w-full max-w-md border-0 shadow-xl overflow-hidden animate-in fade-in zoom-in duration-200">
                        <CardHeader className="bg-muted/50 border-b border-border p-6">
                            <CardTitle className="text-lg font-bold text-foreground">Motivo de Anulación</CardTitle>
                            <p className="text-xs text-muted-foreground mt-1">
                                Indica la razón por la cual se está anulando esta factura en la DGI (Mín. 5 caracteres).
                            </p>
                        </CardHeader>
                        <CardContent className="p-6 space-y-4">
                            <textarea
                                value={motivoCancelacion}
                                onChange={(e) => setMotivoCancelacion(e.target.value)}
                                placeholder="Ej. Error en los datos del cliente, devolución de mercancía..."
                                className="w-full h-24 p-3 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-1 focus:border-transparent resize-none"
                            />
                            <div className="flex justify-end gap-2">
                                <Button variant="outline" size="sm" onClick={() => setShowCancelModal(false)}>
                                    Cancelar
                                </Button>
                                <Button variant="destructive" size="sm" onClick={handleAnular}>
                                    Confirmar Anulación
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Auditoria Logs PAC */}
            {logs.length > 0 && (
                <Card className="border-border shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0">
                        <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Historial PAC / DGI</CardTitle>
                        <History className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent className="p-0 max-h-60 overflow-y-auto">
                        <Table>
                            <TableHeader className="bg-muted/50">
                                <TableRow>
                                    <TableHead className="text-xs">Operación</TableHead>
                                    <TableHead className="text-xs">Resultado</TableHead>
                                    <TableHead className="text-xs text-right">Fecha</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {logs.map((log) => (
                                    <TableRow key={log.id} className="hover:bg-accent/30">
                                        <TableCell className="py-2.5">
                                            <span className="font-semibold text-xs text-foreground capitalize">
                                                {log.tipoOperacion}
                                            </span>
                                        </TableCell>
                                        <TableCell className="py-2.5">
                                            <div className="flex flex-col gap-0.5">
                                                <div className="flex items-center gap-1">
                                                    {log.exitoso ? (
                                                        <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                                                    ) : (
                                                        <XCircle className="h-3 w-3 text-rose-500" />
                                                    )}
                                                    <span className="text-xs font-medium text-foreground">
                                                        {log.codigoResultado || 'N/A'}
                                                    </span>
                                                </div>
                                                <span className="text-[10px] text-muted-foreground max-w-[150px] truncate block" title={log.mensajeResultado || ''}>
                                                    {log.mensajeResultado || 'Sin mensaje.'}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-2.5 text-right text-[10px] text-muted-foreground">
                                            {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
