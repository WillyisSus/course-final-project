import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import api from '@/lib/axios';
import { Ban, Unlock, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { toast } from 'sonner';

interface BlockedBidder {
    product_id: number;
    user_id: number;
    reason: string;
    blocked_at: string;
    product: {
        product_id: number;
        name: string;
    };
    user: { // The bidder
        user_id: number;
        full_name: string;
        email: string;
    };
}

const BlockedBidderTab = () => {
    const [blockedList, setBlockedList] = useState<BlockedBidder[]>([]);
    const [loading, setLoading] = useState(true);
    const [unblockTarget, setUnblockTarget] = useState<BlockedBidder | null>(null);

    // Fetch data
    useEffect(() => {
        const fetchBlockedBidders = async () => {
            try {
                // Adjust endpoint to match your backend
                const res = await api.get('/blocked-bidders/bidders'); 
                setBlockedList(res.data.data || []);
            } catch (error) {
                console.error("Failed to fetch blocked bidders", error);
            } finally {
                setLoading(false);
            }
        };
        fetchBlockedBidders();
    }, []);

    const handleUnblock = async () => {
        if (!unblockTarget) return;
        try {
            await api.post(`/blocked-bidders/unblock-bidder`, {
                product_id: unblockTarget.product_id,
                user_id: unblockTarget.user_id
            });
            
            toast.success(`Unblocked ${unblockTarget.user.full_name}`);
            setBlockedList(prev => prev.filter(item => item.product_id !== unblockTarget.product_id || item.user_id !== unblockTarget.user_id));
            setUnblockTarget(null);
        } catch (error) {
            toast.error("Failed to unblock user.");
        }
    };

    if (loading) return <Skeleton className="h-64 w-full" />;

    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <div className="space-y-1">
                            <CardTitle className="flex items-center gap-2 text-red-700">
                                <Ban className="w-5 h-5" /> Blocked Bidders
                            </CardTitle>
                            <CardDescription>
                                Users you have blocked from bidding on your products.
                            </CardDescription>
                        </div>
                        <Badge variant="outline" className="text-red-600 border-red-200">
                            {blockedList.length} Blocked
                        </Badge>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-muted/50">
                                    <TableHead>Blocked At</TableHead>
                                    <TableHead>Product</TableHead>
                                    <TableHead>Bidder</TableHead>
                                    <TableHead>Reason</TableHead>
                                    <TableHead className="text-right">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {blockedList.length > 0 ? blockedList.map((item, index) => (
                                    <TableRow key={index}>
                                        <TableCell className="text-sm text-muted-foreground">
                                            {new Date(item.blocked_at).toLocaleDateString()}
                                        </TableCell>
                                        <TableCell className="font-medium">
                                            <Link to={`/products/${item.product_id}`} className="hover:underline flex items-center gap-1 text-blue-600">
                                                {item.product.name} <ExternalLink className="w-3 h-3"/>
                                            </Link>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="font-medium">{item.user.full_name}</span>
                                                <span className="text-xs text-muted-foreground">{item.user.email}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="max-w-[200px] truncate" title={item.reason}>
                                            {item.reason || "No reason provided"}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button 
                                                variant="outline" 
                                                size="sm" 
                                                className="text-green-600 border-green-200 hover:bg-green-50"
                                                onClick={() => setUnblockTarget(item)}
                                            >
                                                <Unlock className="w-3 h-3 mr-1" /> Unblock
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                )) : (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-24 text-center text-muted-foreground italic">
                                            You haven't blocked anyone yet.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            <Dialog open={!!unblockTarget} onOpenChange={(open) => !open && setUnblockTarget(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Unblock Bidder</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to unblock <strong>{unblockTarget?.user.full_name}</strong>? 
                            They will be able to bid on <strong>{unblockTarget?.product.name}</strong> again.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setUnblockTarget(null)}>Cancel</Button>
                        <Button onClick={handleUnblock} className="bg-green-600 hover:bg-green-700">Confirm Unblock</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default BlockedBidderTab;