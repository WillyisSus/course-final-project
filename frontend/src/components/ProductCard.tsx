import { Link } from 'react-router';
import { type Product } from '../types/product';
import { Clock, Calendar } from 'lucide-react';

// Shadcn Components
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';

// --- Helper Logic ---
const maskName = (fullName?: string) => {
  if (!fullName) return "No Bids";
  const parts = fullName.split(' ');
  return parts[0] + ' ***'; 
};

const getTimeLeft = (endDate: string) => {
  const end = new Date(endDate).getTime();
  const now = new Date().getTime();
  const diff = end - now;

  if (diff <= 0) return { text: "Ended", color: "text-gray-500" };

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  
  // Urgent: Less than 3 days
  if (days <= 3) {
    return { 
      text: days === 0 ? `${hours}h left` : `${days}d ${hours}h left`, 
      color: "text-orange-600 font-bold" 
    };
  }
  
  // Standard
  return { 
    text: new Date(endDate).toLocaleDateString(), 
    color: "text-gray-500" 
  };
};

interface ProductCardProps {
  product: Product;
}

export const ProductCard = ({ product }: ProductCardProps) => {
  const timeLeft = getTimeLeft(product.end_date);

  return (
    <Link to={`/products/${product.product_id}`} className="block h-full">
      <Card className="h-full overflow-hidden hover:shadow-lg transition-all duration-300 group flex flex-col border-slate-200">
        
        {/* 1. Image Section */}
        <div className="relative h-48 bg-slate-100 overflow-hidden">
          {product.product_images?.[0] ? (
            <img 
              src={`${product.product_images[0].image_url}`} 
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-400 text-sm">
              No Image
            </div>
          )}
          
          {/* Badge: Total Bids */}
          <div className="absolute top-2 right-2">
            <Badge variant="secondary" className="backdrop-blur-md bg-white/90 shadow-sm text-slate-700">
              {product.bid_count || 0} Bids
            </Badge>
          </div>
        </div>

        {/* 2. Content Section */}
        <CardContent className="p-4 grow flex flex-col gap-3">
          {/* Posted Date */}
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Calendar className="w-3 h-3" />
            <span>Posted {new Date(product.start_date).toLocaleDateString()}</span>
          </div>

          {/* Name */}
          <h3 className="font-semibold text-base leading-tight text-slate-900 line-clamp-2 group-hover:text-blue-600 transition-colors" title={product.name}>
            {product.name}
          </h3>

          <Separator className="bg-slate-100" />

          {/* Price Grid */}
          <div className="grid grid-cols-2 gap-2 items-end">
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">Current Bid</p>
              <p className="text-lg font-bold text-blue-700">
                ${product.price_current.toLocaleString()}
              </p>
            </div>
            {product.price_buy_now && (
              <div className="text-right">
                <p className="text-xs text-muted-foreground mb-0.5">Buy Now</p>
                <p className="text-sm font-medium text-slate-600">
                  ${product.price_buy_now.toLocaleString()}
                </p>
              </div>
            )}
          </div>
        </CardContent>

        {/* 3. Footer: Bidder & Time */}
        <CardFooter className="p-4 pt-0 mt-auto flex items-center justify-between">
          {/* Bidder Info */}
          <div className="flex items-center gap-2">
            <Avatar className="w-6 h-6 border border-slate-200">
              <AvatarFallback className="text-[10px] bg-slate-100 text-slate-500">
                {product.winner ? product.winner.full_name.charAt(0) : "?"}
              </AvatarFallback>
            </Avatar>
            <span className="text-xs font-medium text-slate-600">
              {maskName(product.winner?.full_name || "Placeholder Winner")}
            </span>
          </div>

          {/* Time Left */}
          <div className={`flex items-center gap-1.5 text-xs ${timeLeft.color}`}>
            <Clock className="w-3.5 h-3.5" />
            <span>{timeLeft.text}</span>
          </div>
        </CardFooter>
      </Card>
    </Link>
  );
};