import { useEffect, useState } from "react";
import { useParams, Link } from "react-router";
import api from "@/lib/axios";
import { 
    Mail, 
    Shield, 
    ThumbsUp, 
    ThumbsDown, 
    ShoppingBag,
    CheckCircle2,
    MessageSquareTextIcon
} from "lucide-react";

// UI Components
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";

interface PublicUser {
    user_id: number;
    full_name: string;
    email: string;
    role: string;
    positive_rating: number;
    negative_rating: number;
    is_verified: boolean;
    created_at: string;
}

interface Feedback {
    feedback_id: number;
    rating: number; // 1 for Good, -1 for Bad
    comment: string;
    created_at?: string;
    from_user: {
        full_name: string;
        user_id: number;
    };
    product: {
        product_id: number;
        name: string;
    };
}

const UserProfilePage = () => {
    const { id } = useParams<{ id: string }>(); // Get User ID from URL
    const [user, setUser] = useState<PublicUser | null>(null);
    const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
    const [loading, setLoading] = useState(true);

    // --- FETCH DATA ---
    useEffect(() => {
        const fetchData = async () => {
            if (!id) return;
            setLoading(true);
            try {
                // 1. Fetch User Details
                // Assuming GET /users/:id returns public profile info
                const userRes = await api.get(`/users/${id}`);
                setUser(userRes.data.data);

                // 2. Fetch Feedbacks
                const feedbackRes = await api.get(`/feedbacks?user_id=${id}`);
                setFeedbacks(feedbackRes.data.data || []);
            } catch (error) {
                console.error("Failed to fetch profile", error);
                toast.error("Failed to load user profile");
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id]);

    // --- CALCULATE RATINGS ---
    const pos = user?.positive_rating || 0;
    const neg = user?.negative_rating || 0;
    const totalRatings = pos + neg;
    const positivePercentage = totalRatings > 0 
        ? Math.round((pos / totalRatings) * 100) 
        : 0; // Default to 0 if no ratings

    // Helper for Rating Badge in Table
    const getRatingBadge = (rating: number) => {
        if (rating === 1) {
            return <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-green-200 gap-1"><ThumbsUp className="w-3 h-3" /> Good</Badge>;
        }
        return <Badge className="bg-red-100 text-red-700 hover:bg-red-100 border-red-200 gap-1"><ThumbsDown className="w-3 h-3" /> Bad</Badge>;
    };

    if (loading) {
        return (
            <div className="container mx-auto py-10 max-w-5xl space-y-8">
                <Skeleton className="h-64 w-full rounded-xl" />
                <Skeleton className="h-96 w-full rounded-xl" />
            </div>
        );
    }

    if (!user) {
        return <div className="text-center py-20 text-muted-foreground">User not found.</div>;
    }

    return (
        <div className="container mx-auto py-10 max-w-5xl space-y-8 animate-in fade-in duration-300">
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* LEFT: Avatar & Identity */}
                <Card className="md:col-span-1 border-slate-200 shadow-sm h-full">
                    <CardHeader className="flex flex-col items-center text-center pb-6">
                        <Avatar className="w-32 h-32 mb-4 border-4 border-white shadow-lg">
                            <AvatarFallback className="text-4xl font-bold bg-primary/10 text-primary">
                                {user.full_name?.charAt(0).toUpperCase()}
                            </AvatarFallback>
                        </Avatar>
                        <CardTitle className="text-2xl font-bold">{user.full_name}</CardTitle>
                        <CardDescription className="flex items-center gap-1 mt-1">
                            {user.is_verified ? (
                                <Badge variant="secondary" className="text-green-600 bg-green-50 border-green-200 gap-1">
                                    <CheckCircle2 className="w-3 h-3" /> Verified
                                </Badge>
                            ) : (
                                <Badge variant="outline" className="text-slate-500 gap-1">Unverified</Badge>
                            )}
                            <Badge variant="outline" className="capitalize ml-1">{user.role}</Badge>
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between text-sm p-3 bg-slate-50 rounded-lg">
                            <span className="text-muted-foreground flex items-center gap-2">
                                <Mail className="w-4 h-4" /> Contact
                            </span>
                            {/* Mask email partially for privacy if needed, or show full */}
                            <span className="font-medium text-slate-700 truncate max-w-[150px]" title={user.email}>
                                {user.email}
                            </span>
                        </div>
                    </CardContent>
                </Card>

                {/* RIGHT: Reputation Stats */}
                <Card className="md:col-span-2 border-slate-200 shadow-sm h-full flex flex-col justify-center">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Shield className="w-5 h-5 text-blue-600" /> Reputation Score
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
                        
                        {/* Positive Rate (Big Percentage) */}
                        <div className="flex flex-col items-center justify-center p-4 bg-blue-50/50 rounded-xl border border-blue-100">
                            <span className="text-4xl font-black text-blue-600 mb-1">
                                {totalRatings === 0 ? "N/A" : `${positivePercentage}%`}
                            </span>
                            <span className="text-sm font-semibold text-blue-800 uppercase tracking-wide">
                                Positive Rating
                            </span>
                        </div>

                        {/* Raw Counts */}
                        <div className="flex flex-col gap-4 col-span-2 justify-center">
                            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-100">
                                <div className="flex items-center gap-2 text-green-700 font-medium">
                                    <ThumbsUp className="w-5 h-5" /> Positive Feedback
                                </div>
                                <span className="text-xl font-bold text-green-700">{pos}</span>
                            </div>
                            
                            <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-100">
                                <div className="flex items-center gap-2 text-red-700 font-medium">
                                    <ThumbsDown className="w-5 h-5" /> Negative Feedback
                                </div>
                                <span className="text-xl font-bold text-red-700">{neg}</span>
                            </div>
                        </div>

                    </CardContent>
                </Card>
            </div>

            <Card className="border-slate-200 shadow-sm">
                <CardHeader className="pb-3 border-b bg-slate-50/50">
                    <div className="flex justify-between items-center">
                        <div className="space-y-1">
                            <CardTitle className="flex items-center gap-2">
                                <MessageSquareTextIcon className="w-5 h-5 text-slate-700" />
                                Recent Feedback
                            </CardTitle>
                            <CardDescription>
                                What others are saying about {user.full_name}
                            </CardDescription>
                        </div>
                        <Badge variant="secondary" className="bg-white">
                            {feedbacks.length} Reviews
                        </Badge>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    {/* SCROLLABLE TABLE CONTAINER */}
                    <div className="max-h-[500px] overflow-y-auto">
                        <Table>
                            <TableHeader className="sticky top-0 bg-white z-10 shadow-sm">
                                <TableRow>
                                    <TableHead className="w-[180px]">From User</TableHead>
                                    <TableHead>Product</TableHead>
                                    <TableHead className="w-[120px]">Rating</TableHead>
                                    <TableHead>Comment</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {feedbacks.length > 0 ? (
                                    feedbacks.map((fb) => (
                                        <TableRow key={fb.feedback_id} className="hover:bg-slate-50/50">
                                            {/* FROM USER */}
                                            <TableCell className="font-medium">
                                                <div className="flex items-center gap-2">
                                                    <Avatar className="w-6 h-6">
                                                        <AvatarFallback className="text-[10px]">
                                                            {fb.from_user.full_name.charAt(0)}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <span className="text-sm text-slate-700">
                                                        {fb.from_user.full_name}
                                                    </span>
                                                </div>
                                            </TableCell>

                                            {/* PRODUCT LINK */}
                                            <TableCell>
                                                <Link 
                                                    to={`/products/${fb.product.product_id}`}
                                                    className="flex items-center gap-1.5 text-blue-600 hover:underline font-medium text-sm group"
                                                >
                                                    <ShoppingBag className="w-3.5 h-3.5 text-blue-400 group-hover:text-blue-600" />
                                                    {fb.product.name}
                                                </Link>
                                            </TableCell>

                                            {/* RATING */}
                                            <TableCell>
                                                {getRatingBadge(fb.rating)}
                                            </TableCell>

                                            {/* COMMENT */}
                                            <TableCell>
                                                <p className="text-sm text-slate-600 italic">
                                                    "{fb.comment}"
                                                </p>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={4} className="h-32 text-center text-muted-foreground italic">
                                            No feedback received yet.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};



export default UserProfilePage;