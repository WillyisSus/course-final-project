import { useEffect, useState } from "react";
import { Link } from "react-router";
import api from "@/lib/axios";
import { formatTimeLeft } from "@/lib/utils"; // Imported your utility
import { 
    Package, 
    Search, 
    Eye, 
    Trash2, 
    MoreHorizontal, 
    AlertTriangle,
    Clock
} from "lucide-react";

// UI Components
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import type { Product } from "@/types/product";

const AdminProductsPage = () => {
    // Data States
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    // Modal States
    const [productToDelete, setProductToDelete] = useState<Product | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // --- FETCH DATA ---
    const fetchProducts = async () => {
        setLoading(true);
        try {
            const res = await api.get('/products');
            console.log("Fetched products:", res.data);
            setProducts(res.data.data || []);
        } catch (error) {
            console.error("Failed to fetch products", error);
            toast.error("Failed to load products");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProducts();
    }, []);

    // --- HANDLERS ---
    const handleDeleteClick = (product: Product) => {
        setProductToDelete(product);
    };

    const onDeleteConfirm = async () => {
        if (!productToDelete) return;
        setIsDeleting(true);
        try {
            await api.delete(`/products/${productToDelete.product_id}`);
            toast.success("Product deleted successfully");
            setProductToDelete(null);
            fetchProducts(); 
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to delete product");
        } finally {
            setIsDeleting(false);
        }
    };

    // --- FILTERS ---
    const filteredProducts = products.filter(p => 
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.seller?.full_name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'ACTIVE': return "bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-100";
            case 'SOLD': return "bg-green-100 text-green-700 border-green-200 hover:bg-green-100";
            case 'EXPIRED': return "bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-100";
            default: return "bg-slate-100 text-slate-700 border-slate-200";
        }
    };

    if (loading) {
        return (
            <div className="space-y-4">
                <Skeleton className="h-10 w-48" />
                <Card><CardHeader><Skeleton className="h-8 w-64" /></CardHeader><CardContent><Skeleton className="h-96 w-full" /></CardContent></Card>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-300 pb-10">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Products</h1>
                    <p className="text-muted-foreground text-sm mt-1">
                        Manage all listings in the marketplace.
                    </p>
                </div>
            </div>

            {/* Main Table */}
            <Card className="border-slate-200 shadow-sm">
                <CardHeader className="pb-3 border-b bg-slate-50/50">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div className="space-y-1">
                            <CardTitle className="flex items-center gap-2">
                                <Package className="w-5 h-5 text-slate-700" />
                                All Products
                            </CardTitle>
                            <CardDescription>
                                Total of {filteredProducts.length} products found.
                            </CardDescription>
                        </div>
                        <div className="relative w-full max-w-sm">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                            <Input
                                placeholder="Search by name or seller..."
                                className="pl-9 bg-white"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="max-h-[680px] overflow-y-auto">
                        <Table>
                            <TableHeader className="sticky top-0 bg-white z-10 shadow-sm">
                                <TableRow>
                                    <TableHead className="w-20">ID</TableHead>
                                    <TableHead className="min-w-[200px]">Product Name</TableHead>
                                    <TableHead>Seller</TableHead>
                                    <TableHead>Prices</TableHead>
                                    <TableHead className="text-center">Bids</TableHead>
                                    <TableHead>Times to End</TableHead> 
                                    <TableHead>Status</TableHead>
                                    <TableHead>Winner</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredProducts.length > 0 ? (
                                    filteredProducts.map((product) => (
                                        <TableRow key={product.product_id} className="hover:bg-slate-50/50">
                                            <TableCell className="font-mono text-xs text-muted-foreground">
                                                #{product.product_id}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span className="font-medium truncate max-w-[200px]" title={product.name}>
                                                        {product.name}
                                                    </span>
                                                    <span className="text-xs text-muted-foreground">
                                                        {product.category?.name || "Uncategorized"}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <span className="text-sm text-slate-700">
                                                    {product.seller?.full_name || `User #${product.seller_id}`}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col text-sm">
                                                    <span className="font-semibold text-slate-900">
                                                        Now: ₫{Number(product.price_current).toLocaleString()}
                                                    </span>
                                                    <span className="text-xs text-muted-foreground">
                                                        Start: ₫{Number(product.price_start).toLocaleString()}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <Badge variant="secondary" className="font-mono">
                                                    {product.bid_count || 0}
                                                </Badge>
                                            </TableCell>
                                            
                                            {/* ✅ Times to End Column */}
                                            <TableCell>
                                                <div className="flex items-center gap-1.5 text-sm font-medium text-slate-600">
                                                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                                                    {/* Using your custom formatTimeLeft function */}
                                                    {product.status === 'ACTIVE' 
                                                        ? formatTimeLeft(product.end_date)
                                                        : <span className="text-slate-400">Ended</span>
                                                    }
                                                </div>
                                            </TableCell>

                                            <TableCell>
                                                <Badge variant="outline" className={`${getStatusBadge(product.status)}`}>
                                                    {product.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                {product.winner ? (
                                                    <span className="text-sm font-medium text-green-700">
                                                        {product.winner.full_name}
                                                    </span>
                                                ) : (
                                                    <span className="text-xs text-slate-400 italic">None</span>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8">
                                                            <MoreHorizontal className="w-4 h-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                        <DropdownMenuItem asChild>
                                                            <Link to={`/products/${product.product_id}`} target="_blank" className="cursor-pointer">
                                                                <Eye className="mr-2 w-4 h-4" /> View Details
                                                            </Link>
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem 
                                                            className="text-red-600 focus:text-red-600 focus:bg-red-50 cursor-pointer"
                                                            onClick={() => handleDeleteClick(product)}
                                                        >
                                                            <Trash2 className="mr-2 w-4 h-4" /> Delete Product
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={9} className="h-32 text-center text-muted-foreground">
                                            No products found matching your search.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            {/* --- ALERT: DELETE PRODUCT --- */}
            <AlertDialog open={!!productToDelete} onOpenChange={(open) => !open && setProductToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2 text-red-600">
                            <AlertTriangle className="w-5 h-5" />
                            Confirm Deletion
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete the product <span className="font-bold text-slate-900">{productToDelete?.name}</span>?
                            <br /><br />
                            This action cannot be undone. It will remove the product, all associated bids, and transaction history.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                        <AlertDialogAction 
                            onClick={onDeleteConfirm} 
                            disabled={isDeleting}
                            className="bg-red-600 hover:bg-red-700 text-white"
                        >
                            {isDeleting ? "Deleting..." : "Delete Product"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};

export default AdminProductsPage;