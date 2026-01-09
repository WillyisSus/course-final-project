import { useEffect, useState } from "react";
import { Link } from "react-router";
import { useSelector } from "react-redux";
import api from "@/lib/axios";
import { toast } from "sonner";

// UI Components
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { 
    Clock, 
    Calendar, 
    Tag, 
    Baby, 
    Heart, 
    Trophy,
    User as UserIcon 
} from "lucide-react";
import { set } from "zod";

interface Product {
  product_id: number;
  name: string;
  description: string;
  price_current: number;
  price_buy_now?: number;
  start_date: string;
  end_date: string;
  bid_count?: number;
  allow_first_time_bidder: boolean;
  status: 'ACTIVE' | 'SOLD' | 'EXPIRED';
  product_images?: { image_url: string }[];
  category?: { name: string };
  seller?: { full_name: string };
  winner?: { full_name: string };
}

interface ProductCardHorizontalProps {
  product: Product;
}

const maskName = (fullName?: string) => {
  if (!fullName) return "No Bids";
  const parts = fullName.split(" ");
  return parts[0] + " ***";
};

const getTimeLeft = (endDate: string) => {
  const end = new Date(endDate).getTime();
  const now = new Date().getTime();
  const diff = end - now;

  if (diff <= 0)
    return { text: "Ended", color: "text-gray-500", bg: "bg-gray-100" };

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

  if (days <= 3) {
    return {
      text: days === 0 ? `${hours}h left` : `${days}d ${hours}h left`,
      color: "text-orange-600 font-bold",
      bg: "bg-orange-50",
    };
  }

  return {
    text: new Date(endDate).toLocaleDateString(),
    color: "text-blue-600",
    bg: "bg-blue-50",
  };
};

const ProductCardHorizontal = ({ product }: ProductCardHorizontalProps) => {
  const { user } = useSelector((state: any) => state.auth);
  const [isFavorite, setIsFavorite] = useState(false);
  const [loadingFav, setLoadingFav] = useState(false);

  const timeLeft = getTimeLeft(product.end_date);
  const isExpired = new Date(product.end_date).getTime() <= Date.now();
  const imageUrl = product.product_images?.[0]?.image_url || "https://placehold.co/400x300?text=No+Image";

  // Check Favorite Status on Mount
  useEffect(() => {
    if (user) {
        const checkFavorite = async () => {
            try {
     
                const res = await api.get(`/watchlists/${product.product_id}`);
                if (res.data.data){
                  setIsFavorite(true);
                }
            } catch (error) {
                console.error("Failed to check favorite status", error);
            }
        };
        checkFavorite();
    }
  }, [user, product.product_id]);
  const toggleFavorite = async () => {
      if (!user) return;
      setLoadingFav(true);
      try {
          if (isFavorite) {
              await api.delete(`/watchlists/${product.product_id}`);
              toast.success("Updated watchlist");
          } else {
              await api.post('/watchlists', { product_id: product.product_id });
              toast.success("Added to favorites");
          }
          setIsFavorite(!isFavorite);
      } catch (error) {
          toast.error("Failed to update favorite");
      } finally {
          setLoadingFav(false);
      }
  };

  return (
    <Card className="group overflow-hidden hover:shadow-lg transition-all duration-300 border-slate-200">
      <div className="flex flex-col sm:flex-row h-full">
        
        <div className="w-full sm:w-72 aspect-video sm:aspect-4/3 shrink-0 bg-slate-100 relative overflow-hidden">
          <img
            src={imageUrl}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />

          {product.allow_first_time_bidder && (
            <div className="absolute top-2 left-2 z-10">
                <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white border-0 gap-1 shadow-sm">
                    <Baby className="w-3 h-3" /> Allow first-timers
                </Badge>
            </div>
          )}

          <div className="absolute top-2 right-2 z-10">
            <Badge
              variant="secondary"
              className="backdrop-blur-md bg-white/90 shadow-sm text-slate-700"
            >
              {product.bid_count || 0} Bids
            </Badge>
          </div>
        </div>

        <CardContent className="flex-1 p-5 flex flex-col gap-3 justify-center">
            <div className="flex justify-between items-center text-xs text-muted-foreground mb-1">
                <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Posted {new Date(product.start_date).toLocaleDateString()}</span>
                </div>
                <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full font-medium ${timeLeft.color} ${timeLeft.bg}`}>
                    <Clock className="w-3.5 h-3.5" />
                    <span>{timeLeft.text}</span>
                </div>
            </div>

            <Link to={`/products/${product.product_id}`}>
              <h3 className="text-xl font-bold text-slate-900 leading-tight group-hover:text-blue-600 transition-colors">
                {product.name}
              </h3>
            </Link>

            <div className="flex flex-wrap gap-x-6 gap-y-2 items-baseline mt-1">
                <div className="flex items-baseline gap-2">
                    <span className="text-sm font-medium text-slate-500 uppercase">Current Bid:</span>
                    <span className="text-2xl font-black text-blue-700">
                        {product.price_current ? `₫${Number(product.price_current).toLocaleString()}` : "No bids"}
                    </span>
                </div>
                
                {product.price_buy_now && (
                    <div className="flex items-baseline gap-2">
                        <span className="text-xs font-medium text-slate-400 uppercase">Buy Now:</span>
                        <span className="text-sm font-bold text-slate-600">
                            ₫{Number(product.price_buy_now).toLocaleString()}
                        </span>
                    </div>
                )}
            </div>

            <Separator className="bg-slate-100 my-1" />

            <div className="flex flex-wrap gap-4 text-sm">
                <div className="flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-amber-500" />
                    <span className="text-slate-500 text-xs uppercase font-semibold">Highest:</span>
                    <span className="font-medium text-slate-700">
                        {maskName(product.winner?.full_name)}
                    </span>
                </div>
                
                <div className="flex items-center gap-2">
                    <UserIcon className="w-4 h-4 text-slate-400" />
                    <span className="text-slate-500 text-xs uppercase font-semibold">Seller:</span>
                    <span className="font-medium text-slate-700">
                        {product.seller?.full_name || "Unknown"}
                    </span>
                </div>
            </div>
            
            <p className="text-sm text-slate-500 line-clamp-2 mt-1">
              {product.description}
            </p>
        </CardContent>

        <div className="w-full sm:w-48 p-5 bg-slate-50/50 border-t sm:border-t-0 sm:border-l border-slate-100 flex flex-col justify-center gap-3">
          
          <Button
            asChild
            className={`w-full font-bold shadow-sm ${
              isExpired ? "bg-slate-800 hover:bg-slate-900" : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            <Link to={`/products/${product.product_id}`}>
              View Details
            </Link>
          </Button>

          {user && (
              <Button
                variant={isFavorite ? "secondary" : "outline"}
                onClick={toggleFavorite}
                disabled={loadingFav}
                className={`w-full gap-2 border-slate-200 ${isFavorite ? "text-red-600 bg-red-50 border-red-100" : "text-slate-600"}`}
              >
                  <Heart className={`w-4 h-4 ${isFavorite ? "fill-current" : ""}`} />
                  {isFavorite ? "Favorited" : "Favorite"}
              </Button>
          )}

          {product.category && (
            <div className="mt-auto pt-2 flex justify-center">
                <Badge variant="outline" className="text-xs text-slate-400 font-normal border-slate-200 gap-1">
                    <Tag className="w-3 h-3" /> {product.category.name}
                </Badge>
            </div>
          )}
        </div>

      </div>
    </Card>
  );
};

export default ProductCardHorizontal;