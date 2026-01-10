import { useEffect, useState } from "react";
import { Link } from "react-router";
import api from "@/lib/axios";
import { formatTimeLeft } from "@/lib/utils";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Package,
  CheckCircle,
  ExternalLink,
  MessageSquareText,
  BlocksIcon,
  StarHalfIcon,
  Eye,
  Ratio,
  ThumbsUp,
  X,
  CheckCircle2,
  Clock,
  XCircle,
  Banknote,
  UserCheck,
  Truck,
} from "lucide-react"; // Added Icon
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button"; // Adjusted import path if needed
import { useAppSelector } from "@/store/hooks";
import type { Product } from "@/types/product";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { AlertDialog, AlertDialogCancel, AlertDialogDescription, AlertDialogTitle } from "@radix-ui/react-alert-dialog";
import { AlertDialogAction, AlertDialogContent, AlertDialogFooter, AlertDialogHeader } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
const ratingSchema = z.object({
  rating_type: z.enum(["GOOD", "BAD"], {error: "Please select a rating type"}),
  reason: z.string().min(5, "Reason must be at least 5 characters").max(200, "Reason must not exceed 200 characters"),
});

type RatingFormValues = z.infer<typeof ratingSchema>;
const SellerInfoTab = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAppSelector((state) => state.auth);
  const sellerId = user?.user_id;
   // Add rating modal state
  const [isRatingModalOpen, setIsRatingModalOpen] = useState(false);
  // Add cancel confirmation modal state
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [targetedProduct, setTargetedProduct] = useState<Product | null>(null);
  useEffect(() => {
    const fetchSellerProducts = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/products?seller_id=${sellerId}`);
        console.log("Seller products fetch response:", res.data);
        setProducts(res.data.data || []);
      } catch (error) {
        console.error("Failed to fetch seller products", error);
      } finally {
        setLoading(false);
      }
    };
    if (sellerId) fetchSellerProducts();
  }, [sellerId]);
  const ratingForm = useForm<RatingFormValues>({
      resolver: zodResolver(ratingSchema),
      defaultValues: {
        rating_type: undefined,
        reason: "",
      },
  });
  const activeProducts = products.filter((p) => p.status === "ACTIVE");
  const finishedProducts = products.filter((p) => p.status !== "ACTIVE");
  const onRatingSubmit = async (data: RatingFormValues) => {
    try {
      await api.post(`/feedbacks`, {
        product_id: targetedProduct?.product_id,
        to_user_id: targetedProduct?.winner_id,
        rating: data.rating_type === "GOOD" ? "1" : "-1",
        comment: data.reason,
      });
      
      toast.success("Rating submitted successfully!");
      setIsRatingModalOpen(false);
      ratingForm.reset();
    } catch (error: any) {
      console.error("Failed to submit rating", error);
      toast.error(error.response?.data?.message || "Failed to submit rating");
    }
  };
  const handleCancelTransaction = async () => {
    if (!targetedProduct?.receipt) return;
    
    setIsCancelling(true);
    try {
      // Cancel the transaction
      await api.put(`/receipts/${targetedProduct?.receipt.receipt_id}`, {
        status: "CANCELED",
      });

      // Create automatic negative feedback
      await api.post(`/feedbacks`, {
        product_id: targetedProduct?.product_id,
        to_user_id: targetedProduct?.winner_id,
        rating: "-1",
        comment: "Payment was not committed appropriately by buyer",
      });

      toast.success("Transaction cancelled and feedback create.", {duration: 1000});
      setIsCancelModalOpen(false);
    } catch (error: any) {
      console.error("Failed to cancel transaction", error);
      toast.error(error.response?.data?.message || "Failed to cancel transaction");
    } finally {
      setIsCancelling(false);
    }
  };
  const handleOpenCancelModal = (product: Product) => {
    setTargetedProduct(product);
    setIsCancelModalOpen(true);
  }
  const handleOpenRatingModal = (product: Product) => {
    setTargetedProduct(product);
    setIsRatingModalOpen(true);
  }
  if (loading)
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "FINISHED":
        return <Badge className="bg-green-600 hover:bg-green-700"><CheckCircle2 className="w-3 h-3 mr-1"/> Finished</Badge>;
      case "CANCELED":
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1"/> Cancelled</Badge>;
      default:
        return <Badge variant="secondary" className="text-blue-600 bg-blue-50 hover:bg-blue-100"><Clock className="w-3 h-3 mr-1"/> Pending</Badge>;
    }
  };
  const renderTable = (data: Product[], emptyMsg: string, showReceiptStatus:boolean = false) => (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead>Product Name</TableHead>
            <TableHead>Current Price</TableHead>
            <TableHead>Bids</TableHead>
            <TableHead>Info</TableHead>
            {showReceiptStatus && <TableHead>Payment</TableHead>}
            {showReceiptStatus && <TableHead>Transaction</TableHead>}
            <TableHead className="text-right">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className="overflow-y-scroll max-h-2/3">
          {data.length > 0 ? (
            data.map((product) => {
              // Check if this specific row needs the "Transaction" button
              const isSold =
                product.status === "SOLD" ||
                (product.status !== "ACTIVE" && product.winner_id);

              return (
                <TableRow key={product.product_id}>
                  <TableCell
                    className="font-medium max-w-[200px] truncate"
                    title={product.name}
                  >
                    {product.name}
                  </TableCell>
                  <TableCell className="font-bold text-primary">
                    ₫{Number(product.price_current).toLocaleString()}
                  </TableCell>
                  <TableCell>{product.bid_count}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {product.status === "ACTIVE" ? (
                      <span className="text-orange-600 font-medium">
                        {formatTimeLeft(product.end_date)}
                      </span>
                    ) : (
                      <div className="flex flex-col">
                        <span>
                          Winner: {product.winner?.full_name || "None"}
                        </span>
                        <span className="text-xs">
                          {new Date(product.end_date).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </TableCell>
                  {showReceiptStatus && (
                    <>
                      <TableCell>
                        {product.receipt ?
                          product.receipt.paid_by_buyer ? (
                              <div className="flex justify-center" title="Buyer have paid">
                                  <Banknote className="w-5 h-5 text-green-600" />
                              </div>
                          ) : (
                              <div className="flex justify-center" title="Payment Pending">
                                  <Banknote className="w-5 h-5 text-gray-300" />
                              </div>
                          )
                         : (
                          <Badge variant="secondary">No Transaction</Badge>
                        )}
                      </TableCell>
                    </>
                  )}
                  {showReceiptStatus && (
                    <>
                      
                      <TableCell>
                        {product.receipt ? product.receipt.confirmed_by_buyer ? (
                              <div className="flex justify-center" title="Buyer have received item">
                                <Truck className="w-5 h-5 text-green-600" />
                            </div>
                        ) : (
                            <div className="flex justify-center" title="Waiting for seller confirmation">
                                <Truck className="w-5 h-5 text-gray-300" />
                            </div>
                        ) : (
                          <Badge variant="secondary">No Transaction</Badge>
                        )}
                      </TableCell>
                    </>
                    
                  )}
                  {showReceiptStatus && (
                    <>
                      
                      <TableCell>
                        {product.receipt ? (
                          getStatusBadge(product.receipt.status)
                        ) : (
                          <Badge variant="secondary">No Transaction</Badge>
                        )}
                      </TableCell>
                    </>
                    
                  )}
                  <TableCell className="text-right space-x-2">
                    <div className="inline-block mr-2 px-2 py-1 bg-gray-100 text-xs font-medium rounded-md">
                      {isSold && 
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            asChild
                            className="h-8 text-green-700 border-green-200 hover:bg-green-50"
                          >
                            <Link to={`/checkout/${product.product_id}`}>
                              <MessageSquareText className="mr-1 w-3 h-3" />
                            </Link>
                          </Button>
                          {product.receipt && product.receipt.status !== "CANCELED" &&  
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 text-red-700 border-red-200 hover:bg-red-50"
                              onClick={() => handleOpenCancelModal(product)}
                            >
                                <X className="mr-1 w-3 h-3" />
                            </Button>
                          }
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 text-gray-700 border-gray-200 hover:bg-gray-50"
                            onClick={() => handleOpenRatingModal(product)}
                          >
                              <ThumbsUp className="mr-1 w-3 h-3" /> 
                          </Button>
                        </>
                        }
                        <Button
                        variant="ghost"
                        size="sm"
                        asChild
                        className="h-8 text-center  text-blue-600 hover:bg-blue-50"
                      >
                      <Link to={`/products/${product.product_id}`}>
                        <Eye className="ml-1 w-3 h-3" />
                      </Link>
                    </Button>
                      </div>
                    
                    
                  </TableCell>
                </TableRow>
              );
            })
          ) : (
            <TableRow>
              <TableCell
                colSpan={5}
                className="h-24 text-center text-muted-foreground italic"
              >
                {emptyMsg}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Active Products Card */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5 text-primary" /> Active Auctions
              </CardTitle>
              <CardDescription>
                Products currently open for bidding
              </CardDescription>
            </div>
            <Badge>{activeProducts.length} Active</Badge>
          </div>
        </CardHeader>
        <CardContent>
          {renderTable(activeProducts, "No active products found.")}
        </CardContent>
      </Card>

      {/* Finished Products Card */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" /> Finished
                Auctions
              </CardTitle>
              <CardDescription>Sold and expired items</CardDescription>
            </div>
            <Badge variant="secondary">
              {finishedProducts.length} Finished
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {renderTable(finishedProducts, "No finished auctions yet.", true)}
        </CardContent>
      </Card>
      <Dialog open={isRatingModalOpen} onOpenChange={setIsRatingModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Rate {targetedProduct?.winner?.full_name}</DialogTitle>
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
                  {targetedProduct?.winner?.full_name || "Buyer"}
                </span>{" "}
                for product{" "}
                <span className="font-semibold text-gray-900">
                  {targetedProduct?.name}
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

export default SellerInfoTab;
