import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import api from '@/lib/axios';
import { AlertCircle, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

interface BlockedByRecord {
    user_id: number;
    product_id: number;
    reason: string;
    blocked_at: string;
    product: {
        product_id: number;
        name: string;
        seller_id: number;
        seller: {
            user_id: number;
            full_name: string;
            email: string;
        }
    };
}

const BlockedByProductTab = () => {
    const [blockedList, setBlockedList] = useState<BlockedByRecord[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchBlockedBy = async () => {
            try {
                // Adjust endpoint to match your backend
                const res = await api.get('/blocked-bidders/products'); 
                setBlockedList(res.data.data || []);
            } catch (error) {
                console.error("Failed to fetch blocked-by list", error);
            } finally {
                setLoading(false);
            }
        };
        fetchBlockedBy();
    }, []);

    if (loading) return <Skeleton className="h-64 w-full" />;

    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            <Card className="border-red-100 bg-red-50/10">
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <div className="space-y-1">
                            <CardTitle className="flex items-center gap-2 text-gray-900">
                                <AlertCircle className="w-5 h-5 text-red-500" /> Account Restrictions
                            </CardTitle>
                            <CardDescription>
                                Products where you have been restricted from bidding by the seller.
                            </CardDescription>
                        </div>
                        <Badge variant="secondary">{blockedList.length} Restrictions</Badge>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border bg-white">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-muted/50">
                                    <TableHead>Blocked At</TableHead>
                                    <TableHead>Product</TableHead>
                                    <TableHead>Seller</TableHead>
                                    <TableHead>Reason Given</TableHead>
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
                                        <TableCell>{item.product.seller.full_name}</TableCell>
                                        <TableCell className="text-red-600 italic">
                                            "{item.reason || "No reason specified"}"
                                        </TableCell>
                                    </TableRow>
                                )) : (
                                    <TableRow>
                                        <TableCell colSpan={4} className="h-24 text-center text-muted-foreground italic">
                                            You have no active restrictions.
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

export default BlockedByProductTab;