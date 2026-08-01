'use client';

/**
 * Pestañas del módulo Productos: Catálogo | Abastecimiento.
 *
 * El abastecimiento vive aquí y no como un ítem nuevo del menú lateral porque es una
 * lectura del mismo inventario: qué se está acabando y a quién pedírselo. La barra
 * lateral ya está llena y agregar otro ítem la haría menos navegable, no más.
 *
 * El catálogo llega como `children` desde el Server Component (ya renderizado con sus
 * datos), así que cambiar de pestaña no vuelve a pedir la lista de productos al
 * servidor ni pierde los filtros que el usuario tenía puestos.
 */

import { useState, type ReactNode } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { PackageSearch, ListChecks } from 'lucide-react';
import { ContentContainer } from '@/components/layout/Content';
import { AbastecimientoPanel } from '@/components/suministros/AbastecimientoPanel';
import { cn } from '@/lib/utils';

type Pestana = 'catalogo' | 'abastecimiento';

export function ProductsPageTabs({
    initialTab,
    children,
}: {
    initialTab: string;
    children: ReactNode;
}) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [tab, setTab] = useState<Pestana>(initialTab === 'abastecimiento' ? 'abastecimiento' : 'catalogo');

    // La pestaña se refleja en la URL para que sea compartible y para que las
    // notificaciones puedan enlazar directo a /products?tab=abastecimiento.
    const cambiar = (nueva: Pestana) => {
        setTab(nueva);
        const params = new URLSearchParams(searchParams.toString());
        if (nueva === 'catalogo') params.delete('tab');
        else params.set('tab', nueva);
        const query = params.toString();
        router.replace(query ? `/products?${query}` : '/products', { scroll: false });
    };

    const botonClase = (activa: boolean) =>
        cn(
            'inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium border-b-2 transition-colors shrink-0',
            activa
                ? 'border-brand-1 text-brand-1'
                : 'border-transparent text-muted-foreground hover:text-foreground'
        );

    return (
        <>
            <ContentContainer>
                <div className="flex gap-2 border-b overflow-x-auto whitespace-nowrap" role="tablist">
                    <button
                        type="button"
                        role="tab"
                        aria-selected={tab === 'catalogo'}
                        onClick={() => cambiar('catalogo')}
                        className={botonClase(tab === 'catalogo')}
                    >
                        <ListChecks className="h-4 w-4" />
                        Catálogo
                    </button>
                    <button
                        type="button"
                        role="tab"
                        aria-selected={tab === 'abastecimiento'}
                        onClick={() => cambiar('abastecimiento')}
                        className={botonClase(tab === 'abastecimiento')}
                    >
                        <PackageSearch className="h-4 w-4" />
                        Abastecimiento
                    </button>
                </div>
            </ContentContainer>

            {/* El catálogo se mantiene montado y solo se oculta: así no se pierde el estado
                de los filtros, la búsqueda ni la página al ir y volver del abastecimiento. */}
            <div className={cn(tab !== 'catalogo' && 'hidden')}>{children}</div>

            {tab === 'abastecimiento' && (
                <ContentContainer>
                    <div className="space-y-4 py-2">
                        <div>
                            <h2 className="text-xl font-bold tracking-tight text-foreground">
                                Abastecimiento de insumos
                            </h2>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                Qué se está acabando, para cuánto alcanza y a quién pedirle.
                            </p>
                        </div>
                        <AbastecimientoPanel />
                    </div>
                </ContentContainer>
            )}
        </>
    );
}

export default ProductsPageTabs;
