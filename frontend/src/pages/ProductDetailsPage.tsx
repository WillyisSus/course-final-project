import { useEffect, useRef, useState } from 'react';
import { useParams, Link } from 'react-router'; 
import { formatTimeLeft } from '../lib/utils';
import { io, Socket } from 'socket.io-client';
import { Clock, User as UserIcon, Tag, HandCoinsIcon, Pencil, TextQuoteIcon } from 'lucide-react';
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
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import type { Product, ProductComment } from '@/types/product';
import type { Bid, CreateBid, AutoBid } from '@/types/bid';
import { useAppSelector } from '@/store/hooks';

const ProductDetailPage = () => {
    const { id } = useParams();
    const [product, setProduct] = useState<Product>(new Object() as Product);
    const [relatedProducts, setRelatedProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [bidsHistory, setBidsHistory] = useState<Bid[]>([]);
    const [comments, setComments] = useState<ProductComment[]>([]);
    const [currentAutoBid, setCurrentAutoBid] = useState<AutoBid | null>(null);
    const [priceChanged, setPriceChanged] = useState(false);
    const [isBuyNowModalOpen, setIsBuyNowModalOpen] = useState(false);
    const socketRef = useRef<Socket | null>(null);
    const {user} = useAppSelector(state => state.auth);
    const isOwner = Boolean(user && product.seller_id && (user.user_id === product.seller_id));
    const isExpired = product.status === 'SOLD' || product.status === 'EXPIRED' || new Date(product.end_date) < new Date();
    const isWinner = Boolean(user && product.winner_id === user.user_id);
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
            try {``
                const res = await api.get(`/bids?product_id=${id}`);
                setBidsHistory(res.data.data);
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
                setComments([...res.data.data]);
                console.log("Fetched comments:", comments.length);

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
                setCurrentAutoBid(res.data.data[0]   || null);
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
                setProduct(payload.data?.product);
                if (payload.data.newBid){
                    setBidsHistory((prev) => [payload.data.newBid, ...prev]);
                }
                setPriceChanged(true);
                setTimeout(() => setPriceChanged(false), 2000); 

                toast.success(`New Bid! Price is now $${Number(payload.data.product.price_current).toLocaleString()}`);
            }
        });
        socketRef.current.on("new_comment", (payload: {type: string, data: object}) => {
            if (payload.type === 'NEW_COMMENT'){
                if (isOwner){
                    toast.success("New question posted!", {duration: 1000});
                }        
                if (payload.data){
                    setComments((prev) => [payload.data as ProductComment, ...prev]);
                }
            }else if (payload.type === "REPLY_COMMENT"){
                if (payload.data){
                    setComments((prev) => {
                        const newReply = payload.data as ProductComment;
                        const parentId = newReply.parent_id; 
                        return prev.map(comment => {
                            if (comment.comment_id === parentId) {
                                return {
                                    ...comment, 
                                    replies: [
                                        ...(comment.replies || []), 
                                        newReply
                                    ]
                                };
                            }
                            return comment;
                        });
                    })
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
    const handleBuyNow = async () => {
        // TODO: Implement buy now logic here
        // Close modal after implementation
        setIsBuyNowModalOpen(false);
    }
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
                        <div className="flex justify-between items-start">
                            <h1 className="text-3xl font-black text-gray-900 mb-3 leading-tight">{product.name}</h1>
                        
                        </div>
                        
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

                    {/* Pricing Box - Change color if owner */}
                    <div className={`p-6 rounded-xl border space-y-5 ${isOwner ? 'bg-amber-50 border-amber-200' : isWinner ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-100'}`}>
                        <div className="flex items-start justify-between">
                            <div className="space-y-1">
                                <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">
                                    {isExpired ? "Final Price" : "Current Price"}
                                </p>
                                <p className={`text-4xl font-black transition-all duration-500 ${
                                    priceChanged ? 'text-green-600 scale-110 origin-left' : 'text-blue-600'
                                }`}>
                                    {product.price_current ? `₫${(Number(product.price_current)*1000).toLocaleString()}` : 'No bids yet'}
                                </p>
                            </div>
                            <div className="text-right space-y-2">
                                <Badge variant={isExpired ? "secondary" : "default"} className="px-3 py-1 text-sm">
                                    {product.bid_count || 0} Bids
                                </Badge>
                                <div className={`flex items-center justify-end gap-1.5 font-bold text-lg ${isExpired ? 'text-gray-500' : 'text-orange-600'}`}>
                                    <Clock className="w-5 h-5" />
                                    {isExpired ? "Ended" : formatTimeLeft(product.end_date)}
                                </div>
                            </div>
                        </div>

                        {/* Price Details Grid */}
                        <div className="flex flex-col items-center justify-between bg-white p-4 rounded-lg border border-dashed border-gray-300 shadow-sm">
                                {product.price_buy_now && (
                                    <div className='w-full flex items-center justify-between'>
                                        <span className="text-sm font-medium text-gray-600">Buy Now Price</span>
                                        <span className="text-xl font-bold text-gray-900">₫{(Number(product.price_buy_now)*1000).toLocaleString()}</span>
                                    </div>
                                )}
                                <div className='w-full flex items-center justify-between'>
                                    <span className="text-sm font-medium text-gray-600">Start</span>
                                    <span className="text-xl font-bold text-gray-900">₫{(Number(product.price_start)*1000).toLocaleString()}</span>
                                </div>
                                <div className='w-full flex items-center justify-between'>
                                    <span className="text-sm font-medium text-gray-600">Step</span>
                                    <span className="text-xl font-bold text-gray-900">₫{(Number(product.price_step)*1000).toLocaleString()}</span>
                                </div>
                                <div className='w-full flex items-center justify-between'>
                                    <span className="text-sm font-medium text-gray-600">Highest Bidder</span>
                                    <span className="text-xl font-bold text-gray-900">{product.winner_id ? (product?.winner?.full_name) : "No Winner yet"}</span>
                                </div>
                        </div>

                        {/* --- CONDITIONAL ACTION AREA --- */}
                        
                        {/* SCENARIO 1: OWNER */}
                        {isOwner ? (
                            <div className='flex flex-col gap-4'>
                                <div className="p-4 bg-white rounded-lg border border-amber-200 text-center flex flex-col items-center justify-center gap-2">
                                    <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">Owner View</Badge>
                                    <p className="text-sm text-amber-700 font-medium">You are the seller of this item.</p>
                                </div>
                                <Button variant="outline" className="gap-2 border-blue-200 text-blue-700 bg-blue-50 hover:bg-blue-100">
                                    <Pencil className="w-4 h-4" /> Edit Product
                                </Button>
                            </div>

                        /* SCENARIO 2: EXPIRED & WINNER */
                        ) : isExpired && isWinner ? (
                            <div className='flex flex-col gap-4 animate-in fade-in zoom-in duration-300'>
                                <div className="p-4 bg-green-100 rounded-lg border border-green-300 text-center space-y-2">
                                    <h3 className="text-lg font-bold text-green-800">Congratulations!</h3>
                                    <p className="text-sm text-green-700">You won this auction!</p>
                                </div>
                                <Button 
                                    onClick={() => setIsBuyNowModalOpen(true)} // Or navigate to specific Checkout page
                                    className="w-full h-12 text-lg font-bold bg-green-600 hover:bg-green-700 shadow-md flex items-center gap-2"
                                >
                                    <HandCoinsIcon className="w-6 h-6" />
                                    Contact Seller & Checkout
                                </Button>
                            </div>

                        /* SCENARIO 3: EXPIRED & NON-WINNER */
                        ) : isExpired ? (
                            <div className="p-6 bg-gray-100 rounded-lg border border-gray-300 text-center flex flex-col items-center justify-center gap-2">
                                <Clock className="w-8 h-8 text-gray-400" />
                                <span className="font-bold text-gray-600 text-lg">Auction Ended</span>
                                <p className="text-sm text-gray-500">Bidding for this item is over.</p>
                            </div>

                        /* SCENARIO 4: ACTIVE (Standard Bidder View) */
                        ) : (
                            <div className='flex flex-col shrink-0 gap-4 items-center justify-end'>
                                <Button 
                                    onClick={scrollToBidding} 
                                    className="w-full h-12 text-lg font-bold bg-blue-600 hover:bg-blue-700 shadow-md transition-all flex items-center gap-2"
                                >
                                    <HandCoinsIcon className="w-8 h-8" />
                                    Go to Bid
                                </Button>
                                {product.price_buy_now && (
                                    <Button 
                                        onClick={() => setIsBuyNowModalOpen(true)}
                                        className="w-full h-12 text-lg font-bold shadow-md transition-all flex items-center gap-2"
                                    >
                                        <HandCoinsIcon className="w-8 h-8" />
                                        Buy Now
                                    </Button>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-6 lg:p-8 shadow-sm space-y-4">
            <h2 className="text-2xl font-bold border-b pb-4 text-gray-900">Description</h2>
            <div className='bg-grey-200 border border-gray-200 w-full h-[80%] scroll-y-auto p-4 rounded-md'>
                 {product.product_descriptions?.length > 0 ? product.product_descriptions?.map((desc, index) => (
                    <p key={index} className="text-gray-700 mb-4 whitespace-pre-line">{desc.content}</p>
                 )): (
                    <div className="flex flex-col items-center justify-center py-8 text-gray-400 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                        <TextQuoteIcon className="w-8 h-8 mb-2 opacity-50" />
                        <p className="italic">The seller forgot to add some detail...</p>
                    </div>
                 )}
            </div>
        </div>

       {/* BIDDING SECTION - HIDE IF EXPIRED */}
        {!isExpired && (
            <div id="bidding-section" className="bg-white border border-gray-200 rounded-xl p-6 lg:p-8 shadow-sm space-y-4 scroll-mt-24">
                <div className="flex justify-between items-center border-b pb-4">
                    <h2 className="text-2xl font-bold text-gray-900">Bidding & History</h2>
                    {isOwner && <Badge variant="outline" className="border-amber-200 text-amber-700 bg-amber-50">Management Mode</Badge>}
                </div>

                <BiddingSection 
                    startPrice={Number(product.price_start)}
                    currentPrice={Number(product.price_current)}
                    bidHistory={bidsHistory || []}
                    onPlaceBid={handlePlaceBid}
                    currentAutoBid={currentAutoBid}
                    step={Number(product.price_step)}
                    productId={product.product_id}
                    isOwner={isOwner}
                />
            </div>
        )}

        {/* COMMENTS SECTION - HIDE IF EXPIRED */}
        {!isExpired && (
            <div className="bg-white border border-gray-200 rounded-xl p-6 lg:p-8 shadow-sm space-y-4">
                <h2 className="text-2xl font-bold border-b pb-4 text-gray-900">Community Q&A</h2>
                <CommentSection 
                    comments={comments || []}
                    onPostComment={handlePostComment}
                    isOwner={isOwner}
                />
            </div>
        )}

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

        {/* BUY NOW CONFIRMATION MODAL */}
        <Dialog open={isBuyNowModalOpen} onOpenChange={setIsBuyNowModalOpen}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Confirm Purchase</DialogTitle>
                    <DialogDescription>
                        Are you sure you want to buy this item at ₫{product.price_buy_now ? (Number(product.price_buy_now)*1000).toLocaleString() : '0'}? This action can not be undone. You will be guided to checkout page after confirming.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="border-t border-b py-4 space-y-3">
                        <div className="flex justify-between">
                            <span className="text-gray-600">Item:</span>
                            <span className="font-semibold">{product.name}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-600">Price:</span>
                            <span className="font-semibold">₫{product.price_buy_now ? (Number(product.price_buy_now)*1000).toLocaleString() : '0'}</span>
                        </div>
                    </div>
                </div>
                <DialogFooter className="flex gap-2">
                    <Button 
                        variant="outline" 
                        onClick={() => setIsBuyNowModalOpen(false)}
                    >
                        Cancel
                    </Button>
                    <Button 
                        onClick={handleBuyNow}
                        className="bg-blue-600 hover:bg-blue-700"
                    >
                        Confirm Purchase
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
        
        </div>
    );
};

export default ProductDetailPage;