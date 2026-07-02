import { ContentContainer } from '@/components/layout/Content';
import { EmptyState } from '@/components/layout/Content';
import { Activity } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default function AdminAuditPage() {
    return (
        <ContentContainer className="py-8">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Auditoría</h1>
                    <p className="text-muted-foreground">Registro de actividades y seguridad</p>
                </div>
            </div>

            <EmptyState
                title="Módulo de Auditoría en Construcción"
                description="Este módulo permitirá rastrear cambios críticos, accesos y actividades sospechosas en toda la plataforma."
                icon={<Activity className="h-12 w-12 text-muted-foreground" />}
            />
        </ContentContainer>
    );
}
