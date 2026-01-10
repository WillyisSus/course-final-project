import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router";
import { useSelector } from "react-redux";
import { io, Socket } from "socket.io-client";
import api from "@/lib/axios";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {z} from "zod";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Send,
  ArrowLeft,
  Lock,
  CheckCircle2,
  PackageCheck,
  Banknote,
  Star,
  ArrowUp,
  StopCircleIcon,
  XCircle,
} from "lucide-react";
import CheckoutButton from "@/components/CheckoutButton";
import type { ProductImage, User, Category } from "@/types/product";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";

interface Receipt {
  receipt_id: number;
  product_id: number;
  seller_id: number;
  buyer_id: number;
  amount: number;
  status: "PENDING" | "CANCELED" | "FINISHED";
  created_at: string;
  product: {
    product_id: number;
    seller_id: number;
    winner_id: number;
    name: string;
    product_images: ProductImage[];
    category: Category;
  };
  paid_by_buyer: boolean;
  confirmed_by_seller: boolean;
  confirmed_by_buyer: boolean;
  seller: User;
  buyer: User;
}
const ratingSchema = z.object({
  rating_type: z.enum(["GOOD", "BAD"], {error: "Please select a rating type"}),
  reason: z.string().min(5, "Reason must be at least 5 characters").max(200, "Reason must not exceed 200 characters"),
});

type RatingFormValues = z.infer<typeof ratingSchema>;

const CheckoutPage = () => {
  const { productId } = useParams();
  const navigate = useNavigate();
  const { user } = useSelector((state: any) => state.auth);

  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [loading, setLoading] = useState(true);

  const [messages, setMessages] = useState<any[]>([]);
  const [messageInput, setMessageInput] = useState("");
  const [isSending, setIsSending] = useState(false);
 // Add rating modal state
  const [isRatingModalOpen, setIsRatingModalOpen] = useState(false);
  const [partnerRating, setPartnerRating] = useState<number | null>(null);
 // Add cancel confirmation modal state
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  const socketRef = useRef<Socket | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const ratingForm = useForm<RatingFormValues>({
    resolver: zodResolver(ratingSchema),
    defaultValues: {
      rating_type: undefined,
      reason: "",
    },
  });
  // 1. Fetch Receipt
  useEffect(() => {
    const fetchReceipt = async () => {
      try {
        const res = await api.get(`/receipts?product_id=${productId}`);
        const data = Array.isArray(res.data.data)
          ? res.data.data[0]
          : res.data.data;
        console.log(data);
        setReceipt(data);
      } catch (error) {
        console.error("Failed to load receipt", error);
        toast.error("Could not load transaction details");
      } finally {
        setLoading(false);
      }
    };
    if (productId) fetchReceipt();
  }, [productId]);

  const isOwner = user?.user_id === receipt?.seller_id;
  const partnerId = isOwner ? receipt?.buyer_id : receipt?.seller_id;
  const partnerName = isOwner
    ? receipt?.buyer?.full_name
    : receipt?.seller?.full_name;
  // Fetch partner rating
  useEffect(() => {
    const fetchPartnerRating = async () => {
      if (!partnerId) return;
      try {
        const res = await api.get(`/users/${partnerId}`);
        const partnerData = res.data.data;
        const positive = parseInt(partnerData.positive_rating) || 0;
        const negative = parseInt(partnerData.negative_rating) || 0;
        const total = positive + negative;
        
        if (total > 0) {
          const percentage = Math.round((positive / total) * 100);
          setPartnerRating(percentage);
        }
      } catch (error) {
        console.error("Failed to fetch partner rating", error);
      }
    };
    fetchPartnerRating();
  }, [partnerId]);
  useEffect(() => {
    if (!receipt || !user || !partnerId) return;

    const fetchMessages = async () => {
      try {
        const res = await api.get(`/messages/conversation`, {
          params: { user_id: partnerId, product_id: productId },
        });
        setMessages(res.data.data);
        scrollToBottom();
      } catch (error) {
        console.error("Failed to load messages", error);
      }
    };
    fetchMessages();

    socketRef.current = io("http://localhost:3000");
    socketRef.current.emit("join_transaction", productId);

    socketRef.current.on("new_transaction_message", (payload: any) => {
      setMessages((prev) => {
        if (prev.some((m) => m.message_id === payload.message_id)) return prev;
        return [...prev, payload];
      });
      scrollToBottom();
    });

    return () => {
      socketRef.current?.removeAllListeners('new_transaction_message');
      socketRef.current?.disconnect();
    };
  }, [receipt, user, partnerId, productId]);

  const scrollToBottom = () => {
    setTimeout(() => {
      scrollRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  const handleUpdateStatus = async (
    type: "confirm_payment" | "confirm_receipt"
  ) => {
    if (!receipt) return;
    try {
      const payload: any = {};
      if (type === "confirm_payment") payload.confirmed_by_seller = true;
      if (type === "confirm_receipt") payload.confirmed_by_buyer = true;

      await api.put(`/receipts/${receipt.receipt_id}`, payload);

      setReceipt((prev) => (prev ? { ...prev, ...payload } : null));
      toast.success("Status updated successfully!");
    } catch (error) {
      console.error("Update failed", error);
      toast.error("Failed to update status");
    }
  };
  const handleCancelTransaction = async () => {
    if (!receipt) return;
    
    setIsCancelling(true);
    try {
      // Cancel the transaction
      await api.put(`/receipts/${receipt.receipt_id}`, {
        status: "CANCELED",
      });

      // Create automatic negative feedback
      await api.post(`/feedbacks`, {
        product_id: productId,
        to_user_id: partnerId,
        rating: "-1",
        comment: "Payment was not committed appropriately by buyer",
      });

      toast.success("Transaction cancelled and feedback create. Redirecting...", {duration: 1000});
      setIsCancelModalOpen(false);
      
      // Navigate back after a short delay
      setTimeout(() => {
        socketRef.current?.removeAllListeners('new_transaction_message');
        socketRef.current?.disconnect();
        navigate("/profile");
      }, 1500);
    } catch (error: any) {
      console.error("Failed to cancel transaction", error);
      toast.error(error.response?.data?.message || "Failed to cancel transaction");
    } finally {
      setIsCancelling(false);
    }
  };
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim() || isSending) return;

    const content = messageInput;
    setIsSending(true);

    try {
      await api.post("/messages", {
        receiver_id: partnerId,
        product_id: Number(productId),
        content: content,
      });

      setMessageInput("");
    } catch (error) {
      console.error("Failed to send", error);
      toast.error("Message failed to send");
    } finally {
      setIsSending(false);
    }
  };

  if (loading)
    return (
      <div className="h-screen w-full flex items-center justify-center bg-gray-50">
        <Skeleton className="h-96 w-96 rounded-xl" />
      </div>
    );
  if (!receipt)
    return (
      <div className="h-screen flex items-center justify-center">
        Receipt not found
      </div>
    );

  const finalPrice = Number(receipt.amount);
  const EXCHANGE_RATE = 25000;
  const priceUSD = (finalPrice / EXCHANGE_RATE).toFixed(2);
  const onRatingSubmit = async (data: RatingFormValues) => {
    try {
      await api.post(`/ratings`, {
        rated_user_id: partnerId,
        rating_type: data.rating_type,
        reason: data.reason,
      });
      
      toast.success("Rating submitted successfully!");
      setIsRatingModalOpen(false);
      ratingForm.reset();
      
      // Refresh partner rating
      const res = await api.get(`/users/${partnerId}`);
      const partnerData = res.data.data;
      const positive = parseInt(partnerData.positive_rating) || 0;
      const negative = parseInt(partnerData.negative_rating) || 0;
      const total = positive + negative;
      
      if (total > 0) {
        const percentage = Math.round((positive / total) * 100);
        setPartnerRating(percentage);
      }
    } catch (error: any) {
      console.error("Failed to submit rating", error);
      toast.error(error.response?.data?.message || "Failed to submit rating");
    }
  };
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => 
            {
              socketRef.current?.removeAllListeners('new_transaction_message');
              socketRef.current?.disconnect();
              navigate(-1)
            }
            }>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="font-bold text-lg flex items-center gap-2">
              <Lock className="w-4 h-4 text-green-600" /> Secure Transaction
            </h1>
            <p className="text-xs text-muted-foreground">
              Receipt #{receipt.receipt_id} •{" "}
              {new Date(receipt.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {receipt.confirmed_by_seller && (
            <Badge
              variant="outline"
              className="bg-blue-50 text-blue-700 border-blue-200 hidden md:flex gap-1"
            >
              <CheckCircle2 className="w-3 h-3" /> Payment Confirmed
            </Badge>
          )}
          {receipt.confirmed_by_buyer && (
            <Badge
              variant="outline"
              className="bg-green-50 text-green-700 border-green-200 hidden md:flex gap-1"
            >
              <PackageCheck className="w-3 h-3" /> Item Received
            </Badge>
          )}
        </div>
      </header>

      <main className="flex-1 container max-w-6xl h-fit  mx-auto p-4 md:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full">
          {/* LEFT COLUMN: RECEIPT */}
          <div className="lg:col-span-5 flex flex-col gap-4 h-full ">
            <Card className="border-0 shadow-lg ring-1 ring-gray-100 flex-1 flex flex-col">
              <CardHeader className="bg-blue-50  border-b pb-6">
                <CardTitle className="text-xl text-blue-900">
                  Payment Receipt
                </CardTitle>
                <CardDescription>Transaction Status Tracking</CardDescription>
              </CardHeader>

              <CardContent className="space-y-6 pt-6 flex-1">
                <div className="flex gap-4">
                  <div className="w-24 h-24 bg-gray-100 rounded-lg overflow-hidden shrink-0 border">
                    <img
                      src={
                        receipt.product.product_images?.[0]?.image_url
                          ? `${receipt.product.product_images[0].image_url}`
                          : "/placeholder.png"
                      }
                      alt={receipt.product.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-bold text-gray-900 line-clamp-2">
                      {receipt.product.name}
                    </h3>
                    <div className="bg-blue-50/50 p-4 rounded-lg border border-blue-100 flex justify-between items-center">
                      <span className="font-bold text-blue-900">Total</span>
                      <span className="font-black text-2xl text-blue-700">
                        ₫{finalPrice.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
                <Separator />
                <div className="space-y-4">
                  {/* Step 1: Buyer Paid */}
                  <div
                    className={`p-3 rounded-lg border flex items-center justify-between ${
                      receipt.paid_by_buyer
                        ? "bg-green-50 border-green-200"
                        : "bg-gray-50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`p-2 rounded-full ${
                          receipt.paid_by_buyer ? "bg-green-100" : "bg-gray-200"
                        }`}
                      >
                        <Banknote
                          className={`w-4 h-4 ${
                            receipt.paid_by_buyer
                              ? "text-green-700"
                              : "text-gray-500"
                          }`}
                        />
                      </div>
                      <div className="text-sm">
                        <p className="font-semibold text-gray-900">
                          Buyer Payment
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {receipt.paid_by_buyer
                            ? "Funds captured securely"
                            : "Waiting for payment"}
                        </p>
                      </div>
                    </div>
                    {receipt.paid_by_buyer && (
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                    )}
                  </div>

                  {/* Step 2: Seller Confirmed */}
                  <div
                    className={`p-3 rounded-lg border flex items-center justify-between ${
                      receipt.confirmed_by_seller
                        ? "bg-blue-50 border-blue-200"
                        : "bg-gray-50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`p-2 rounded-full ${
                          receipt.confirmed_by_seller
                            ? "bg-blue-100"
                            : "bg-gray-200"
                        }`}
                      >
                        <CheckCircle2
                          className={`w-4 h-4 ${
                            receipt.confirmed_by_seller
                              ? "text-blue-700"
                              : "text-gray-500"
                          }`}
                        />
                      </div>
                      <div className="text-sm">
                        <p className="font-semibold text-gray-900">
                          Seller Confirmation
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {receipt.confirmed_by_seller
                            ? "Payment verified by seller"
                            : "Waiting for seller check"}
                        </p>
                      </div>
                    </div>
                    {receipt.confirmed_by_seller && (
                      <Badge className="bg-blue-600">Confirmed</Badge>
                    )}
                  </div>

                  {/* Step 3: Buyer Received */}
                  <div
                    className={`p-3 rounded-lg border flex items-center justify-between ${
                      receipt.confirmed_by_buyer
                        ? "bg-purple-50 border-purple-200"
                        : "bg-gray-50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`p-2 rounded-full ${
                          receipt.confirmed_by_buyer
                            ? "bg-purple-100"
                            : "bg-gray-200"
                        }`}
                      >
                        <PackageCheck
                          className={`w-4 h-4 ${
                            receipt.confirmed_by_buyer
                              ? "text-purple-700"
                              : "text-gray-500"
                          }`}
                        />
                      </div>
                      <div className="text-sm">
                        <p className="font-semibold text-gray-900">
                          Order Completed
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {receipt.confirmed_by_buyer
                            ? "Item received by buyer"
                            : "In transit / Pending"}
                        </p>
                      </div>
                    </div>
                    {receipt.confirmed_by_buyer && (
                      <Badge className="bg-purple-600">Received</Badge>
                    )}
                  </div>
                </div>

                <Separator />
              </CardContent>

              <CardFooter className="bg-gray-50/50 border-t p-2 flex flex-col gap-3">
                {receipt.status === "CANCELED" && (
                  <div className="w-full p-3 bg-red-100 text-red-800 rounded-lg text-center font-bold text-sm border border-red-200">
                    ❌ Transaction Canceled by Seller
                  </div>
                )}
                {!receipt.paid_by_buyer && !isOwner && receipt.status !== "CANCELED" && (
                  <div className="w-full">
                    <CheckoutButton
                      amount={finalPrice}
                      product_id={receipt.product_id}
                      seller_id={receipt.seller_id}
                    />
                  </div>
                )}
                {isOwner &&
                  receipt.paid_by_buyer &&
                  !receipt.confirmed_by_seller &&
                  receipt.status !== "CANCELED" && (
                    <Button
                      className="w-2/3 bg-blue-600 hover:bg-blue-700"
                      onClick={() => handleUpdateStatus("confirm_payment")}
                    >
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Confirm Payment & Ship
                    </Button>
                  )}
                {isOwner && receipt.status !== "CANCELED" && (
                  <Button
                    variant={"secondary"}
                    className="w-2/3 bg-red-500 hover:bg-red-600 text-white"
                    onClick={() => setIsCancelModalOpen(true)}
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Cancel Transaction
                  </Button>
                )}
                {!isOwner &&
                  receipt.paid_by_buyer &&
                  !receipt.confirmed_by_buyer &&
                  receipt.status !== "CANCELED" && (
                    <Button
                      disabled={!receipt.confirmed_by_buyer}
                      className="w-2/3 bg-blue-600 hover:bg-blue-700"
                      onClick={() => handleUpdateStatus("confirm_receipt")}
                    >
                      <PackageCheck className="w-4 h-4 mr-2" />
                      Confirm Item Received
                    </Button>
                  )}
                {receipt.confirmed_by_buyer && receipt.status !== "CANCELED" && (
                  <div className="w-2/3 p-3 bg-green-100 text-green-800 rounded-lg text-center font-bold text-sm border border-green-200">
                    🎉 Transaction Completed Successfully!
                  </div>
                )}
              </CardFooter>
            </Card>
          </div>

          {/* RIGHT COLUMN: MESSENGER */}
          <div className="lg:col-span-7 flex flex-col">
            <Card className=" flex flex-col border-0 shadow-lg ring-1 ring-gray-100 overflow-hidden">
              <CardHeader className="border-b py-4 px-6 bg-white shrink-0 flex flex-row items-center gap-3">
                <Avatar className="h-10 w-10 border">
                  <AvatarImage src="/placeholder-user.jpg" />
                  <AvatarFallback>
                    {partnerName?.charAt(0) || "U"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    {partnerName || "Trading Partner"}
                    <Badge
                      variant="outline"
                      className="text-[10px] px-1 py-0 h-4"
                    >
                      {isOwner ? "Buyer" : "Seller"}
                    </Badge>
                  </CardTitle>
                  <CardDescription className="text-xs flex items-center gap-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />{" "}
                    Online
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  {partnerRating !== null && (
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <ArrowUp className="w-3 h-3 fill-green-500 text-green-500" />
                      Rating: {partnerRating}%
                    </Badge>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setIsRatingModalOpen(true)}
                    className="text-xs"
                  >
                    Rate
                  </Button>
                </div>
              </CardHeader>

              {/* CHAT AREA: Fixed scrolling */}
              <div className="overflow-y-scroll h-96 bg-slate-50/50 p-6 space-y-4">
                <div className="flex justify-center">
                  <div className="bg-gray-200 text-gray-600 text-center text-xs py-1 px-3 rounded-full">
                    Transaction room created. Please discuss shipping details
                    here.
                  </div>
                </div>
                {messages.map((msg) => {
                  const isMe = msg.sender_id === user?.user_id;
                  return (
                    <div
                      key={msg.message_id || msg.id}
                      className={`flex ${
                        isMe ? "justify-end" : "justify-start"
                      }`}
                    >
                      <div
                        className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm shadow-sm ${
                          isMe
                            ? "bg-blue-600 text-white rounded-br-none"
                            : "bg-white border text-gray-800 rounded-bl-none"
                        }`}
                      >
                        {msg.content}
                      </div>
                    </div>
                  );
                })}
                <div ref={scrollRef} />
              </div>

              {/* INPUT AREA */}
              <div className="p-4 bg-white border-t shrink-0">
                <form onSubmit={handleSendMessage} className="flex gap-2">
                  <Input
                    placeholder="Discuss shipping or ask questions..."
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    className="flex-1 bg-gray-50 focus-visible:bg-white transition-colors"
                    disabled={isSending}
                  />
                  <Button
                    type="submit"
                    size="icon"
                    className="bg-blue-600 hover:bg-blue-700"
                    disabled={isSending}
                  >
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
      <Dialog open={isRatingModalOpen} onOpenChange={setIsRatingModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Rate {partnerName}</DialogTitle>
            <DialogDescription>
              Share your experience with this trading partner
            </DialogDescription>
          </DialogHeader>
          <Form {...ratingForm}>
            <form onSubmit={ratingForm.handleSubmit(onRatingSubmit)} className="space-y-4">
              <FormField
                control={ratingForm.control}
                name="rating_type"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel>Rating Type</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex flex-col space-y-1"
                      >
                        <FormItem className="flex items-center space-x-3 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="GOOD" />
                          </FormControl>
                          <FormLabel className="font-normal cursor-pointer">
                            👍 Good - Positive experience
                          </FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-3 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="BAD" />
                          </FormControl>
                          <FormLabel className="font-normal cursor-pointer">
                            👎 Bad - Negative experience
                          </FormLabel>
                        </FormItem>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={ratingForm.control}
                name="reason"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reason</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Please explain your rating (5-200 characters)..."
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsRatingModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">Submit Rating</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      <AlertDialog open={isCancelModalOpen} onOpenChange={setIsCancelModalOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Transaction?</AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p>
                Are you sure you want to cancel this transaction with{" "}
                <span className="font-semibold text-gray-900">
                  {receipt?.buyer?.full_name || "Buyer"}
                </span>{" "}
                for product{" "}
                <span className="font-semibold text-gray-900">
                  {receipt?.product.name}
                </span>
                ?
              </p>
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-800">
                  <span className="font-semibold">⚠️ Warning:</span> This action cannot be undone. A negative feedback will be created automatically for this buyer with reason: "Payment was not committed appropriately by buyer"
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isCancelling}>
              Keep Transaction
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancelTransaction}
              disabled={isCancelling}
              className="bg-red-600 hover:bg-red-700"
            >
              {isCancelling ? "Cancelling..." : "Cancel Transaction"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default CheckoutPage;
