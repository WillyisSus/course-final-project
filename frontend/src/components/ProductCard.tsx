import { useEffect, useState } from "react";
import { Link } from "react-router";
import { useSelector } from "react-redux";
import api from "@/lib/axios";
import { type Product } from "../types/product";
import { Clock, Calendar, Baby, Heart } from "lucide-react";

import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";

// --- Helpers ---
const maskName = (fullName?: string) => {
  if (!fullName) return "No Bids";
  const parts = fullName.split(" ");
  return parts[0] + " ***";
};

const getTimeLeft = (endDate: string) => {
  const end = new Date(endDate).getTime();
  const now = new Date().getTime();
  const diff = end - now;

  if (diff <= 0) return { text: "Ended", color: "text-gray-500" };

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

  if (days <= 3) {
    return {
      text: days === 0 ? `${hours}h left` : `${days}d ${hours}h left`,
      color: "text-orange-600 font-bold",
    };
  }

  return {
    text: new Date(endDate).toLocaleDateString(),
    color: "text-gray-500",
  };
};

interface ProductCardProps {
  product: Product;
}

export const ProductCard = ({ product }: ProductCardProps) => {
  const { user } = useSelector((state: any) => state.auth);
  const [isFavorite, setIsFavorite] = useState(false);
  const timeLeft = getTimeLeft(product.end_date);

  useEffect(() => {
    if (user) {
        const checkFavorite = async () => {
            try {
                const res = await api.get(`/watchlists`);
                const favorites = res.data.data || [];
                const found = favorites.some((item: any) => item.product_id === product.product_id);
                setIsFavorite(found);
            } catch (error) {
                console.error("Failed to check favorite status", error);
            }
        };
        checkFavorite();
    }
  }, [user, product.product_id]);

  return (
    <Link
      to={`/products/${product.product_id}`}
      className="block h-full w-full"
    >
      <Card className="h-full overflow-hidden hover:shadow-xl transition-all duration-300 group flex flex-col border-slate-200">
        
        <div className="relative w-full aspect-4/3 bg-slate-100 overflow-hidden">
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

          {product.allow_first_time_bidder && (
            <div className="absolute top-2 left-2 z-10">
              <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white border-0 gap-1 shadow-sm px-2 py-0.5 text-[10px] sm:text-xs">
                <Baby className="w-3 h-3" /> Newbie Friendly
              </Badge>
            </div>
          )}

          {isFavorite && (
            <div className="absolute top-2 right-2 z-10">
               <div className="bg-white/90 backdrop-blur-sm p-1.5 rounded-full shadow-sm">
                  <Heart className="w-4 h-4 text-red-500 fill-current" />
               </div>
            </div>
          )}

          <div className="absolute bottom-2 right-2 z-10">
            <Badge
              variant="secondary"
              className="backdrop-blur-md bg-white/90 shadow-sm text-slate-700"
            >
              {product.bid_count || 0} Bids
            </Badge>
          </div>
        </div>

        <CardContent className="p-5 grow flex flex-col gap-3">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Calendar className="w-3.5 h-3.5" />
            <span>
              Posted {new Date(product.start_date).toLocaleDateString()}
            </span>
          </div>

          <h3
            className="font-bold text-lg leading-snug text-slate-900 line-clamp-2 group-hover:text-blue-600 transition-colors"
            title={product.name}
          >
            {product.name}
          </h3>

          <Separator className="bg-slate-100 my-1" />

          <div className="grid grid-cols-2 gap-4 items-end">
            <div>
              <p className="text-xs font-medium text-slate-500 mb-0.5 uppercase tracking-wide">
                Current Bid
              </p>
              <p className="text-xl font-bold text-blue-700">
                {product.price_current
                  ? "₫" + Number(product.price_current).toLocaleString()
                  : "No bids"}
              </p>
            </div>
            {product.price_buy_now && (
              <div className="text-right">
                <p className="text-xs font-medium text-slate-500 mb-0.5 uppercase tracking-wide">
                  Buy Now
                </p>
                <p className="text-base font-semibold text-slate-700">
                  ₫{Number(product.price_buy_now).toLocaleString()}
                </p>
              </div>
            )}
          </div>
        </CardContent>

        <CardFooter className="p-4 bg-slate-50/50 mt-auto flex items-center justify-between border-t border-slate-100">
          <div className="flex items-center gap-2">
            <Avatar className="w-7 h-7 border-2 border-white shadow-sm">
              <AvatarFallback className="text-[10px] bg-blue-100 text-blue-600 font-bold">
                {product.winner ? product.winner.full_name.charAt(0) : "?"}
              </AvatarFallback>
            </Avatar>
            <span className="text-xs font-medium text-slate-600">
              {maskName(product.winner?.full_name) || "No Winner yet"}
            </span>
          </div>

          <div className={`flex items-center gap-1.5 text-xs ${timeLeft.color}`}>
            <Clock className="w-4 h-4" />
            <span>{timeLeft.text}</span>
          </div>
        </CardFooter>
      </Card>
    </Link>
  );
};