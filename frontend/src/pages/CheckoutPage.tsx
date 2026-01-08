import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router';
import { useSelector } from 'react-redux';
import { Link } from 'react-router';
import api from '@/lib/axios';

// UI Components
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

// Icons
import { ShieldCheck, MessageSquare, Send, ArrowLeft, Lock } from 'lucide-react';

// Your Payment Component
import CheckoutButton from '@/components/CheckoutButton';

const CheckoutPage = () => {
    const { productId } = useParams();
    const navigate = useNavigate();
    const { user } = useSelector((state: any) => state.auth);
    
    const [product, setProduct] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [messageInput, setMessageInput] = useState("");
    
    // Mock Messages for UI Design (We will connect Socket.io later)
    const [messages, setMessages] = useState([
        { id: 1, sender: 'system', text: 'Transaction room created. Please discuss shipping details here.' },
        { id: 2, sender: 'seller', text: 'Hello! I can ship this tomorrow via FedEx.' },
    ]);

    useEffect(() => {
        const fetchProduct = async () => {
            try {
                const res = await api.get(`/products/${productId}`);
                setProduct(res.data.data);
            } catch (error) {
                console.error("Failed to load product", error);
            } finally {
                setLoading(false);
            }
        };
        if (productId) fetchProduct();
    }, [productId]);

    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (!messageInput.trim()) return;
        
        // Optimistic UI update (In real app, emit to Socket here)
        setMessages([...messages, { id: Date.now(), sender: 'me', text: messageInput }]);
        setMessageInput("");
    };

    if (loading) return <div className="h-screen w-full flex items-center justify-center bg-gray-50"><Skeleton className="h-96 w-96 rounded-xl" /></div>;
    if (!product) return <div className="h-screen flex items-center justify-center">Product not found</div>;

    // Price Logic
    const isWinner = product.winner_id === user?.user_id;
    const finalPrice = isWinner ? Number(product.price_current) : Number(product.price_buy_now);
    const EXCHANGE_RATE = 25000;
    const priceUSD = (finalPrice / EXCHANGE_RATE).toFixed(2);

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            
            {/* 1. SIMPLE HEADER (Replaces Main Navbar) */}
            <header className="bg-white border-b px-6 py-4 flex items-center justify-between sticky top-0 z-10">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <div>
                        <h1 className="font-bold text-lg flex items-center gap-2">
                            <Lock className="w-4 h-4 text-green-600" /> Secure Transaction
                        </h1>
                        <p className="text-xs text-muted-foreground">ID: #{product.product_id} • {new Date().toLocaleDateString()}</p>
                    </div>
                </div>
                <div className="hidden md:flex items-center gap-2 text-sm text-gray-500">
                    <ShieldCheck className="w-4 h-4" />
                    <span>Buyer Protection Enabled</span>
                </div>
            </header>

            {/* 2. MAIN CONTENT GRID */}
            <main className="flex-1 container max-w-6xl mx-auto p-4 md:p-8">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-140px)]">
                    
                    {/* LEFT COLUMN: RECEIPT CARD (Matches your image vibe) */}
                    <div className="lg:col-span-5 flex flex-col gap-4 h-full overflow-y-auto">
                        <Card className="border-0 shadow-lg ring-1 ring-gray-100 flex-1 flex flex-col">
                            <CardHeader className="bg-linear-to-r from-blue-50 to-white border-b pb-6">
                                <CardTitle className="text-xl text-blue-900">Payment Receipt</CardTitle>
                                <CardDescription>Review the item details before proceeding.</CardDescription>
                            </CardHeader>
                            
                            <CardContent className="space-y-6 pt-6 flex-1">
                                {/* Product Info */}
                                <div className="flex gap-4">
                                    <div className="w-24 h-24 bg-gray-100 rounded-lg overflow-hidden shrink-0 border">
                                        <img 
                                            src={product.product_images?.[0]?.image_url ? `http://localhost:3000${product.product_images[0].image_url}` : "/placeholder.png"} 
                                            alt={product.name} 
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <h3 className="font-bold text-gray-900 line-clamp-2">{product.name}</h3>
                                        <Badge variant="secondary" className="text-xs">{product.category?.name}</Badge>
                                        <p className="text-xs text-muted-foreground">Seller: {product.seller?.full_name}</p>
                                    </div>
                                </div>

                                <Separator />

                                {/* Price Breakdown */}
                                <div className="space-y-3 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Item Price</span>
                                        <span className="font-medium">₫{finalPrice.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Service Fee</span>
                                        <span className="text-green-600">Waived</span>
                                    </div>
                                    <div className="flex justify-between text-muted-foreground text-xs italic">
                                        <span>Approximate USD</span>
                                        <span>${priceUSD}</span>
                                    </div>
                                </div>

                                <div className="bg-blue-50/50 p-4 rounded-lg border border-blue-100 flex justify-between items-center">
                                    <span className="font-bold text-blue-900">Total to Pay</span>
                                    <span className="font-black text-2xl text-blue-700">₫{finalPrice.toLocaleString()}</span>
                                </div>
                            </CardContent>

                            <CardFooter className="bg-gray-50/50 border-t p-6 flex flex-col gap-3">
                                {/* PAYPAL BUTTON */}
                                <div className="w-full">
                                    <CheckoutButton 
                                        amount={finalPrice} 
                                        product_id={product.product_id}
                                        seller_id={product.seller_id}
                                    />
                                </div>
                                <p className="text-xs text-center text-muted-foreground flex items-center justify-center gap-1">
                                    <Lock className="w-3 h-3" /> Payments are processed securely by PayPal.
                                </p>
                            </CardFooter>
                        </Card>
                    </div>

                    {/* RIGHT COLUMN: MESSENGER CARD */}
                    <div className="lg:col-span-7 h-full flex flex-col">
                        <Card className="h-full flex flex-col border-0 shadow-lg ring-1 ring-gray-100 overflow-hidden">
                            <CardHeader className="border-b py-4 px-6 bg-white shrink-0 flex flex-row items-center gap-3">
                                <Avatar className="h-10 w-10 border">
                                    <AvatarImage src="/placeholder-user.jpg" /> {/* Replace with seller avatar */}
                                    <AvatarFallback>S</AvatarFallback>
                                </Avatar>
                                <div>
                                    <CardTitle className="text-base flex items-center gap-2">
                                        {product.seller?.full_name} 
                                        <Badge variant="outline" className="text-[10px] px-1 py-0 h-4">Seller</Badge>
                                    </CardTitle>
                                    <CardDescription className="text-xs flex items-center gap-1">
                                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" /> Online
                                    </CardDescription>
                                </div>
                            </CardHeader>

                            {/* CHAT AREA */}
                            <ScrollArea className="flex-1 p-6 bg-slate-50/50">
                                <div className="space-y-4">
                                    {messages.map((msg) => (
                                        <div 
                                            key={msg.id} 
                                            className={`flex ${msg.sender === 'me' ? 'justify-end' : 'justify-start'}`}
                                        >
                                            <div 
                                                className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm shadow-sm ${
                                                    msg.sender === 'me' 
                                                        ? 'bg-blue-600 text-white rounded-br-none' 
                                                        : msg.sender === 'system'
                                                            ? 'bg-gray-200 text-gray-600 text-center w-full text-xs py-1 rounded-full'
                                                            : 'bg-white border text-gray-800 rounded-bl-none'
                                                }`}
                                            >
                                                {msg.text}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </ScrollArea>

                            {/* INPUT AREA */}
                            <div className="p-4 bg-white border-t shrink-0">
                                <form onSubmit={handleSendMessage} className="flex gap-2">
                                    <Input 
                                        placeholder="Discuss shipping or ask questions..." 
                                        value={messageInput}
                                        onChange={(e) => setMessageInput(e.target.value)}
                                        className="flex-1 bg-gray-50 focus-visible:bg-white transition-colors"
                                    />
                                    <Button type="submit" size="icon" className="bg-blue-600 hover:bg-blue-700">
                                        <Send className="w-4 h-4" />
                                    </Button>
                                </form>
                                <p className="text-[10px] text-muted-foreground mt-2 text-center">
                                    Do not share your password or banking PIN in this chat.
                                </p>
                            </div>
                        </Card>
                    </div>

                </div>
            </main>
        </div>
    );
};

export default CheckoutPage;