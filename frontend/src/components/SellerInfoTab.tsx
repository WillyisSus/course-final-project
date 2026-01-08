import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import api from '@/lib/axios';
import { formatTimeLeft } from '@/lib/utils';
import { Package, CheckCircle, ExternalLink } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from './ui/button';
import { useAppSelector } from '@/store/hooks';
import type { Product } from '@/types/product';

const SellerInfoTab = () => {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const { user } = useAppSelector((state) => state.auth);
    const sellerId = user?.user_id;
    useEffect(() => {
        const fetchSellerProducts = async () => {
            setLoading(true);
            try {
                const res = await api.get(`/products?seller_id=${sellerId}`);
                setProducts(res.data.data || []);
            } catch (error) {
                console.error("Failed to fetch seller products", error);
            } finally {
                setLoading(false);
            }
        };
        if (sellerId) fetchSellerProducts();
    }, [sellerId]);

    const activeProducts = products.filter(p => p.status === 'ACTIVE');
    const finishedProducts = products.filter(p => p.status !== 'ACTIVE');

    if (loading) return <div className="space-y-4"><Skeleton className="h-12 w-full" /><Skeleton className="h-64 w-full" /></div>;

    const renderTable = (data: Product[], emptyMsg: string) => (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow className="bg-muted/50">
                        <TableHead>Product Name</TableHead>
                        <TableHead>Current Price</TableHead>
                        <TableHead>Bids</TableHead>
                        <TableHead>Info</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {data.length > 0 ? data.map(product => (
                        <TableRow key={product.product_id}>
                            <TableCell className="font-medium">{product.name}</TableCell>
                            <TableCell className="font-bold text-primary">${Number(product.price_current).toLocaleString()}</TableCell>
                            <TableCell>{product.bid_count}</TableCell>
                            <TableCell className="text-muted-foreground">
                                {product.status === 'ACTIVE' ? (
                                    <span className="text-orange-600 font-medium">{formatTimeLeft(product.end_date)}</span>
                                ) : (
                                    <span>Winner: {product.winner?.full_name || "None"}</span>
                                )}
                            </TableCell>
                            <TableCell className="text-right">
                                <Button variant="ghost" size="sm" asChild className="h-8 text-blue-600 hover:text-blue-800">
                                    <Link to={`/products/${product.product_id}`}>
                                        View <ExternalLink className="ml-1 w-3 h-3" />
                                    </Link>
                                </Button>
                            </TableCell>
                        </TableRow>
                    )) : (
                        <TableRow>
                            <TableCell colSpan={5} className="h-24 text-center text-muted-foreground italic">{emptyMsg}</TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    );

    return (
        <div className="space-y-8 animate-in fade-in duration-300">
            {/* Active Products Card */}
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <div className="space-y-1">
                            <CardTitle className="flex items-center gap-2"><Package className="w-5 h-5 text-primary" /> Active Auctions</CardTitle>
                            <CardDescription>Products currently open for bidding</CardDescription>
                        </div>
                        <Badge>{activeProducts.length} Active</Badge>
                    </div>
                </CardHeader>
                <CardContent>{renderTable(activeProducts, "No active products found.")}</CardContent>
            </Card>

            {/* Finished Products Card */}
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <div className="space-y-1">
                            <CardTitle className="flex items-center gap-2"><CheckCircle className="w-5 h-5 text-green-600" /> Finished Auctions</CardTitle>
                            <CardDescription>Sold and expired items</CardDescription>
                        </div>
                        <Badge variant="secondary">{finishedProducts.length} Finished</Badge>
                    </div>
                </CardHeader>
                <CardContent>{renderTable(finishedProducts, "No finished auctions yet.")}</CardContent>
            </Card>
        </div>
    );
};

export default SellerInfoTab;