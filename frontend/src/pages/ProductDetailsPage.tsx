import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router';
import api from '../lib/axios';
import { formatTimeLeft } from '../lib/utils';
import { Clock, User as UserIcon, Tag, ArrowDown, Gavel, HandCoinsIcon, ClipboardList } from 'lucide-react'; // Added Gavel icon

// Components
import ProductGallery from '../components/ProductGallery';
import BiddingSection from '../components/BiddingSection';
import CommentSection from '../components/CommentSection';
import { ProductCard } from '../components/ProductCard'; 
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button'; // Import Button
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import type { Product } from '@/types/product';
import type { Bid, CreateBid, AutoBid } from '@/types/bid';

const ProductDetailPage = () => {
    const { id } = useParams();
    const [product, setProduct] = useState<Product>(new Object() as Product);
    const [relatedProducts, setRelatedProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [bidsHistory, setBidsHistory] = useState<Bid[]>([]);
    const [currentAutoBid, setCurrentAutoBid] = useState<AutoBid | null>(null);
    // --- 1. FETCH DATA ---
    useEffect(() => {
        const fetchData = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/products/${id}`);
            setProduct(res.data.data as Product);

            if (res.data.data.category_id) {
            const relatedRes = await api.get(`/products?category_id=${res.data.data.category_id}&limit=6`);
            const filtered = relatedRes.data.data.filter((p: any) => p.product_id !== Number(id)).slice(0, 5);
            setRelatedProducts(filtered);
            }
        } catch (error) {
            console.error("Failed to load product", error);
        } finally {
            setLoading(false);
        }
        };
        fetchData();
    }, [id]);
    useEffect(() => {
        const fetchBidsHistory = async () => {
        try {
            const res = await api.get(`/bids?product_id=${id}`);
            setBidsHistory(res.data.data || []);
        } catch (error) {
            console.error("Failed to load bids history", error);
            setBidsHistory([]);
        }
        };
        if (id) {
        fetchBidsHistory();
        }
    }, [id]);

    // --- 3. FETCH CURRENT AUTO BID ---
    useEffect(() => {
        const fetchCurrentAutoBid = async () => {
            try {
                const res = await api.get(`/auto-bids?product_id=${id}`);
                setCurrentAutoBid(res.data.data || null);
            } catch (error) {
                console.error("Failed to load current auto bid", error);
                setCurrentAutoBid(null);
            }
        };
        if (id) {
            fetchCurrentAutoBid();
        }
    }, [id]);

    // --- HANDLERS ---
    const handlePlaceBid = async (amount: number) => {
        try {
            const payload: CreateBid = {
                product_id: Number(id),
                max_price: amount,
            }
            await api.post('/auto-bids', payload);
            alert("Bid placed successfully!");
        } catch (error: any) {
            alert(error.response?.data?.message || "Failed to place bid");
        }
    };

    const handlePostComment = async (content: string) => {
        console.log("Posting comment:", content);
    };

    // --- SCROLL FUNCTION ---
    const scrollToBidding = () => {
        const section = document.getElementById('bidding-section');
        if (section) {
        section.scrollIntoView({ behavior: 'smooth' });
        }
    };

    if (loading) return <div className="container py-10"><Skeleton className="h-[500px] w-full" /></div>;
    if (!product) return <div className="container py-10 text-center">Product not found</div>;

    return (
        <div className="container mx-auto space-y-8 pb-12">
        
        {/* SECTION 1: OVERVIEW CARD */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 lg:p-8 shadow-sm">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            
            {/* Left: Gallery */}
            <ProductGallery images={product.product_images} productName={product.name} />

            {/* Right: Info */}
            <div className="space-y-6">
                <div>
                <h1 className="text-3xl font-black text-gray-900 mb-3 leading-tight">{product.name}</h1>
                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                    <span className="flex items-center gap-1 bg-gray-100 px-3 py-1 rounded-full">
                        <Tag className="w-3.5 h-3.5" /> {product.category?.name}
                    </span>
                    <span className="flex items-center gap-1">
                        <UserIcon className="w-4 h-4" /> Seller: <span className="font-medium text-gray-700">{product.seller?.full_name}</span>
                    </span>
                </div>
                </div>

                <Separator />

                {/* Pricing Box */}
                <div className="bg-gray-50 p-6 rounded-xl border border-gray-100 space-y-5">
                <div className="flex items-start justify-between">
                    
                    {/* --- UPDATED: Price, Step, Bidder grouped here --- */}
                    <div className="space-y-1">
                    <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Current Price</p>
                    <p className="text-4xl font-black text-blue-600">
                        ${Number(product.price_current).toLocaleString()}
                    </p>
                    
                    
                    </div>

                    {/* Right Side: Counts & Time */}
                    <div className="text-right space-y-2">
                    <Badge variant="secondary" className="px-3 py-1 text-sm">{product.bid_count || 0} Bids</Badge>
                    <div className="flex items-center justify-end gap-1.5 text-orange-600 font-bold text-lg">
                        <Clock className="w-5 h-5" />
                        {formatTimeLeft(product.end_date)}
                    </div>
                    </div>
                </div>

                    <div className="flex flex-col items-center justify-between bg-white p-4 rounded-lg border border-dashed border-gray-300 shadow-sm">
                            {/* Buy Now (Optional) */}
                            {product.price_buy_now && (
                                <div className='w-full flex items-center justify-between'>
                                    <span className="text-sm font-medium text-gray-600">Buy Now Price</span>
                                    <span className="text-xl font-bold text-gray-900">${Number(product.price_buy_now).toLocaleString()}</span>
                                </div>
                            )}
                            <div className='w-full flex items-center justify-between'>
                                <span className="text-sm font-medium text-gray-600">Step</span>
                                <span className="text-xl font-bold text-gray-900">${Number(product.price_step).toLocaleString()}</span>
                            </div>
                            <div className='w-full flex items-center justify-between'>
                                <span className="text-sm font-medium text-gray-600">Highest Bidder</span>
                                <span className="text-xl font-bold text-gray-900">{(product?.winner?.full_name)}</span>
                            </div>
                    </div>
                {/* --- UPDATED: Go To Bid Button --- */}
                <Button 
                    onClick={scrollToBidding} 
                    className="w-full h-12 text-lg font-bold bg-blue-600 hover:bg-blue-700 shadow-md transition-all flex items-center gap-2"
                >
                    <HandCoinsIcon className="w-8 h-8" />
                    Go to Bid
                </Button>
                </div>
            </div>
            </div>
        </div>

        {/* SECTION 2: DESCRIPTION */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 lg:p-8 shadow-sm space-y-4">
            <h2 className="text-2xl font-bold border-b pb-4 text-gray-900">Description</h2>
            
            <div className="min-h-[100px]">
            {product.product_descriptions && product.product_descriptions.length > 0 ? (
                // CASE A: Render List of Descriptions
                <div className="space-y-3">
                {product.product_descriptions.map((desc: any, idx: number) => (
                    <div key={idx} className="flex gap-4 p-4 bg-gray-50 rounded-lg border border-gray-100 hover:border-blue-100 transition-colors">
                    {/* Bullet / Icon */}
                    <div className="mt-1 w-2 h-2 bg-blue-500 rounded-full shrink-0 shadow-sm" />
                    
                    {/* Content */}
                    <div className="space-y-1">
                        <p className="text-gray-800 leading-relaxed">
                        {/* Handle both object structure or simple string array */}
                        {typeof desc === 'string' ? desc : (desc.text || desc.content)}
                        </p>
                        {/* Optional: Show timestamp if available in your record */}
                        {desc.created_at && (
                        <p className="text-xs text-gray-400 font-medium">
                            Added on {new Date(desc.created_at).toLocaleDateString()}
                        </p>
                        )}
                    </div>
                    </div>
                ))}
                </div>
            ) : (
                // CASE C: Empty State
                <div className="flex flex-col items-center justify-center py-12 text-center bg-gray-50/50 rounded-xl border-2 border-dashed border-gray-200">
                <div className="bg-gray-100 p-4 rounded-full mb-3">
                    <ClipboardList className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">No Description Available</h3>
                <p className="text-sm text-gray-500 max-w-xs mt-1">
                    The seller has not added any detailed descriptions for this item yet.
                </p>
                </div>
            )}
            </div>
        </div>

        {/* SECTION 3: BIDDING CARD (Added ID for scrolling) */}
        <div id="bidding-section" className="bg-white border border-gray-200 rounded-xl p-6 lg:p-8 shadow-sm space-y-4 scroll-mt-24">
            <h2 className="text-2xl font-bold border-b pb-4 text-gray-900">Bidding & History</h2>
            <BiddingSection 
            currentPrice={Number(product.price_current)}
            bidHistory={bidsHistory || []}
            onPlaceBid={handlePlaceBid}
            currentAutoBid={currentAutoBid}
            step={Number(product.price_step)}
            productId={product.product_id}
            />
        </div>

        {/* SECTION 4: COMMENTS */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 lg:p-8 shadow-sm space-y-4">
            <h2 className="text-2xl font-bold border-b pb-4 text-gray-900">Community Q&A</h2>
            <CommentSection 
            comments={product.comments || []}
            onPostComment={handlePostComment}
            />
        </div>

        {/* SECTION 5: RELATED PRODUCTS */}
        <div className="space-y-6 pt-4">
            <div className="flex items-center justify-between px-2">
            <h2 className="text-2xl font-bold text-gray-900">More from {product.category?.name}</h2>
            <Link to={`/products?category=${product.category_id}`} className="text-blue-600 font-semibold hover:underline">
                View All
            </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
            {relatedProducts.map(p => (
                <div key={p.product_id} className="h-[450px]">
                    <ProductCard product={p} />
                </div>
            ))}
            </div>
        </div>
        
        </div>
    );
};

export default ProductDetailPage;