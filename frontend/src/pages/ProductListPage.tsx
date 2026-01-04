import { useState, useEffect} from 'react';
import { useSearchParams } from 'react-router';
import { useServerPagination } from '../lib/usePagination';
import api from '../lib/axios';

// UI Components
import ProductCardHorizontal from '../components/ProductCardHorizontal';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, SlidersHorizontal, ChevronLeft, ChevronRight } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useDebounce } from '@/lib/useDebounce';

interface Category {
    category_id: number;
    name: string;
}

const ProductListPage = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState(searchParams.get('search') || "");
    const [categoryId, setCategoryId] = useState(searchParams.get('category') || "all");
    const [sortBy, setSortBy] = useState("end_date/ASC");
    const debouncedSearch = useDebounce(search, 500); 
    const { data: products, loading, totalPages, totalItems } = useServerPagination<any>({
        url: '/products', 
        page,
        limit: 5, 
        filters: {
        search: debouncedSearch,
        category: categoryId === "all" ? undefined : categoryId,
        sort: sortBy.split("/")[0],
        order: sortBy.split("/")[1],
        }
    });

    
    const [categories, setCategories] = useState<Category[]>([]);
    useEffect(() => {
        api.get('/categories').then(res => setCategories(res.data.data || [])).catch(console.error);
    }, []);
    useEffect(() => {
        const params: any = {};
        if (debouncedSearch) params.search = debouncedSearch;
        if (categoryId && categoryId !== 'all') params.category = categoryId;
        if (sortBy) params.sort = sortBy;
        setSearchParams(params);
        if (debouncedSearch !== searchParams.get('search')) {
            setPage(1);
        }
        setSearchParams({search, category: categoryId, sort: sortBy, page: page.toString()})
    }, [debouncedSearch, categoryId, sortBy, , setSearchParams])
    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setPage(1); 
        setSearchParams({ search, category: categoryId }); 
    };
 
    return (
        <div className="container mx-auto px-4 py-8 min-h-screen">
        
        {/* --- 1. HEADER & CONTROLS --- */}
        <div className="flex flex-col gap-4 mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Browse Products</h1>
            
            {/* Control Bar */}
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4 items-center justify-between">
            
            {/* Left: Search */}
            <form onSubmit={handleSearch} className="relative w-full md:w-96">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input 
                placeholder="Search products..." 
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                />
            </form>

            {/* Right: Filters */}
            <div className="flex w-full md:w-auto gap-3">
                {/* Category Dropdown */}
                <Select 
                value={categoryId} 
                onValueChange={(val) => { setCategoryId(val); setPage(1); }}
                >
                <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map(cat => (
                    <SelectItem key={cat.category_id} value={String(cat.category_id)}>
                        {cat.name}
                    </SelectItem>
                    ))}
                </SelectContent>
                </Select>

                {/* Sort Dropdown */}
                <Select value={sortBy} onValueChange={(val) => { setSortBy(val); setPage(1); }}>
                <SelectTrigger className="w-[180px]">
                    <SlidersHorizontal className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="Sort By" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="end_date/ASC">Ending Soonest</SelectItem>
                    <SelectItem value="end_date/DESC">Ending Latest</SelectItem>
                    <SelectItem value="price_current/ASC">Price: Low to High</SelectItem>
                    <SelectItem value="price_current/DESC">Price: High to Low</SelectItem>
                </SelectContent>
                </Select>
            </div>
            </div>
        </div>

        {/* --- 2. PRODUCT LIST --- */}
        <div className="space-y-4">
            {loading ? (
            // Loading Skeletons
            Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex h-48 border rounded-lg p-4 gap-4">
                <Skeleton className="w-48 h-full" />
                <div className="flex-1 space-y-2">
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-full" />
                </div>
                </div>
            ))
            ) : products.length > 0 ? (
            // Products
            products.map((product) => (
                <ProductCardHorizontal key={product.product_id} product={product} />
            ))
            ) : (
            // Empty State
            <div className="text-center py-20 text-gray-500">
                <p className="text-xl">No products found matching your criteria.</p>
                <Button variant="link" onClick={() => {setSearch(""); setCategoryId("all");}}>
                Clear Filters
                </Button>
            </div>
            )}
        </div>

        {/* --- 3. PAGINATION BAR --- */}
        {totalPages > 1 && (
            <div className="flex justify-center items-center gap-4 mt-10">
            <Button 
                variant="outline" 
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1 || loading}
            >
                <ChevronLeft className="w-4 h-4 mr-2" /> Previous
            </Button>
            
            <span className="text-sm font-medium text-gray-600">
                Page {page} of {totalPages}
            </span>

            <Button 
                variant="outline" 
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages || loading}
            >
                Next <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
            </div>
        )}
        </div>
  );
};

export default ProductListPage;