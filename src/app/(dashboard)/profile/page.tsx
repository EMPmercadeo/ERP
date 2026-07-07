import { Topbar } from '@/components/layout/Topbar';
import { ContentContainer } from '@/components/layout/Content';
import { getProfileOverview } from '@/lib/actions/profile';
import { ProfileTabsView } from '@/components/profile/ProfileTabsView';

export const dynamic = 'force-dynamic';

export default async function ProfilePage() {
    const overviewData = await getProfileOverview();

    return (
        <>
            <Topbar title="Mi Perfil" />
            <ContentContainer>
                <ProfileTabsView overviewData={overviewData} />
            </ContentContainer>
        </>
    );
}
