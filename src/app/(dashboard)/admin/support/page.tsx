import { getTenantContext } from '@/lib/auth/context';
import { prisma } from '@/lib/db';
import { Topbar } from '@/components/layout/Topbar';
import { ContentContainer } from '@/components/layout/Content';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
    MessageSquare,
    User,
    Building2,
    Calendar,
    AlertCircle,
    CheckCircle2,
    Inbox,
    Mail
} from 'lucide-react';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function SupportAdminPage() {
    let context;
    try {
        context = await getTenantContext();
    } catch (e) {
        redirect('/login');
    }

    if (context.role !== 'super_admin') {
        return (
            <>
                <Topbar title="Acceso Denegado" />
                <ContentContainer>
                    <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-red-900 shadow-sm max-w-2xl mx-auto my-12 text-center">
                        <AlertCircle className="h-12 w-12 text-red-600 mx-auto mb-3" />
                        <h2 className="text-xl font-bold mb-2">Acceso No Autorizado</h2>
                        <p className="text-sm">
                            Esta sección del panel de administración está reservada exclusivamente para usuarios con privilegios de Administrador Global (Super Admin).
                        </p>
                    </div>
                </ContentContainer>
            </>
        );
    }

    // Fetch support tickets and feedback from Auditoria
    const supportLogs = await prisma.auditoria.findMany({
        where: {
            entidad: { in: ['Soporte', 'Feedback'] }
        },
        include: {
            usuario: {
                select: {
                    nombre: true,
                    email: true,
                    empresa: {
                        select: {
                            razonSocial: true
                        }
                    }
                }
            }
        },
        orderBy: {
            createdAt: 'desc'
        }
    });

    const totalTickets = supportLogs.length;
    const supportCount = supportLogs.filter(log => log.entidad === 'Soporte').length;
    const feedbackCount = supportLogs.filter(log => log.entidad === 'Feedback').length;

    return (
        <>
            <Topbar title="Consola de Soporte y Feedback" />
            <ContentContainer>
                <div className="space-y-6 font-sans">
                    {/* Header */}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                            <h2 className="text-2xl font-bold tracking-tight text-slate-900">Consola de Mensajes</h2>
                            <p className="text-sm text-muted-foreground">
                                Revisa los tickets de soporte técnico y el feedback que los clientes envían desde la barra lateral.
                            </p>
                        </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid gap-6 md:grid-cols-3">
                        <Card className="hover:shadow-sm transition-shadow">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">Mensajes Totales</CardTitle>
                                <Inbox className="h-4.5 w-4.5 text-indigo-600" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-slate-900">{totalTickets}</div>
                                <p className="text-xs text-muted-foreground mt-1">Soporte y feedback combinados</p>
                            </CardContent>
                        </Card>
                        <Card className="hover:shadow-sm transition-shadow">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">Tickets de Soporte</CardTitle>
                                <AlertCircle className="h-4.5 w-4.5 text-rose-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-slate-900">{supportCount}</div>
                                <p className="text-xs text-muted-foreground mt-1">Solicitudes técnicas prioritarias</p>
                            </CardContent>
                        </Card>
                        <Card className="hover:shadow-sm transition-shadow">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">Feedback & Sugerencias</CardTitle>
                                <MessageSquare className="h-4.5 w-4.5 text-emerald-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-slate-900">{feedbackCount}</div>
                                <p className="text-xs text-muted-foreground mt-1">Comentarios e ideas de producto</p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Tickets List */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Historial de Peticiones</CardTitle>
                            <CardDescription>
                                Mostrando todos los tickets registrados en la base de datos de auditoría.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="pt-0">
                            {totalTickets === 0 ? (
                                <div className="text-center py-16 text-muted-foreground">
                                    <Inbox className="h-12 w-12 mx-auto mb-4 opacity-50 text-slate-400" />
                                    <p className="font-semibold text-sm">No hay mensajes registrados</p>
                                    <p className="text-xs mt-1">Los tickets de soporte y comentarios de los clientes aparecerán aquí.</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-slate-100">
                                    {supportLogs.map((log) => {
                                        const date = new Date(log.createdAt).toLocaleDateString('es-PA', {
                                            day: 'numeric',
                                            month: 'long',
                                            year: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        });

                                        const data = log.datosDespues as any;
                                        const isSupport = log.entidad === 'Soporte';

                                        return (
                                            <div key={log.id} className="py-6 first:pt-0 last:pb-0 space-y-4">
                                                <div className="flex flex-wrap items-center justify-between gap-2">
                                                    <div className="flex items-center gap-2">
                                                        <Badge className={isSupport ? "bg-rose-500 hover:bg-rose-500 text-white font-bold" : "bg-emerald-500 hover:bg-emerald-500 text-white font-bold"}>
                                                            {isSupport ? 'Soporte' : 'Feedback'}
                                                        </Badge>
                                                        {isSupport && (
                                                            <span className="text-sm font-bold text-slate-900">
                                                                {data?.subject || 'Sin Asunto'}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                                        <Calendar className="h-3.5 w-3.5" />
                                                        <span>{date}</span>
                                                    </div>
                                                </div>

                                                <div className="text-xs text-slate-700 bg-slate-50 border rounded-lg p-4 leading-relaxed whitespace-pre-wrap">
                                                    {isSupport ? data?.message : data?.text}
                                                </div>

                                                <div className="flex flex-wrap items-center gap-4 text-[11px] text-muted-foreground">
                                                    <div className="flex items-center gap-1">
                                                        <User className="h-3.5 w-3.5 text-slate-400" />
                                                        <span className="font-semibold text-slate-700">{log.usuario.nombre}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <Mail className="h-3.5 w-3.5 text-slate-400" />
                                                        <span className="text-slate-600">{log.usuario.email}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <Building2 className="h-3.5 w-3.5 text-slate-400" />
                                                        <span className="text-slate-600">{log.usuario.empresa.razonSocial}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </ContentContainer>
        </>
    );
}
