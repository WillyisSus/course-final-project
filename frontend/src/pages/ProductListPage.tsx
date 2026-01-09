import { useState, useEffect } from "react";
import { useSearchParams } from "react-router"; 
import { useServerPagination } from "../lib/usePagination";
import api from "../lib/axios";

import ProductCardHorizontal from "../components/ProductCardHorizontal";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
  SelectLabel,
} from "@/components/ui/select";
import {
  Search as SearchIcon,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useDebounce } from "@/lib/useDebounce";
import type { Category } from "@/types/product";
const ProductListPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const page = Number(searchParams.get("page")) || 1;
  const categoryId = searchParams.get("category") || "all";
  const sortBy = searchParams.get("sort") || "end_date/ASC";
  const initialSearch = searchParams.get("search") || "";
  const [localSearch, setLocalSearch] = useState(initialSearch);
  const debouncedSearch = useDebounce(localSearch, 500);

  const {
    data: products,
    loading,
    totalPages,
    totalItems,
  } = useServerPagination<any>({
    url: "/products",
    page,
    limit: 5,
    filters: {
      search: debouncedSearch,
      category: categoryId === "all" ? undefined : categoryId,
      sort: sortBy.split("/")[0],
      order: sortBy.split("/")[1],
    },
  });

  const [categories, setCategories] = useState<Category[]>([]);
  useEffect(() => {
    api
      .get("/categories")
      .then((res) => setCategories(res.data.data || []))
      .catch(console.error);
  }, []);


  useEffect(() => {
    const currentUrlSearch = searchParams.get("search") || "";
    if (debouncedSearch !== currentUrlSearch) {
      setSearchParams(prev => {
        const newParams = new URLSearchParams(prev);
        if (debouncedSearch) {
            newParams.set("search", debouncedSearch);
        } else {
            newParams.delete("search");
        }
        newParams.set("page", "1"); 
        return newParams;
      });
    }
  }, [debouncedSearch, setSearchParams, searchParams]);


  useEffect(() => {
    const urlSearch = searchParams.get("search") || "";
    if (urlSearch !== localSearch) {
        setLocalSearch(urlSearch);
    }
  }, [searchParams]); 

  const updateParams = (key: string, value: string) => {
    setSearchParams(prev => {
        const newParams = new URLSearchParams(prev);
        if (value && value !== "all") {
            newParams.set(key, value);
        } else {
            newParams.delete(key);
        }
        if (key !== "page") newParams.set("page", "1");
        return newParams;
    });
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateParams("search", localSearch);
  };

  return (
    <div className="container mx-auto px-4 py-8 min-h-screen">
      <div className="flex flex-col gap-4 mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Browse Products</h1>

        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4 items-center justify-between">
          {/* SEARCH */}
          <form onSubmit={handleSearchSubmit} className="relative w-full md:w-96">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search products..."
              className="pl-9"
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
            />
          </form>

          <div className="flex w-full md:w-auto gap-3">
            <Select
              value={categoryId}
              onValueChange={(val) => updateParams("category", val)}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="font-medium">All Categories</SelectItem>
                {categories.map((cat) => (
                  cat.sub_categories && cat.sub_categories.length > 0 ? (
                    <SelectGroup key={cat.category_id}>
                      <SelectLabel className="pl-2 py-1 text-xs font-bold text-muted-foreground uppercase tracking-wider bg-gray-50">{cat.name}</SelectLabel>
                      {cat.sub_categories.map((subCat) => (
                        <SelectItem
                          className="pl-6"
                          key={subCat.category_id}
                          value={String(subCat.category_id)}
                        >
                          {subCat.name}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  ) : (
                    <SelectItem
                      className="font-medium"
                      key={cat.category_id}
                      value={String(cat.category_id)}
                    >
                      {cat.name}
                    </SelectItem>
                  )
                ))}
              </SelectContent>
            </Select>

            <Select
              value={sortBy}
              onValueChange={(val) => updateParams("sort", val)}
            >
              <SelectTrigger className="w-[180px]">
                <SlidersHorizontal className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Sort By" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="end_date/ASC">Ending Soonest</SelectItem>
                <SelectItem value="end_date/DESC">Ending Latest</SelectItem>
                <SelectItem value="price_current/ASC">
                  Price: Low to High
                </SelectItem>
                <SelectItem value="price_current/DESC">
                  Price: High to Low
                </SelectItem>
                <SelectItem value="bid_count/ASC">
                  Bids: Low to High
                </SelectItem>
                <SelectItem value="bid_count/DESC">
                  Bids: High to Low
                </SelectItem>
                
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {loading ? (
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
          products.map((product) => (
            <ProductCardHorizontal key={product.product_id} product={product} />
          ))
        ) : (
          <div className="text-center py-20 text-gray-500">
            <p className="text-xl">No products found matching your criteria.</p>
            <Button
              variant="link"
              onClick={() => setSearchParams({})}
            >
              Clear Filters
            </Button>
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-4 mt-10">
          <Button
            variant="outline"
            onClick={() => updateParams("page", String(page - 1))}
            disabled={page === 1 || loading}
          >
            <ChevronLeft className="w-4 h-4 mr-2" /> Previous
          </Button>

          <span className="text-sm font-medium text-gray-600">
            Page {page} of {totalPages}
          </span>

          <Button
            variant="outline"
            onClick={() => updateParams("page", String(page + 1))}
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