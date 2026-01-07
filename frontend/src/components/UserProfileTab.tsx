import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import api from '@/lib/axios';
import { 
  User, Mail, Shield, CheckCircle, XCircle, Edit, Lock, 
  ArrowUpCircle, Clock, Check, AlertCircle 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';

interface UserProfileTabProps {
    user: any; 
}

interface UpgradeRequest {
    request_id: number;
    reason: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    created_at: string;
}

const UserProfileTab = ({ user }: UserProfileTabProps) => {
    const [request, setRequest] = useState<UpgradeRequest | null>(null);
    const [loadingRequest, setLoadingRequest] = useState(false);

    // 1. Check if user already submitted a request
    useEffect(() => {
        const fetchUpgradeRequest = async () => {
            if (user.role !== 'BIDDER') return;
            
            try {
                // Assuming endpoint: GET /upgrade-requests?user_id=...
                const res = await api.get(`/upgrade-requests?user_id=${user.user_id}`);
                console.log("Upgrade request fetch response:", res.data);
                // Assuming backend returns an array, take the latest one
                if (res.data.data && res.data.data.length > 0) {
                    setRequest(res.data.data[0]);
                }
            } catch (error) {
                console.error("Failed to check upgrade status", error);
            }
        };
        fetchUpgradeRequest();
    }, [user.user_id, user.role]);

    // 2. Handle "Request to be Seller" click
    const handleRequestUpgrade = async () => {
        setLoadingRequest(true);
        try {
            const payload = {
                reason: "I want to be a Seller for a special week"
            };
            const res = await api.post('/upgrade-requests', payload);
            
            setRequest(res.data.data); // Update UI immediately with new request
            toast.success("Request submitted successfully!");
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to submit request");
        } finally {
            setLoadingRequest(false);
        }
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in duration-300">
            {/* Left: User Card */}
            <div className="md:col-span-1">
                <Card className="h-full">
                    <CardHeader className="flex flex-col items-center text-center pb-4">
                         <Avatar className="w-24 h-24 mb-4">
                            <AvatarFallback className="text-3xl font-bold bg-primary/10 text-primary">
                                {user.full_name?.charAt(0).toUpperCase()}
                            </AvatarFallback>
                        </Avatar>
                        <CardTitle>{user.full_name}</CardTitle>
                        <CardDescription>{user.email}</CardDescription>
                    </CardHeader>
                    
                    <CardContent className="flex flex-col items-center gap-6">
                        {/* Verification Badge */}
                        <Badge variant={user.is_verified ? "default" : "destructive"} className="gap-1.5 py-1 px-3">
                            {user.is_verified ? <CheckCircle className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                            {user.is_verified ? "Verified Account" : "Unverified"}
                        </Badge>

                        {/* --- NEW LOGIC: SELLER REQUEST --- */}
                        {user.role === 'BIDDER' && (
                            <div className="w-full">
                                {request ? (
                                    // Scenario A: Request Exists -> Show Details
                                    <div className="bg-muted/50 p-4 rounded-lg border text-sm space-y-3 w-full text-left">
                                        <div className="flex items-center justify-between">
                                            <span className="font-semibold text-muted-foreground">Request Status</span>
                                            {request.status === 'PENDING' && <Badge variant="outline" className="text-yellow-600 border-yellow-200 bg-yellow-50">Pending</Badge>}
                                            {request.status === 'APPROVED' && <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">Approved</Badge>}
                                            {request.status === 'REJECTED' && <Badge variant="outline" className="text-red-600 border-red-200 bg-red-50">Rejected</Badge>}
                                        </div>
                                        
                                        <div className="space-y-1">
                                            <p className="text-xs font-medium text-muted-foreground uppercase">Submitted On</p>
                                            <div className="flex items-center gap-1.5 text-foreground">
                                                <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                                                {new Date(request.created_at).toLocaleString()}
                                            </div>
                                        </div>

                                        <div className="space-y-1">
                                            <p className="text-xs font-medium text-muted-foreground uppercase">Reason</p>
                                            <p className="italic text-muted-foreground truncate" title={request.reason}>
                                                "{request.reason}"
                                            </p>
                                        </div>
                                    </div>
                                ) : (
                                    // Scenario B: No Request -> Show Button
                                    <Button 
                                        onClick={handleRequestUpgrade} 
                                        disabled={loadingRequest}
                                        className="w-full gap-2 bg-blue-600 hover:bg-blue-700 text-white"
                                    >
                                        {loadingRequest ? "Submitting..." : (
                                            <>
                                                <ArrowUpCircle className="w-4 h-4" />
                                                Request to be Seller
                                            </>
                                        )}
                                    </Button>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Right: Details & Actions (Unchanged) */}
            <div className="md:col-span-2">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <User className="w-5 h-5 text-muted-foreground" />
                            Account Details
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Full Name</label>
                                <p className="font-medium text-foreground">{user.full_name}</p>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Email Address</label>
                                <div className="flex items-center gap-2">
                                    <Mail className="w-4 h-4 text-muted-foreground" />
                                    <p className="font-medium text-foreground">{user.email}</p>
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Account Role</label>
                                <div className="flex items-center gap-2">
                                    <Shield className="w-4 h-4 text-muted-foreground" />
                                    <p className="font-medium text-foreground">{user.role}</p>
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">User ID</label>
                                <p className="font-medium text-foreground">#{user.user_id}</p>
                            </div>
                        </div>

                        <Separator />

                        <div className="flex flex-col sm:flex-row gap-3">
                            <Button variant="outline" className="gap-2" asChild>
                                <Link to="#" className="cursor-not-allowed opacity-50">
                                    <Edit className="w-4 h-4" /> Update Information
                                </Link>
                            </Button>
                            <Button variant="outline" className="gap-2" asChild>
                                <Link to="#" className="cursor-not-allowed opacity-50">
                                    <Lock className="w-4 h-4" /> Change Password
                                </Link>
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default UserProfileTab;