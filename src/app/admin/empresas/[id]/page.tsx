import { notFound } from 'next/navigation';
import { getTenantById } from '@/lib/actions/admin';
import { ContentContainer } from '@/components/layout/Content';
import { CompanyDetailView } from '@/components/admin/CompanyDetailView';

export const dynamic = 'force-dynamic';

interface PageProps {
    params: Promise<{ id: string }>;
}

export default async function CompanyDetailPage(props: PageProps) {
    const params = await props.params;
    const company = await getTenantById(params.id);

    if (!company) {
        notFound();
    }

    return (
        <ContentContainer className="py-8">
            <CompanyDetailView company={company} />
        </ContentContainer>
    );
}
