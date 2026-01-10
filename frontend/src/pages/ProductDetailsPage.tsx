import { useEffect, useRef, useState } from "react";
import { useParams, Link, useNavigate } from "react-router";
import { formatTimeLeft } from "../lib/utils";
import { io, Socket } from "socket.io-client";
import {
  Clock,
  User as UserIcon,
  Tag,
  HandCoinsIcon,
  Pencil,
  TextQuoteIcon,
  Ban,
  AlertTriangle,
  Plus,
  FileText,
  Heart,
} from "lucide-react";
import { toast } from "sonner"; // Ensure you have this installed, or remove toast calls
import api from "@/lib/axios";
// Components
import ProductGallery from "../components/ProductGallery";
import BiddingSection from "../components/BiddingSection";
import CommentSection from "../components/CommentSection";
import { ProductCard } from "../components/ProductCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input"; // Import Input
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Product, ProductComment } from "@/types/product";
import type { Bid, CreateBid, AutoBid } from "@/types/bid";
import { useAppSelector } from "@/store/hooks";
import { z, type ZodError } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import type { Category } from "@/types/product";
import DOMPurify from "dompurify";
const blockSchema = z.object({
  reason: z
    .string()
    .min(10, "Reason must be at least 10 characters.")
    .max(100, "Reason must be less than 100 characters."),
});
const descriptionSchema = z.object({
  content: z
    .string()
    .min(20, "Description update must be at least 20 characters.")
    .max(2000, "Description cannot exceed 2000 characters."),
});

const updateProductSchema = z.object({
  name: z
    .string()
    .min(5, "Product name must be at least 5 characters")
    .max(100, "Product name cannot exceed 100 characters"),
  category_id: z.number().min(1, "Please select a category"),
  price_step: z.number().min(1000, "Price step must be at least ₫1,000"),
  price_buy_now: z.number().min(0).optional().nullable(),
  end_date: z.string().min(1, "End date is required"),
  allow_first_time_bidder: z.boolean(),
  is_auto_extend: z.boolean(),
});

type DescriptionFormValues = z.infer<typeof descriptionSchema>;
type BlockFormValues = z.infer<typeof blockSchema>;
type UpdateProductFormValues = z.infer<typeof updateProductSchema>;

const ProductDetailPage = () => {
  const { id } = useParams();
  const [product, setProduct] = useState<Product>(new Object() as Product);
  const [relatedProducts, setRelatedProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [bidsHistory, setBidsHistory] = useState<Bid[]>([]);
  const [comments, setComments] = useState<ProductComment[]>([]);
  const [currentAutoBid, setCurrentAutoBid] = useState<AutoBid | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [priceChanged, setPriceChanged] = useState(false);
  const [isDescModalOpen, setIsDescModalOpen] = useState(false);
  const [isBuyNowModalOpen, setIsBuyNowModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [bidderToBlock, setBidderToBlock] = useState<{
    id: number;
    name: string;
  } | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [loadingFav, setLoadingFav] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const { user } = useAppSelector((state) => state.auth);
  // Conditional flags
  const isOwner = Boolean(
    user && product.seller_id && user.user_id === product.seller_id
  );
  const isQualifiedToBid = Boolean(
    user &&
      (parseInt(user.positive_rating) * 1.0) /
        (parseInt(user.positive_rating) + parseInt(user.negative_rating)) >=
        0.8
  );
  const isExpired =
    product.status === "SOLD" ||
    product.status === "EXPIRED" ||
    new Date(product.end_date) < new Date();
  const isWinner = Boolean(user && product.winner_id === user.user_id);

  const navigate = useNavigate();
  const blockForm = useForm<BlockFormValues>({
    resolver: zodResolver(blockSchema),
  });
  const descForm = useForm<DescriptionFormValues>({
    resolver: zodResolver(descriptionSchema),
  });
  const editForm = useForm<UpdateProductFormValues>({
    resolver: zodResolver(updateProductSchema),
    defaultValues: {
      name: "",
      category_id: 1,
      price_step: 1000,
      price_buy_now: null,
      end_date: "",
      allow_first_time_bidder: false,
      is_auto_extend: false,
    },
  });
  // --- FETCH DATA---
  useEffect(() => {
    api
      .get("/categories")
      .then((res) => setCategories(res.data.data || []))
      .catch(console.error);
  }, []);
  useEffect(() => {
    if (isEditModalOpen && product.product_id) {
      // Format date for datetime-local input (YYYY-MM-DDTHH:mm)
      // Note: This assumes local time.
      const dateObj = new Date(product.end_date);
      // Adjust to local ISO string manually to fit input
      const localIsoString = new Date(
        dateObj.getTime() - dateObj.getTimezoneOffset() * 60000
      )
        .toISOString()
        .slice(0, 16);
      editForm.reset({
        name: product.name,
        category_id: product.category_id,
        price_step: Number(product.price_step),
        price_buy_now: product.price_buy_now
          ? Number(product.price_buy_now)
          : null,
        end_date: localIsoString,
        allow_first_time_bidder: product.allow_first_time_bidder,
        is_auto_extend: product.is_auto_extend,
      });
    }
  }, [isEditModalOpen, product, editForm]);
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/products/${id}`);
        setProduct(res.data.data as Product);
        if (
          !(res.data.data as Product).allow_first_time_bidder &&
          (res.data.data as Product).seller_id !== user?.user_id
        ) {
          console.log("First time bidders are not allowed for this product.");
          const userBids = await api
            .get("/auto-bids")
            .then((bidRes) => bidRes.data.data as AutoBid[])
            .catch(() => []);
          if (user && userBids.length === 0) {
            toast.error(
              "First-time bidders are not allowed to bid on this product. Please place an auto-bid on another product first."
            );
            navigate("/");
          }
        }
        document.title = res.data.data.name + " | Big Biddie";
        if (res.data.data.category_id) {
          const relatedRes = await api.get(
            `/products?category=${res.data.data.category_id}&limit=6`
          );
          const filtered = relatedRes.data.data
            .filter((p: any) => p.product_id !== Number(id))
            .slice(0, 5);
          setRelatedProducts(filtered);
        }
      } catch (error) {
        if ((error as any).response && (error as any).response.status === 404) {
          toast.error("Product not found.");
          navigate("/not-found");
        }
        console.error("Failed to load product", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);
  useEffect(() => {
    const checkIfUserIsBlocked = async () => {
      try {
        const res = await api.get(`/products/${id}/is-blocked`);
        if (res.data.data) {
          toast.error(
            `You are blocked from bidding on this product at:  ${new Date(
              res.data.data.blocked_at
            ).toLocaleString()}. Reason: ${res.data.data.reason}`
          );
          navigate("/");
        }
      } catch (error) {
        console.error("Failed to check block status", error);
      }
    };
    checkIfUserIsBlocked();
  }, [id]);
  useEffect(() => {
    if (bidderToBlock) blockForm.reset();
  }, [bidderToBlock, blockForm]);
  useEffect(() => {
    if (isDescModalOpen) descForm.reset();
  }, [isDescModalOpen, descForm]);

  useEffect(() => {
    const fetchBidsHistory = async () => {
      try {
        ``;
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
        setCurrentAutoBid(res.data.data[0] || null);
      } catch (error) {
        console.error("Failed to load current auto bid", error);
        setCurrentAutoBid(null);
      }
    };
    if (id) fetchCurrentAutoBid();
  }, [id]);

  // Check Favorite Status on Mount
  useEffect(() => {
    if (user && id) {
      const checkFavorite = async () => {
        try {
          const res = await api.get(`/watchlists/${id}`);
          if (res.data.data) {
            setIsFavorite(true);
          }
        } catch (error) {
          if (
            (error as any).response &&
            (error as any).response.status === 404
          ) {
            setIsFavorite(false);
          } else {
            console.error("Failed to check favorite status", error);
          }
        }
      };
      checkFavorite();
    }
  }, [user, id]);

  // --- SOCKET CONNECTION ---
  useEffect(() => {
    socketRef.current = io("http://localhost:3000");
    socketRef.current.emit("join_product", id);

    socketRef.current.on("product_updated", (payload: any) => {
      console.log("Real-time update:", payload);

      if (payload.type === "BID_PLACED") {
        setProduct(payload.data?.product);
        if (payload.data.newBid) {
          setBidsHistory((prev) => [payload.data.newBid, ...prev]);
        }
        setPriceChanged(true);
        setTimeout(() => setPriceChanged(false), 2000);

        toast.success(
          `New Bid! Price is now $${Number(
            payload.data.product.price_current
          ).toLocaleString()}`
        );
      }
    });
    socketRef.current.on(
      "new_comment",
      (payload: { type: string; data: object }) => {
        if (payload.type === "NEW_COMMENT") {
          if (isOwner) {
            toast.success("New question posted!", { duration: 1000 });
          }
          if (payload.data) {
            setComments((prev) => [payload.data as ProductComment, ...prev]);
          }
        } else if (payload.type === "REPLY_COMMENT") {
          if (payload.data) {
            setComments((prev) => {
              const newReply = payload.data as ProductComment;
              const parentId = newReply.parent_id;
              return prev.map((comment) => {
                if (comment.comment_id === parentId) {
                  return {
                    ...comment,
                    replies: [...(comment.replies || []), newReply],
                  };
                }
                return comment;
              });
            });
          }
        }
      }
    );
    socketRef.current.on("disconnect", () => {
      console.log("Socket disconnected");
    });
    socketRef.current.on("error", (error: any) => {
      console.error("Socket error:", error);
    });
    return () => {
      if (socketRef.current) {
        socketRef.current.removeAllListeners("product_updated");
        socketRef.current.removeAllListeners("new_comment");
        socketRef.current.emit("leave_product", id);
        socketRef.current.disconnect();
      }
    };
  }, [id]);

  const onUpdateProductSubmit = async (data: UpdateProductFormValues) => {
    try {
      const payload = {
        ...data,
        price_buy_now: data.price_buy_now || null,
      };

      await api.put(`/products/${id}`, payload);
      toast.success("Product updated successfully!");
      setIsEditModalOpen(false);

      // Refresh local product data
      const res = await api.get(`/products/${id}`);
      setProduct(res.data.data);
    } catch (error: any) {
      console.error("Failed to update product", error);
      toast.error(error.response?.data?.message || "Failed to update product.");
    }
  };
  const handlePlaceBid = async (amount: number) => {
    try {
      if (product.price_buy_now && amount >= Number(product.price_buy_now)) {
        setIsBuyNowModalOpen(true);
      } else if (currentAutoBid) {
        const payload: CreateBid = { max_price: amount * 1000 };
        await api.put(`/auto-bids/${currentAutoBid.auto_bid_id}`, payload);
        toast.success("Bid updated successfully!");
      } else {
        const payload: CreateBid = {
          product_id: Number(id),
          max_price: amount * 1000,
        };
        await api.post("/auto-bids", payload);
        toast.success("Bid placed successfully!");
      }
      // No need to manually refresh product here; socket handles it!
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to place bid");
    }
  };

  const handlePostComment = async (
    content: string,
    parent_id: number | null = null
  ) => {
    console.log("Posting comment:", content);
    try {
      const payload = {
        product_id: Number(id),
        content,
        parent_id: parent_id,
      };
      await api.post("/comments", payload);
      toast.success("Comment posted successfully!");
    } catch (error) {
      toast.error("Failed to post comment. Please try again.");
      console.error("Failed to post comment", error);
    }
  };
  const handleBuyNow = async () => {
    try {
      toast.info("Processing Buy Now...");
      const res = await api.post(`/receipts`, { product_id: Number(id) });
      if (res.data.data && res.status === 201) {
        toast.success("Buy Now successful! Redirecting to checkout...");
        navigate("/checkout/" + product.product_id);
      }
    } catch (error) {
      toast.error("Failed to process Buy Now. Please try again.");
    } finally {
      setIsBuyNowModalOpen(false);
    }
  };
  const handleContactSeller = () => {
    navigate("/checkout/" + product.product_id);
  };
  const handleRequestBlock = (userId: number, userName: string) => {
    setBidderToBlock({ id: userId, name: userName });
  };

  const onBlockSubmit = async (data: BlockFormValues) => {
    if (!bidderToBlock) return;

    try {
      await api.post(`/products/${id}/block`, {
        user_id: bidderToBlock.id,
        reason: data.reason, // Send the reason
      });
      toast.success(`Blocked ${bidderToBlock.name} successfully.`);
      setBidsHistory((prev) =>
        prev.filter((bid) => bid.bidder_id !== bidderToBlock.id)
      );
      setBidderToBlock(null);
    } catch (error: any) {
      console.error("Failed to block user", error);
      toast.error(error.response?.data?.message || "Failed to block user.");
    }
  };
  const onDescriptionSubmit = async (data: DescriptionFormValues) => {
    try {
      const res = await api.post(`/products/${id}/description`, {
        content: data.content,
      });
      toast.success("Description added successfully!");
      const newDesc = res.data.data || { content: data.content };
      setProduct((prev) => ({
        ...prev,
        product_descriptions: [...(prev.product_descriptions || []), newDesc],
      }));

      setIsDescModalOpen(false);
    } catch (error: any) {
      console.error("Failed to add description", error);
      toast.error("Failed to add description.");
    }
  };

  const toggleFavorite = async () => {
    if (!user) return;
    setLoadingFav(true);
    try {
      if (isFavorite) {
        await api.delete(`/watchlists/${id}`);
        toast.success("Updated watchlist");
      } else {
        await api.post("/watchlists", { product_id: Number(id) });
        toast.success("Added to favorites");
      }
      setIsFavorite(!isFavorite);
    } catch (error) {
      toast.error("Failed to update favorite");
    } finally {
      setLoadingFav(false);
    }
  };

  const scrollToBidding = () => {
    const section = document.getElementById("bidding-section");
    if (section) section.scrollIntoView({ behavior: "smooth" });
  };

  if (loading)
    return (
      <div className="container py-10">
        <Skeleton className="h-[500px] w-full" />
      </div>
    );
  if (!product)
    return <div className="container py-10 text-center">Product not found</div>;

  return (
    <div className="container mx-auto space-y-8 pb-12">
      {/* OVERVIEW SECTION */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 lg:p-8 shadow-sm">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          <ProductGallery
            images={product.product_images}
            productName={product.name}
          />
          <div className="space-y-6">
            <div>
              <div className="flex justify-between items-start">
                <h1 className="text-3xl font-black text-gray-900 mb-3 leading-tight">
                  {product.name}
                </h1>
              </div>

              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                <span className="flex items-center gap-1 bg-gray-100 px-3 py-1 rounded-full">
                  <Tag className="w-3.5 h-3.5" /> {product.category?.name}
                </span>
                <span className="flex items-center gap-1">
                  <UserIcon className="w-4 h-4" /> Seller:{" "}
                  {!isOwner ? (
                    /* VISITOR VIEW: Link to Profile + Rating Badge */
                    <Link
                      to={`/profile/${product.seller_id}`}
                      className="flex items-center gap-2 group font-medium text-gray-700"
                    >
                      <span className="group-hover:text-blue-600 group-hover:underline transition-colors">
                        {product.seller?.full_name}
                      </span>
                      {(() => {
                        const pos = Number(
                          product.seller?.positive_rating || 0
                        );
                        const neg = Number(
                          product.seller?.negative_rating || 0
                        );
                        const total = pos + neg;
                        const score =
                          total > 0 ? Math.round((pos / total) * 100) : 0;

                        return (
                          <Badge
                            variant="secondary"
                            className="text-xs h-5 px-1.5 bg-blue-50 text-blue-700 border border-blue-100 hover:bg-blue-100"
                          >
                            {score}%
                          </Badge>
                        );
                      })()}
                    </Link>
                  ) : (
                    /* OWNER VIEW: Just Name */
                    <span className="font-medium text-gray-700">
                      {product.seller?.full_name} (You)
                    </span>
                  )}
                </span>
              </div>
            </div>

            <Separator />

            {/* Pricing Box - Change color if owner */}
            <div
              className={`p-6 rounded-xl border space-y-5 ${
                isOwner
                  ? "bg-amber-50 border-amber-200"
                  : isWinner
                  ? "bg-green-50 border-green-200"
                  : isQualifiedToBid
                  ? "bg-grey-50 border-grey-200"
                  : "bg-red-50 border-red-200"
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">
                    {isExpired ? "Final Price" : "Current Price"}
                  </p>
                  <p
                    className={`text-4xl font-black transition-all duration-500 ${
                      priceChanged
                        ? "text-green-600 scale-110 origin-left"
                        : "text-blue-600"
                    }`}
                  >
                    {product.price_current
                      ? `₫${Number(product.price_current).toLocaleString()}`
                      : "No bids yet"}
                  </p>
                </div>
                <div className="text-right space-y-2">
                  <Badge
                    variant={isExpired ? "secondary" : "default"}
                    className="px-3 py-1 text-sm"
                  >
                    {product.bid_count || 0} Bids
                  </Badge>
                  <div
                    className={`flex items-center justify-end gap-1.5 font-bold text-lg ${
                      isExpired ? "text-gray-500" : "text-orange-600"
                    }`}
                  >
                    <Clock className="w-5 h-5" />
                    {isExpired ? "Ended" : formatTimeLeft(product.end_date)}
                  </div>
                </div>
              </div>

              {/* Price Details Grid */}
              <div className="flex flex-col items-center justify-between bg-white p-4 rounded-lg border border-dashed border-gray-300 shadow-sm">
                {product.price_buy_now && (
                  <div className="w-full flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-600">
                      Buy Now Price
                    </span>
                    <span className="text-xl font-bold text-gray-900">
                      ₫{Number(product.price_buy_now).toLocaleString()}
                    </span>
                  </div>
                )}
                <div className="w-full flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-600">
                    Start
                  </span>
                  <span className="text-xl font-bold text-gray-900">
                    ₫{Number(product.price_start).toLocaleString()}
                  </span>
                </div>
                <div className="w-full flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-600">
                    Step
                  </span>
                  <span className="text-xl font-bold text-gray-900">
                    ₫{Number(product.price_step).toLocaleString()}
                  </span>
                </div>

                {/* Updated Highest Bidder Section */}
                <div className="w-full flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-600">
                    Highest Bidder
                  </span>
                  <div className="text-xl font-bold text-gray-900">
                    {product.winner_id && product.winner ? (
                      <Link
                        to={`/profile/${product.winner_id}`}
                        className="flex items-center gap-2 group"
                      >
                        <span className="group-hover:text-blue-600 group-hover:underline decoration-blue-600 underline-offset-4 transition-colors">
                          {product.winner.full_name}
                        </span>

                        {/* Positive Rating Badge */}
                        {(() => {
                          // Safely cast to number in case they come as strings
                          const pos = Number(
                            product.winner.positive_rating || 0
                          );
                          const neg = Number(
                            product.winner.negative_rating || 0
                          );
                          const total = pos + neg;
                          // Avoid division by zero
                          const score =
                            total > 0 ? Math.round((pos / total) * 100) : 0;

                          return (
                            <Badge
                              variant="secondary"
                              className="text-xs h-5 px-1.5 bg-blue-50 text-blue-700 border border-blue-100 hover:bg-blue-100"
                              title="Positive Score"
                            >
                              {score}%
                            </Badge>
                          );
                        })()}
                      </Link>
                    ) : (
                      "No Winner yet"
                    )}
                  </div>
                </div>
              </div>

              {/* --- CONDITIONAL ACTION AREA --- */}

              {/* SCENARIO 1: OWNER */}
              {isOwner ? (
                <div className="flex flex-col gap-4">
                  <div className="p-4 bg-white rounded-lg border border-amber-200 text-center flex flex-col items-center justify-center gap-2">
                    <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">
                      Owner View
                    </Badge>
                    <p className="text-sm text-amber-700 font-medium">
                      You are the seller of this item.
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => setIsEditModalOpen(true)}
                    className="gap-2 border-blue-200 text-blue-700 bg-blue-50 hover:bg-blue-100"
                  >
                    <Pencil className="w-4 h-4" /> Edit Product
                  </Button>
                  <Button
                    onClick={() => setIsDescModalOpen(true)}
                    className="flex-1 gap-2 bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <Plus className="w-4 h-4" /> Add Info
                  </Button>
                </div>
              ) : /* SCENARIO 2: EXPIRED & WINNER */
              isExpired && isWinner ? (
                <div className="flex flex-col gap-4 animate-in fade-in zoom-in duration-300">
                  <div className="p-4 bg-green-100 rounded-lg border border-green-300 text-center space-y-2">
                    <h3 className="text-lg font-bold text-green-800">
                      Congratulations!
                    </h3>
                    <p className="text-sm text-green-700">
                      You won this auction!
                    </p>
                  </div>
                  <Button
                    onClick={handleContactSeller} // Or navigate to specific Checkout page
                    className="w-full h-12 text-lg font-bold bg-green-600 hover:bg-green-700 shadow-md flex items-center gap-2"
                  >
                    <HandCoinsIcon className="w-6 h-6" />
                    Contact Seller & Checkout
                  </Button>
                  {user && (
                    <Button
                      variant={isFavorite ? "secondary" : "outline"}
                      onClick={toggleFavorite}
                      disabled={loadingFav}
                      className={`w-full h-12 text-lg font-bold gap-2 border-slate-200 shadow-md transition-all ${
                        isFavorite
                          ? "text-red-600 bg-red-50 border-red-100"
                          : "text-slate-600"
                      }`}
                    >
                      <Heart
                        className={`w-5 h-5 ${
                          isFavorite ? "fill-current" : ""
                        }`}
                      />
                      {isFavorite ? "Favorited" : "Favorite"}
                    </Button>
                  )}
                </div>
              ) : /* SCENARIO 3: EXPIRED & NON-WINNER */
              isExpired ? (
                <div className="flex flex-col gap-4">
                  <div className="p-6 bg-gray-100 rounded-lg border border-gray-300 text-center flex flex-col items-center justify-center gap-2">
                    <Clock className="w-8 h-8 text-gray-400" />
                    <span className="font-bold text-gray-600 text-lg">
                      Auction Ended
                    </span>
                    <p className="text-sm text-gray-500">
                      Bidding for this item is over.
                    </p>
                  </div>
                  {user && (
                    <Button
                      variant={isFavorite ? "secondary" : "outline"}
                      onClick={toggleFavorite}
                      disabled={loadingFav}
                      className={`w-full h-12 text-lg font-bold gap-2 border-slate-200 shadow-md transition-all ${
                        isFavorite
                          ? "text-red-600 bg-red-50 border-red-100"
                          : "text-slate-600"
                      }`}
                    >
                      <Heart
                        className={`w-5 h-5 ${
                          isFavorite ? "fill-current" : ""
                        }`}
                      />
                      {isFavorite ? "Favorited" : "Favorite"}
                    </Button>
                  )}
                </div>
              ) : /* SCENARIO 4: UNQUALIFIED TO BID */
              !isQualifiedToBid ? (
                <div className="flex flex-col gap-4">
                  <div className="p-6 bg-red-50 rounded-lg border border-red-200 text-center flex flex-col items-center justify-center gap-4">
                    <AlertTriangle className="w-8 h-8 text-red-500" />
                    <div className="space-y-2">
                      <span className="font-bold text-red-700 text-lg">
                        Not Qualified to Bid
                      </span>
                      <p className="text-sm text-red-600">
                        You're not qualified to Bid. Please upgrade your
                        positive rate to be at least 80%
                      </p>
                    </div>
                    <Link
                      to="/"
                      className="w-full h-10 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors flex items-center justify-center"
                    >
                      Go to Home Page
                    </Link>
                  </div>
                  {user && (
                    <Button
                      variant={isFavorite ? "secondary" : "outline"}
                      onClick={toggleFavorite}
                      disabled={loadingFav}
                      className={`w-full h-12 text-lg font-bold gap-2 border-slate-200 shadow-md transition-all ${
                        isFavorite
                          ? "text-red-600 bg-red-50 border-red-100"
                          : "text-slate-600"
                      }`}
                    >
                      <Heart
                        className={`w-5 h-5 ${
                          isFavorite ? "fill-current" : ""
                        }`}
                      />
                      {isFavorite ? "Favorited" : "Favorite"}
                    </Button>
                  )}
                </div>
              ) : (
                /* SCENARIO 5: ACTIVE (Standard Bidder View) */
                <div className="flex flex-col shrink-0 gap-4 items-center justify-end">
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
                  {user && (
                    <Button
                      variant={isFavorite ? "secondary" : "outline"}
                      onClick={toggleFavorite}
                      disabled={loadingFav}
                      className={`w-full h-12 text-lg font-bold gap-2 border-slate-200 shadow-md transition-all ${
                        isFavorite
                          ? "text-red-600 bg-red-50 border-red-100"
                          : "text-slate-600"
                      }`}
                    >
                      <Heart
                        className={`w-5 h-5 ${
                          isFavorite ? "fill-current" : ""
                        }`}
                      />
                      {isFavorite ? "Favorited" : "Favorite"}
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-6 lg:p-8 shadow-sm space-y-4">
        <h2 className="text-2xl font-bold border-b pb-4 text-gray-900">
          Description
        </h2>

        {/* Changed h-[80%] to min-h-[200px] to ensure it doesn't collapse if content is short */}
        <div className="bg-gray-50 border border-gray-200 w-full min-h-[200px] max-h-[500px] overflow-y-auto p-4 rounded-md">
          {product.product_descriptions?.length > 0 ? (
            product.product_descriptions?.map((desc, index) => (
              <div
                key={index}
                // Changed from <p> to <div> to support nested block elements
                className="flex flex-col gap-2 mb-6 border-b border-gray-200 pb-4 last:border-0 last:pb-0 last:mb-0"
              >
                {desc.created_at && (
                  <span className="font-light text-xs text-gray-400 uppercase tracking-wide">
                    {new Date(desc.created_at).toLocaleString()}
                  </span>
                )}

                {/* 1. prose/prose-sm: Tailwind Typography classes to automatically style h1, ul, ol, bold, etc.
             2. dangerouslySetInnerHTML: Renders the actual HTML string
             3. DOMPurify: Prevents XSS attacks
          */}
                <div
                  className="prose prose-sm max-w-none text-gray-800 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5"
                  dangerouslySetInnerHTML={{
                    __html: DOMPurify.sanitize(desc.content),
                  }}
                />
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400">
              <TextQuoteIcon className="w-10 h-10 mb-2 opacity-20" />
              <p className="italic text-sm">
                The seller hasn't added a description yet.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* BIDDING SECTION - HIDE IF EXPIRED */}
      {!isExpired && (
        <div
          id="bidding-section"
          className="bg-white border border-gray-200 rounded-xl p-6 lg:p-8 shadow-sm space-y-4 scroll-mt-24"
        >
          <div className="flex justify-between items-center border-b pb-4">
            <h2 className="text-2xl font-bold text-gray-900">
              Bidding & History
            </h2>
            {isOwner && (
              <Badge
                variant="outline"
                className="border-amber-200 text-amber-700 bg-amber-50"
              >
                Management Mode
              </Badge>
            )}
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
            onBlockBidder={handleRequestBlock}
          />
        </div>
      )}

      {/* COMMENTS SECTION - HIDE IF EXPIRED */}
      {!isExpired && (
        <div className="bg-white border border-gray-200 rounded-xl p-6 lg:p-8 shadow-sm space-y-4">
          <h2 className="text-2xl font-bold border-b pb-4 text-gray-900">
            Community Q&A
          </h2>
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
          <h2 className="text-2xl font-bold text-gray-900">
            More from {product.category?.name}
          </h2>
          <Link
            to={`/products?category=${product.category_id}`}
            className="text-blue-600 font-semibold hover:underline"
          >
            View All
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
          {relatedProducts.map((p) => (
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
              Are you sure you want to buy this item at ₫
              {product.price_buy_now
                ? Number(product.price_buy_now).toLocaleString()
                : "0"}
              ? This action can not be undone. You will be guided to checkout
              page after confirming.
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
                <span className="font-semibold">
                  ₫
                  {product.price_buy_now
                    ? Number(product.price_buy_now).toLocaleString()
                    : "0"}
                </span>
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
      <Dialog
        open={!!bidderToBlock}
        onOpenChange={(open) => !open && setBidderToBlock(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <Ban className="w-5 h-5" /> Block Bidder
            </DialogTitle>
            <DialogDescription>
              Blocking <strong>{bidderToBlock?.name}</strong> will remove their
              bids.
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={blockForm.handleSubmit(onBlockSubmit)}
            className="space-y-4"
          >
            <div className="space-y-2">
              <label htmlFor="reason" className="text-sm font-medium">
                Reason for blocking
              </label>
              <textarea
                id="reason"
                {...blockForm.register("reason")}
                className="flex min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                placeholder="e.g. Non-payment history..."
              />
              {blockForm.formState.errors.reason && (
                <p className="text-xs text-red-500 font-medium flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />{" "}
                  {blockForm.formState.errors.reason.message}
                </p>
              )}
            </div>
            <DialogFooter className="flex gap-2 sm:justify-end">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setBidderToBlock(null)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="destructive"
                disabled={blockForm.formState.isSubmitting}
              >
                Confirm Block
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <Dialog open={isDescModalOpen} onOpenChange={setIsDescModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-blue-700">
              <FileText className="w-5 h-5" /> Add Product Description
            </DialogTitle>
            <DialogDescription>
              Post additional details, updates, or clarifications for potential
              bidders. This will be appended to your existing description.
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={descForm.handleSubmit(onDescriptionSubmit)}
            className="space-y-4"
          >
            <div className="space-y-2">
              <textarea
                {...descForm.register("content")}
                className="flex min-h-[150px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-blue-600"
                placeholder="Write your update here..."
              />
              {descForm.formState.errors.content && (
                <p className="text-xs text-red-500 font-medium flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />{" "}
                  {descForm.formState.errors.content.message}
                </p>
              )}
            </div>
            <DialogFooter className="flex gap-2 sm:justify-end">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsDescModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700"
                disabled={descForm.formState.isSubmitting}
              >
                {descForm.formState.isSubmitting ? "Posting..." : "Post Update"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Update Product Details</DialogTitle>
            <DialogDescription>
              Modify your product listing. Note that some changes might affect
              active bids.
            </DialogDescription>
          </DialogHeader>

          <Form {...editForm}>
            <form
              onSubmit={editForm.handleSubmit(onUpdateProductSubmit)}
              className="space-y-4 py-2"
            >
              {/* Product Name */}
              <FormField
                control={editForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Product Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Product Name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Category */}
              <FormField
                control={editForm.control}
                name="category_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(Number(value))}
                      value={String(field.value)}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories.map((parent) =>
                          parent.sub_categories.length > 0 ? (
                            // CASE A: Parent has sub-categories -> Render Group
                            <SelectGroup key={parent.category_id}>
                              <SelectLabel className="pl-2 py-1 text-xs font-bold text-muted-foreground uppercase tracking-wider bg-gray-50">
                                {parent.name}
                              </SelectLabel>
                              {parent.sub_categories.map((child: any) => (
                                <SelectItem
                                  key={child.category_id}
                                  value={String(child.category_id)}
                                  className="pl-6"
                                >
                                  {child.name}
                                </SelectItem>
                              ))}
                            </SelectGroup>
                          ) : (
                            // CASE B: Parent has NO sub-categories (Atomic) -> Render as Item
                            <SelectItem
                              key={parent.category_id}
                              value={String(parent.category_id)}
                            >
                              {parent.name}
                            </SelectItem>
                          )
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                {/* Price Step */}
                <FormField
                  control={editForm.control}
                  name="price_step"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Step Price (₫)</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Buy Now Price */}
                <FormField
                  control={editForm.control}
                  name="price_buy_now"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Buy Now Price (Optional)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="Leave empty to disable"
                          {...field}
                          value={field.value ?? ""}
                          onChange={(e) =>
                            field.onChange(
                              e.target.value ? Number(e.target.value) : null
                            )
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* End Date */}
              <FormField
                control={editForm.control}
                name="end_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>End Date</FormLabel>
                    <FormControl>
                      <Input type="datetime-local" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Checkboxes */}
              <div className="flex flex-col gap-3 pt-2">
                <FormField
                  control={editForm.control}
                  name="allow_first_time_bidder"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 shadow-sm">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Newbie Friendly</FormLabel>
                        <FormDescription>
                          Allow users without rating history to bid.
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />

                <FormField
                  control={editForm.control}
                  name="is_auto_extend"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 shadow-sm">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Auto-Extend</FormLabel>
                        <FormDescription>
                          Extend auction by 10 mins if bid placed in last 5
                          mins.
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={editForm.formState.isSubmitting}
                >
                  {editForm.formState.isSubmitting
                    ? "Updating..."
                    : "Save Changes"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProductDetailPage;
