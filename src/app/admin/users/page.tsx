import { ContentContainer } from '@/components/layout/Content';
import { EmptyState } from '@/components/layout/Content';
import { Users } from 'lucide-react';

export default function AdminUsersPage() {
    return (
        <ContentContainer className="py-8">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Usuarios Globales</h1>
                    <p className="text-muted-foreground">Gestión de todos los usuarios de la plataforma</p>
                </div>
            </div>

            <EmptyState
                title="Módulo de Usuarios en Construcción"
                description="Aquí podrás ver, buscar y gestionar a todos los usuarios registrados en el sistema, independientemente de su empresa."
                icon={<Users className="h-12 w-12 text-muted-foreground" />}
            />
        </ContentContainer>
    );
}
