import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import api from '@/lib/axios';
import { Heart, ExternalLink, Eye } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

interface FavoriteProduct {
    product_id: number;
    added_at: string;
    product: {
        product_id: number;
        name: string;
        price_current: number;
        status: string;
        seller: {
            user_id: number;
            full_name: string;
        };
    };
}

const FavoriteProductTab = () => {
    const [favoriteList, setFavoriteList] = useState<FavoriteProduct[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchFavorites = async () => {
            try {
                const res = await api.get('/watchlists');
                setFavoriteList(res.data.data || []);
            } catch (error) {
                console.error("Failed to fetch favorite products", error);
            } finally {
                setLoading(false);
            }
        };
        fetchFavorites();
    }, []);

    if (loading) return <Skeleton className="h-64 w-full" />;

    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <div className="space-y-1">
                            <CardTitle className="flex items-center gap-2 text-red-600">
                                <Heart className="w-5 h-5 fill-current" /> Favorite Products
                            </CardTitle>
                            <CardDescription>
                                Products you've added to your watchlist.
                            </CardDescription>
                        </div>
                        <Badge variant="outline" className="text-red-600 border-red-200">
                            {favoriteList.length} Favorites
                        </Badge>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-muted/50">
                                    <TableHead>Product Name</TableHead>
                                    <TableHead>Seller</TableHead>
                                    <TableHead>Current Price</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">View</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {favoriteList.length > 0 ? favoriteList.map((item, index) => (
                                    <TableRow key={index}>
                                        <TableCell className="font-medium max-w-[300px]">
                                            {item.product.name}
                                        </TableCell>
                                        <TableCell>
                                            <span className="font-medium text-gray-700">
                                                {item.product.seller.full_name}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            <span className="font-bold text-blue-600">
                                                ₫{Number(item.product.price_current).toLocaleString()}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            <Badge 
                                                variant={item.product.status === 'ACTIVE' ? 'default' : 'secondary'}
                                                className={item.product.status === 'ACTIVE' ? 'bg-green-100 text-green-700 hover:bg-green-100' : ''}
                                            >
                                                {item.product.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button 
                                                asChild
                                                variant="ghost" 
                                                size="sm" 
                                                className="text-blue-600 border-blue-200 hover:text-blue-800"
                                            >
                                                <Link to={`/products/${item.product.product_id}`}>
                                                    View <ExternalLink className="ml-1 w-3 h-3" />
                                                </Link>
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                )) : (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-24 text-center text-muted-foreground italic">
                                            You haven't added any products to your favorites yet.
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

export default FavoriteProductTab;
