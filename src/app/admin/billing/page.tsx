import { ContentContainer } from '@/components/layout/Content';
import { EmptyState } from '@/components/layout/Content';
import { CreditCard } from 'lucide-react';

export default function AdminBillingPage() {
    return (
        <ContentContainer className="py-8">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Facturación</h1>
                    <p className="text-muted-foreground">Gestión de suscripciones y pagos</p>
                </div>
            </div>

            <EmptyState
                title="Módulo de Facturación en Construcción"
                description="Aquí podrás gestionar los planes de suscripción, facturación a clientes y estado de pagos."
                icon={<CreditCard className="h-12 w-12 text-muted-foreground" />}
            />
        </ContentContainer>
    );
}
