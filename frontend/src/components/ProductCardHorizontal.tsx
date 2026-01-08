import { Link } from 'react-router'; // Ensure consistent import
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Clock, Calendar, Tag } from 'lucide-react';

// Use the same type definition as ProductCard or import it
// import { type Product } from '../types/product'; 

// For standalone usage, I'll redefine the extended interface here to match ProductCard's needs
interface Product {
  product_id: number;
  name: string;
  description: string;
  price_current: number;
  price_buy_now?: number;
  start_date: string;
  end_date: string;
  bid_count?: number;
  // Adjust image structure to match your API (Array of objects)
  product_images?: { image_url: string }[]; 
  category?: { name: string };
  seller?: { full_name: string };
  winner?: { full_name: string };
}

interface ProductCardHorizontalProps {
  product: Product;
}

// --- Helpers (Copied from ProductCard for consistency) ---
const maskName = (fullName?: string) => {
  if (!fullName) return "No Bids";
  const parts = fullName.split(' ');
  return parts[0] + ' ***'; 
};

const getTimeLeft = (endDate: string) => {
  const end = new Date(endDate).getTime();
  const now = new Date().getTime();
  const diff = end - now;

  if (diff <= 0) return { text: "Ended", color: "text-gray-500", bg: "bg-gray-100" };

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  
  if (days <= 3) {
    return { 
      text: days === 0 ? `${hours}h left` : `${days}d ${hours}h left`, 
      color: "text-orange-600 font-bold",
      bg: "bg-orange-50"
    };
  }
  
  return { 
    text: new Date(endDate).toLocaleDateString(), 
    color: "text-blue-600",
    bg: "bg-blue-50"
  };
};

const ProductCardHorizontal = ({ product }: ProductCardHorizontalProps) => {
  const timeLeft = getTimeLeft(product.end_date);
  const isExpired = new Date(product.end_date).getTime() <= Date.now();
  const imageUrl = product.product_images?.[0]?.image_url || "https://placehold.co/400x400?text=No+Image";

  return (
    <Card className="group overflow-hidden hover:shadow-lg transition-all duration-300 border-slate-200">
      <div className="flex flex-col sm:flex-row h-full">
        
        {/* 1. IMAGE SECTION (Left - Fixed Width) */}
        <div className="w-full sm:w-64 h-48 sm:h-auto flex-shrink-0 bg-slate-100 relative overflow-hidden">
          <img 
            src={imageUrl} 
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          
          {/* Badge: Total Bids */}
          <div className="absolute top-2 left-2">
             <Badge variant="secondary" className="backdrop-blur-md bg-white/90 shadow-sm text-slate-700">
              {product.bid_count || 0} Bids
            </Badge>
          </div>

          {/* Badge: Category (Optional extra) */}
          {product.category && (
            <Badge className="absolute bottom-2 left-2 bg-black/60 hover:bg-black/70 text-white text-xs">
              {product.category.name}
            </Badge>
          )}
        </div>

        {/* 2. DETAILS SECTION (Middle - Flexible) */}
        <CardContent className="flex-1 p-5 flex flex-col gap-3">
          
          {/* Header: Date & Time */}
          <div className="flex justify-between items-start">
             <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Calendar className="w-3.5 h-3.5" />
                <span>Posted {new Date(product.start_date).toLocaleDateString()}</span>
             </div>
             
             {/* Time Left Badge */}
             <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-xs ${timeLeft.color} ${timeLeft.bg}`}>
               <Clock className="w-3.5 h-3.5" />
               <span>{timeLeft.text}</span>
             </div>
          </div>

          {/* Title & Description */}
          <div>
            <Link to={`/products/${product.product_id}`}>
                <h3 className="text-xl font-bold text-slate-900 leading-tight mb-2 group-hover:text-blue-600 transition-colors">
                {product.name}
                </h3>
            </Link>
            <p className="text-sm text-slate-500 line-clamp-2">
                {product.description}
            </p>
          </div>

          <div className="mt-auto pt-3">
            <Separator className="bg-slate-100 mb-3" />
            
            {/* Bidder Info Row */}
            <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 uppercase font-semibold">Highest Bidder:</span>
                <Avatar className="w-6 h-6 border border-slate-200">
                    <AvatarFallback className="text-[10px] bg-slate-100 text-slate-500">
                        {product.winner ? product.winner.full_name.charAt(0) : "No Winner yet"}
                    </AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium text-slate-700">
                    {maskName(product.winner?.full_name)}
                </span>
            </div>
          </div>
        </CardContent>

        {/* 3. ACTION & PRICE SECTION (Right - Fixed Width on Desktop) */}
        <div className="w-full sm:w-56 p-5 bg-slate-50 border-t sm:border-t-0 sm:border-l border-slate-100 flex flex-col justify-center gap-4">
           
           {/* Prices */}
           <div className="space-y-3 text-center sm:text-right">
             <div>
               <p className="text-xs text-muted-foreground uppercase mb-1">Current Bid</p>
               <p className="text-2xl font-black text-blue-700">
                 {product.price_current? "₫"+(Number(product.price_current)).toLocaleString() : "No bids yet"}
               </p>
             </div>
             
             {product.price_buy_now && (
               <div>
                 <p className="text-xs text-muted-foreground uppercase mb-1">Buy Now</p>
                 <p className="text-sm font-semibold text-slate-600">
                   ₫{Number(product.price_buy_now).toLocaleString()}
                 </p>
               </div>
             )}
           </div>
           
           {/* Action Button */}
           <Button asChild className={`w-full font-bold shadow-sm ${isExpired ? 'bg-slate-800 hover:bg-slate-900' : 'bg-blue-600 hover:bg-blue-700'}`}>
             <Link to={`/products/${product.product_id}`}>
               {isExpired ? "View Results" : "Place Bid"}
             </Link>
           </Button>

           {/* Seller Info (Optional, at bottom) */}
           <div className="flex items-center justify-center sm:justify-end gap-1 text-xs text-slate-400 mt-1">
             <Tag className="w-3 h-3" />
             <span>Seller: {product.seller?.full_name || "Unknown"}</span>
           </div>
        </div>

      </div>
    </Card>
  );
};

export default ProductCardHorizontal;