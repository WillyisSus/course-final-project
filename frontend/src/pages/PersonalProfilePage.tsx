import { useSelector } from 'react-redux';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'; // Shadcn Tabs
import UserProfileTab from '../components/UserProfileTab';
import SellerInfoTab from '../components/SellerInfoTab';
import AutoBidHistoryTab from '../components/AutoBidHistoryTab';

const PersonalProfilePage = () => {
    const { user } = useSelector((state: any) => state.auth);

    if (!user) return <div className="p-10 text-center text-muted-foreground">Please log in to view your profile.</div>;


    return (
        <div className="container mx-auto py-10 space-y-8 max-w-5xl">
            {/* PAGE HEADER */}
            <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tight text-gray-900">My Account</h1>
                <p className="text-muted-foreground">Manage your profile and auction activities</p>
            </div>

            {/* SHADCN TABS */}
            <Tabs defaultValue="profile" className="w-full space-y-6">
                <TabsList className="grid w-full grid-cols-2 md:w-auto md:grid-cols-3 bg-muted/50 p-1">
                    <TabsTrigger value="profile">Personal Profile</TabsTrigger>
                    <TabsTrigger value="autobids">Auto-Bid History</TabsTrigger>
                    <TabsTrigger value="seller">Seller Dashboard</TabsTrigger>

                </TabsList>

                <TabsContent value="profile" className="outline-none">
                    <UserProfileTab user={user} />
                </TabsContent>

                <TabsContent value="autobids" className="outline-none">
                    <AutoBidHistoryTab userId={user.user_id} />
                </TabsContent>
                <TabsContent value="seller" className="outline-none">
                    <SellerInfoTab sellerId={user.user_id} />
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default PersonalProfilePage;