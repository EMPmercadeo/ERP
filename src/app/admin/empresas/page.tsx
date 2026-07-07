
import { getTenants } from '@/lib/actions/admin';
import { ContentContainer } from '@/components/layout/Content';
import { CompanyList } from '@/components/admin/CompanyList';

export const dynamic = 'force-dynamic';

interface PageProps {
    searchParams: Promise<{
        page?: string;
        search?: string;
        limit?: string;
    }>;
}

export default async function CompaniesPage(props: PageProps) {
    const searchParams = await props.searchParams;
    const page = Number(searchParams.page) || 1;
    const search = searchParams.search || '';
    const limit = Math.min(Number(searchParams.limit) || 20, 100);

    const { companies, totalCount, pageCount } = await getTenants(search, page, limit);

    return (
        <ContentContainer className="py-8">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Empresas</h1>
                    <p className="text-muted-foreground">Gestión de cuentas Multi-Tenant</p>
                </div>
            </div>

            <CompanyList
                initialData={companies}
                pageCount={pageCount}
                currentPage={page}
                pageSize={limit}
                totalCount={totalCount}
                initialSearch={search}
            />
        </ContentContainer>
    );
}
