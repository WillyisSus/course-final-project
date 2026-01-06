import { useEffect, useRef, useState } from 'react';
import { useParams, Link } from 'react-router'; 
import { formatTimeLeft } from '../lib/utils';
import { io, Socket } from 'socket.io-client';
import { Clock, User as UserIcon, Tag, HandCoinsIcon, ClipboardList } from 'lucide-react';
import { toast } from 'sonner'; // Ensure you have this installed, or remove toast calls
import api from '@/lib/axios';
// Components
import ProductGallery from '../components/ProductGallery';
import BiddingSection from '../components/BiddingSection';
import CommentSection from '../components/CommentSection';
import { ProductCard } from '../components/ProductCard'; 
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import type { Product, ProductComment } from '@/types/product';
import type { Bid, CreateBid, AutoBid } from '@/types/bid';

const ProductDetailPage = () => {
    const { id } = useParams();
    const [product, setProduct] = useState<Product>(new Object() as Product);
    const [relatedProducts, setRelatedProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [bidsHistory, setBidsHistory] = useState<Bid[]>([]);
    const [comments, setComments] = useState<ProductComment[]>([]);
    const [currentAutoBid, setCurrentAutoBid] = useState<AutoBid | null>(null);
    const [priceChanged, setPriceChanged] = useState(false); 
    const socketRef = useRef<Socket | null>(null);

    // --- FETCH DATA---
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
        if (id) fetchBidsHistory();
    }, [id]);

    useEffect(() => {
        const fetchComments = async () => {
            try {
                const res = await api.get(`/comments?product_id=${id}`);
                setComments(res.data.data || []);
            } catch (error) {
                console.error("Failed to load current comment", error);
                setComments([]);
            }
        };
        if (id) fetchComments();
    }, [id]);
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
        if (id) fetchCurrentAutoBid();
    }, [id]);
    // --- SOCKET CONNECTION ---
    useEffect(() => {
        socketRef.current = io("http://localhost:3000");
        socketRef.current.emit("join_product", id);

        socketRef.current.on("product_updated", (payload: any) => {
            console.log("Real-time update:", payload);

            if (payload.type === 'BID_PLACED') {
                // 1. Update Product Data
                setProduct(payload.data?.product);
                if (payload.data.newBid){
                    setBidsHistory((prev) => [payload.data.newBid, ...prev]);
                }
                // 2. Trigger Flash Animation
                setPriceChanged(true);
                setTimeout(() => setPriceChanged(false), 2000); 

                // 3. Optional Toast
                // Ensure 'toast' is imported from 'sonner' or your library
                toast.success(`New Bid! Price is now $${Number(payload.data.product.price_current).toLocaleString()}`);
            }
        });
        socketRef.current.on("new_comment", (payload: {type: string, data: object}) => {
            console.log("New comment received:", payload.data);
            // Optionally, you can refresh comments or append the new comment
            // For simplicity, we'll just log it here
            if (payload.type === 'NEW_COMMENT'){
                if (payload.data){
                    setComments((prev) => [payload.data as ProductComment, ...prev]);
                }
            }
        });
        socketRef.current.on("disconnect", () => {
            console.log("Socket disconnected");
        });
        socketRef.current.on("error", (error: any) => {
            console.error("Socket error:", error);
        });
        return () => {
            if (socketRef.current) {
                socketRef.current.emit("leave_product", id);
                socketRef.current.disconnect();
            }
        };
    }, [id]);

    // --- HANDLERS ---
    const handlePlaceBid = async (amount: number) => {
        try {
            if (currentAutoBid){
                const payload: CreateBid = { max_price: amount };
                await api.put(`/auto-bids/${currentAutoBid.auto_bid_id}`, payload);
                toast.success("Bid updated successfully!");
            } else {
                const payload: CreateBid = {
                    product_id: Number(id),
                    max_price: amount,
                };
                await api.post('/auto-bids', payload);
                toast.success("Bid placed successfully!");
            }
            // No need to manually refresh product here; socket handles it!
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to place bid");
        }
    };

    const handlePostComment = async (content: string, parent_id: number|null = null) => {
        console.log("Posting comment:", content);
        try {
            const payload = {
                product_id: Number(id),
                content,
                parent_id: parent_id
            }
            await api.post('/comments', payload);
            toast.success("Comment posted successfully!");
        } catch (error) {
            toast.error("Failed to post comment. Please try again.");
            console.error("Failed to post comment", error);
        }
    };

    const scrollToBidding = () => {
        const section = document.getElementById('bidding-section');
        if (section) section.scrollIntoView({ behavior: 'smooth' });
    };

    if (loading) return <div className="container py-10"><Skeleton className="h-[500px] w-full" /></div>;
    if (!product) return <div className="container py-10 text-center">Product not found</div>;

    return (
        <div className="container mx-auto space-y-8 pb-12">
        
        {/* OVERVIEW SECTION */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 lg:p-8 shadow-sm">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            
            <ProductGallery images={product.product_images} productName={product.name} />

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

                <div className="bg-gray-50 p-6 rounded-xl border border-gray-100 space-y-5">
                    <div className="flex items-start justify-between">
                        
                        <div className="space-y-1">
                            <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Current Price</p>
                            
                            {/* --- 2. UPDATE THIS LINE TO USE ANIMATION CLASSES --- */}
                            <p className={`text-4xl font-black transition-all duration-500 ${
                                priceChanged ? 'text-green-600 scale-110 origin-left' : 'text-blue-600'
                            }`}>
                                ${Number(product.price_current).toLocaleString()}
                            </p>
                        </div>

                        <div className="text-right space-y-2">
                            <Badge variant="secondary" className="px-3 py-1 text-sm">{product.bid_count || 0} Bids</Badge>
                            <div className="flex items-center justify-end gap-1.5 text-orange-600 font-bold text-lg">
                                <Clock className="w-5 h-5" />
                                {formatTimeLeft(product.end_date)}
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col items-center justify-between bg-white p-4 rounded-lg border border-dashed border-gray-300 shadow-sm">
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

        {/* DESCRIPTION SECTION */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 lg:p-8 shadow-sm space-y-4">
            <h2 className="text-2xl font-bold border-b pb-4 text-gray-900">Description</h2>
            <div className="min-h-[100px]">
            {product.product_descriptions && product.product_descriptions.length > 0 ? (
                <div className="space-y-3">
                {product.product_descriptions.map((desc: any, idx: number) => (
                    <div key={idx} className="flex gap-4 p-4 bg-gray-50 rounded-lg border border-gray-100 hover:border-blue-100 transition-colors">
                    <div className="mt-1 w-2 h-2 bg-blue-500 rounded-full shrink-0 shadow-sm" />
                    <div className="space-y-1">
                        <p className="text-gray-800 leading-relaxed">
                        {typeof desc === 'string' ? desc : (desc.text || desc.content)}
                        </p>
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

        {/* BIDDING SECTION */}
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

        {/* COMMENTS SECTION */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 lg:p-8 shadow-sm space-y-4">
            <h2 className="text-2xl font-bold border-b pb-4 text-gray-900">Community Q&A</h2>
            <CommentSection 
                comments={comments || []}
                onPostComment={handlePostComment}
            />
        </div>

        {/* RELATED PRODUCTS */}
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