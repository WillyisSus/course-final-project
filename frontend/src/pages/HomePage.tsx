import { useEffect, useState } from "react";
import axios from "axios";
import { type Product } from "../types/product";
import { ProductCard } from "../components/ProductCard";

// Shadcn Components
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowRight, PackageOpen } from "lucide-react"; 
import { Link } from "react-router";

const HomePage = () => {
  const [data, setData] = useState<{
    ending: Product[];
    active: Product[];
    price: Product[];
  }>({ ending: [], active: [], price: [] });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Parallel fetching
        const [resEnding, resActive, resPrice] = await Promise.all([
          axios.get(
            "http://localhost:3000/api/products?sort=end_date&order=ASC&limit=5&status=ACTIVE"
          ),
          axios.get(
            "http://localhost:3000/api/products?sort=bid_count&order=DESC&limit=5&status=ACTIVE"
          ),
          axios.get(
            "http://localhost:3000/api/products?sort=price_current&order=DESC&limit=5&status=ACTIVE"
          ),
        ]);

        setData({
          ending: resEnding.data.data || [],
          active: resActive.data.data || [],
          price: resPrice.data.data || [],
        });
      } catch (error) {
        console.error("Failed to fetch market data", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // --- Helper: Section Renderer ---
  const renderSection = (
    title: string,
    products: Product[],
    linkSort: string
  ) => (
    <section className="space-y-6">
      <div className="flex items-center justify-between border-b pb-4 border-slate-200">
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">
          {title}
        </h2>
        <Button
          variant="ghost"
          asChild
          className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 gap-2"
        >
          <Link to={`/products?sort=${linkSort}`}>
            View All <ArrowRight className="w-4 h-4" />
          </Link>
        </Button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
          {Array.from({ length: 5 }).map((_, i) => <CardSkeleton key={i} />)}
        </div>
      ) : products.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
          {products.map((product) => (
            <ProductCard key={product.product_id} product={product} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 bg-slate-50 border border-dashed border-slate-200 rounded-xl text-center animate-in fade-in zoom-in-95 duration-300">
          <div className="bg-white p-4 rounded-full shadow-sm mb-3">
            <PackageOpen className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900">No auctions found</h3>
          <p className="text-slate-500 max-w-sm mt-1">
            There are currently no items in this category. Check back later or start your own auction!
          </p>
        </div>
      )}
    </section>
  );

  return (
    <div className="space-y-16 py-8 animate-in fade-in duration-700">
      {renderSection("Ending Soon", data.ending, "end_date/ASC")}
      {renderSection("Most Active Auctions", data.active, "bid_count/DESC")}
      {renderSection("High Value Items", data.price, "price_current/DESC")}
    </div>
  );
};

// --- Helper: Skeleton Component for Loading State ---
const CardSkeleton = () => (
  <div className="flex flex-col space-y-3 w-full">
    <Skeleton className="h-48 w-full rounded-xl" />
    <div className="space-y-2 p-2">
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
      <div className="flex justify-between pt-4">
        <Skeleton className="h-6 w-1/3" />
        <Skeleton className="h-6 w-1/4" />
      </div>
    </div>
  </div>
);

export default HomePage;