import { useEffect, useState } from "react";
import { Link } from "react-router";
import api from "@/lib/axios";
import { useAppSelector } from "@/store/hooks";
import { 
    MessageSquareQuote, 
    ThumbsUp, 
    ThumbsDown, 
    ExternalLink, 
    User as UserIcon,
    ShoppingBag
} from "lucide-react";

// UI Components
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

// --- TYPES ---
interface Feedback {
    feedback_id: number;
    rating: number; // 1 for Good, -1 for Bad
    comment: string;
    created_at?: string;
    from_user: {
        user_id: number;
        full_name: string;
    };
    product: {
        product_id: number;
        name: string;
    };
}

const FeedbackTab = () => {
    const { user } = useAppSelector((state) => state.auth);
    const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchFeedbacks = async () => {
            if (!user?.user_id) return;
            
            try {
                // Fetch feedbacks specifically for the logged-in user
                const res = await api.get(`/feedbacks?user_id=${user.user_id}`);
                setFeedbacks(res.data.data || []);
            } catch (error) {
                console.error("Failed to fetch feedbacks", error);
            } finally {
                setLoading(false);
            }
        };

        fetchFeedbacks();
    }, [user]);

    // Helper for Rating Badge
    const getRatingBadge = (rating: number) => {
        if (rating >= 1) {
            return (
                <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-green-200 gap-1 pl-1.5">
                    <ThumbsUp className="w-3 h-3" /> Positive
                </Badge>
            );
        }
        return (
            <Badge className="bg-red-100 text-red-700 hover:bg-red-100 border-red-200 gap-1 pl-1.5">
                <ThumbsDown className="w-3 h-3" /> Negative
            </Badge>
        );
    };

    if (loading) return <Skeleton className="h-64 w-full" />;

    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <div className="space-y-1">
                            <CardTitle className="flex items-center gap-2 text-blue-600">
                                <MessageSquareQuote className="w-5 h-5" /> My Feedback
                            </CardTitle>
                            <CardDescription>
                                Reviews and ratings you have received from other users.
                            </CardDescription>
                        </div>
                        <Badge variant="outline" className="text-blue-600 border-blue-200">
                            {feedbacks.length} Total
                        </Badge>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-muted/50">
                                    <TableHead className="w-[200px]">From User</TableHead>
                                    <TableHead className="min-w-[200px]">Product</TableHead>
                                    <TableHead className="w-[120px]">Rating</TableHead>
                                    <TableHead>Comment</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {feedbacks.length > 0 ? (
                                    feedbacks.map((fb) => (
                                        <TableRow key={fb.feedback_id}>
                                            {/* FROM USER */}
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <Avatar className="h-6 w-6">
                                                        <AvatarFallback className="text-[10px] bg-slate-100 text-slate-600 font-bold">
                                                            {fb.from_user.full_name?.charAt(0) || "U"}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <span className="font-medium text-slate-700 truncate max-w-[150px]" title={fb.from_user.full_name}>
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
                                                <p className="text-sm text-slate-600 italic line-clamp-2" title={fb.comment}>
                                                    "{fb.comment}"
                                                </p>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-32 text-center text-muted-foreground italic">
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

export default FeedbackTab;