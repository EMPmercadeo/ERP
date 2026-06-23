'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RotateCcw } from 'lucide-react';

interface ReportFiltersProps {
    filterClients: { id: string; razonSocial: string }[];
    filterProducts: { id: string; descripcion: string; codigoInterno: string }[];
    filterSellers: { id: string; nombre: string }[];
    currentFilters: {
        dateFrom: string;
        dateTo: string;
        clienteId: string;
        productoId: string;
        creadorId: string;
        estadoDgi: string;
        metodoPago: string;
        tipoDocumento: string;
        groupBy: 'day' | 'week' | 'month';
    };
}

export function ReportFilters({
    filterClients,
    filterProducts,
    filterSellers,
    currentFilters
}: ReportFiltersProps) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const updateFilter = (key: string, value: string) => {
        const params = new URLSearchParams(searchParams.toString());
        if (value === 'all' || !value) {
            params.delete(key);
        } else {
            params.set(key, value);
        }
        params.set('page', '1');
        router.push(`${pathname}?${params.toString()}`);
    };

    const handleReset = () => {
        router.push(pathname);
    };

    return (
        <Card className="bg-white shadow-sm border-border">
            <CardContent className="p-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                    {/* Date Pickers */}
                    <div className="space-y-1.5">
                        <Label htmlFor="dateFrom" className="text-xs font-semibold text-muted-foreground">Desde</Label>
                        <Input
                            id="dateFrom"
                            type="date"
                            value={currentFilters.dateFrom}
                            onChange={(e) => updateFilter('dateFrom', e.target.value)}
                            className="h-9 text-sm"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <Label htmlFor="dateTo" className="text-xs font-semibold text-muted-foreground">Hasta</Label>
                        <Input
                            id="dateTo"
                            type="date"
                            value={currentFilters.dateTo}
                            onChange={(e) => updateFilter('dateTo', e.target.value)}
                            className="h-9 text-sm"
                        />
                    </div>

                    {/* Group By */}
                    <div className="space-y-1.5">
                        <Label htmlFor="groupBy" className="text-xs font-semibold text-muted-foreground">Agrupar gráfico</Label>
                        <Select
                            value={currentFilters.groupBy}
                            onValueChange={(val) => updateFilter('groupBy', val)}
                        >
                            <SelectTrigger id="groupBy" className="h-9 text-sm">
                                <SelectValue placeholder="Agrupación" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="day">Por Día</SelectItem>
                                <SelectItem value="week">Por Semana</SelectItem>
                                <SelectItem value="month">Por Mes</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Tipo Documento */}
                    <div className="space-y-1.5">
                        <Label htmlFor="tipoDocumento" className="text-xs font-semibold text-muted-foreground">Tipo de Documento</Label>
                        <Select
                            value={currentFilters.tipoDocumento}
                            onValueChange={(val) => updateFilter('tipoDocumento', val)}
                        >
                            <SelectTrigger id="tipoDocumento" className="h-9 text-sm">
                                <SelectValue placeholder="Tipo" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todos los tipos</SelectItem>
                                <SelectItem value="FE">Factura Electrónica (FE)</SelectItem>
                                <SelectItem value="NC">Nota de Crédito (NC)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Cliente */}
                    <div className="space-y-1.5">
                        <Label htmlFor="clienteId" className="text-xs font-semibold text-muted-foreground">Cliente</Label>
                        <Select
                            value={currentFilters.clienteId}
                            onValueChange={(val) => updateFilter('clienteId', val)}
                        >
                            <SelectTrigger id="clienteId" className="h-9 text-sm">
                                <SelectValue placeholder="Seleccione Cliente" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todos los clientes</SelectItem>
                                {filterClients.map((client) => (
                                    <SelectItem key={client.id} value={client.id}>
                                        {client.razonSocial}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Producto */}
                    <div className="space-y-1.5">
                        <Label htmlFor="productoId" className="text-xs font-semibold text-muted-foreground">Producto</Label>
                        <Select
                            value={currentFilters.productoId}
                            onValueChange={(val) => updateFilter('productoId', val)}
                        >
                            <SelectTrigger id="productoId" className="h-9 text-sm">
                                <SelectValue placeholder="Seleccione Producto" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todos los productos</SelectItem>
                                {filterProducts.map((prod) => (
                                    <SelectItem key={prod.id} value={prod.id}>
                                        [{prod.codigoInterno}] {prod.descripcion}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Vendedor */}
                    <div className="space-y-1.5">
                        <Label htmlFor="creadorId" className="text-xs font-semibold text-muted-foreground">Vendedor</Label>
                        <Select
                            value={currentFilters.creadorId}
                            onValueChange={(val) => updateFilter('creadorId', val)}
                        >
                            <SelectTrigger id="creadorId" className="h-9 text-sm">
                                <SelectValue placeholder="Seleccione Vendedor" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todos los vendedores</SelectItem>
                                {filterSellers.map((seller) => (
                                    <SelectItem key={seller.id} value={seller.id}>
                                        {seller.nombre}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Estado DGI */}
                    <div className="space-y-1.5">
                        <Label htmlFor="estadoDgi" className="text-xs font-semibold text-muted-foreground">Estado DGI</Label>
                        <Select
                            value={currentFilters.estadoDgi}
                            onValueChange={(val) => updateFilter('estadoDgi', val)}
                        >
                            <SelectTrigger id="estadoDgi" className="h-9 text-sm">
                                <SelectValue placeholder="Estado DGI" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todos los estados</SelectItem>
                                <SelectItem value="borrador">Borrador</SelectItem>
                                <SelectItem value="pendiente">Pendiente DGI</SelectItem>
                                <SelectItem value="aceptada">Aceptada</SelectItem>
                                <SelectItem value="rechazada">Rechazada</SelectItem>
                                <SelectItem value="anulada">Anulada</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* Reset button row */}
                <div className="flex justify-end mt-4 pt-3 border-t">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleReset}
                        className="text-muted-foreground"
                    >
                        <RotateCcw className="mr-2 h-3.5 w-3.5" />
                        Limpiar Filtros
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
