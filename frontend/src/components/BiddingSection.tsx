import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import type { AutoBid, Bid } from "@/types/bid";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Ban, Gavel, RefreshCw } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface BiddingSectionProps {
  startPrice: number;
  currentPrice: number;
  bidHistory: Bid[];
  onPlaceBid: (amount: number) => void;
  // ✅ NEW: Prop to handle block click
  onBlockBidder?: (userId: number, userName: string) => void;
  currentAutoBid?: AutoBid | null;
  step: number;
  productId?: number;
  isOwner?: boolean;
}

const BiddingSection = ({
  startPrice,
  currentPrice,
  bidHistory,
  onPlaceBid,
  onBlockBidder, // Destructure
  currentAutoBid,
  step,
  productId,
  isOwner = false,
}: BiddingSectionProps) => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const minBid = currentPrice
    ? Number(currentPrice) + Number(step)
    : Number(startPrice) + Number(step);

  // ... (Keep existing form logic / Zod schema / useEffect unchanged) ...
  const bidSchema = z.object({
    product_id: z.number().optional(),
    max_price: z.number().min(minBid),
  });
  type BidFormValues = z.infer<typeof bidSchema>;
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
  } = useForm<BidFormValues>({
    resolver: zodResolver(bidSchema),
    defaultValues: { product_id: productId, max_price: minBid },
  });
  useEffect(() => {
    setValue("max_price", minBid);
  }, [minBid, setValue]);
  const onSubmit = (data: BidFormValues) => {
    onPlaceBid(data.max_price);
    setIsFormOpen(false);
    reset();
  };
  const handleCancel = () => {
    setIsFormOpen(false);
    reset();
  };
  const maskName = (name: string) =>
    isOwner ? name : name.split(" ")[0] + " ***";

  return (
    <div className="space-y-8">
      {isOwner ? (
        <div className="bg-amber-50 p-8 rounded-xl border border-amber-200 flex flex-col items-center justify-center gap-4 text-center">
          <div className="p-4 bg-white rounded-full shadow-sm border border-amber-100">
            <Ban className="w-10 h-10 text-amber-500" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">
              Bidding is Disabled for Seller
            </h3>
            <p className="text-gray-600 mt-2 max-w-lg mx-auto">
              To ensure a fair auction environment, sellers are not permitted to
              place bids on their own products.
            </p>
          </div>
        </div>
      ) : !isFormOpen ? (
        <div className="bg-blue-50/30 p-6 rounded-xl border border-blue-100 flex flex-col items-center justify-center gap-4 text-center transition-all">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {currentAutoBid
                ? "Update your Auto-Bid !"
                : "Ready to place a bid?"}
            </h3>
            <p className="text-sm text-gray-500">
              Minimum required:{" "}
              <span className="font-bold text-gray-900">
                ₫{minBid.toLocaleString()}
              </span>
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
            {currentAutoBid && (
              <Badge
                variant="outline"
                className="h-12 px-4 flex items-center gap-2 bg-green-50 text-green-700 border-green-200 text-sm font-medium"
              >
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                Your Auto Bid: ₫{currentAutoBid.max_price.toLocaleString()}
              </Badge>
            )}
            <Button
              onClick={() => setIsFormOpen(true)}
              className={`h-12 px-8 text-lg font-bold shadow-md transition-all w-full sm:w-auto flex items-center gap-2 ${
                currentAutoBid
                  ? "bg-white text-blue-600 border-2 border-blue-600 hover:bg-blue-50"
                  : "bg-blue-600 text-white hover:bg-blue-700"
              }`}
            >
              {currentAutoBid ? (
                <>
                  <RefreshCw className="w-5 h-5" /> Update Auto Bid
                </>
              ) : (
                <>
                  <Gavel className="w-5 h-5" /> Place Bid
                </>
              )}
            </Button>
          </div>
        </div>
      ) : (
        <Card className="border-blue-100 bg-blue-50/50 animate-in fade-in zoom-in-95 duration-200">
          {/* ... (Keep Form JSX unchanged) ... */}
          <CardHeader className="pb-2">
            <CardTitle>Place Your Maximum Bid</CardTitle>
            <CardDescription>If you want to place a maximum price at lease <span className="font-medium text-blue-600">Buy Now Price</span>, you can win this product at that price.</CardDescription>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={handleSubmit(onSubmit)}
              className="flex w-full flex-col gap-5"
            >
              <Input
                {...register("max_price", { valueAsNumber: true })}
                type="number"
                step={step}
                className="bg-white h-12"
                autoFocus
              />
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancel}
                  className="flex-1 h-11"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-2 h-11 bg-blue-600 hover:bg-blue-700"
                >
                  Confirm Bid
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* --- BID HISTORY TABLE --- */}
      <div>
        <h3 className="text-xl font-bold mb-4">
          Bid History ({bidHistory.length})
        </h3>
        <div className="border rounded-lg overflow-hidden bg-white shadow-sm">
          <Table>
            <TableHeader className="bg-gray-50">
              <TableRow>
                <TableHead>Bidder</TableHead>
                <TableHead>Time</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                {isOwner && (
                  <TableHead className="text-right w-[80px]">Action</TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {bidHistory.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={isOwner ? 4 : 3}
                    className="text-center h-24 text-gray-500"
                  >
                    No bids yet.
                  </TableCell>
                </TableRow>
              ) : (
                bidHistory.map((bid) => (
                  <TableRow key={bid.bid_id}>
                    <TableCell className="font-medium flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="text-[10px] bg-blue-100 text-blue-600 font-bold">
                          {bid.bidder.full_name?.charAt(0) || "U"}
                        </AvatarFallback>
                      </Avatar>
                      {maskName(bid.bidder.full_name || "Unknown User")}
                    </TableCell>
                    <TableCell className="text-gray-500 text-xs">
                      {new Date(bid.time).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right font-bold text-gray-900">
                      ₫{Number(bid.amount).toLocaleString()}
                    </TableCell>

                    {isOwner && (
                      <TableCell className="text-right">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-gray-400 hover:text-red-600 hover:bg-red-50"
                                onClick={() =>
                                  onBlockBidder &&
                                  onBlockBidder(
                                    bid.bidder.user_id,
                                    bid.bidder.full_name
                                  )
                                }
                              >
                                <Ban className="w-4 h-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Block Bidder</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </TableCell>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
};

export default BiddingSection;
