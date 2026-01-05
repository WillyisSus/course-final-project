import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import type { AutoBid, Bid } from '@/types/bid';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from "@hookform/resolvers/zod";
import { Gavel, RefreshCw } from 'lucide-react'; // Added Refresh icon

interface BiddingSectionProps {
    currentPrice: number;
    bidHistory: Bid[];
    onPlaceBid: (amount: number) => void;
    currentAutoBid?: AutoBid | null;
    step: number; 
    productId?: number;
}

const BiddingSection = ({ 
    currentPrice, 
    bidHistory, 
    onPlaceBid, 
    currentAutoBid, 
    step, 
    productId 
}: BiddingSectionProps) => {
    
    const [isFormOpen, setIsFormOpen] = useState(false);
    const minBid = Number(currentPrice) + Number(step);

    const bidSchema = z.object({
        product_id: z.number().optional(),
        max_price: z
            .number({ error: "Bid must be a number" })
            .min(minBid, { message: `Bid must be at least $${minBid.toLocaleString()}` }),
    });

    type BidFormValues = z.infer<typeof bidSchema>;

    const {
        register, 
        handleSubmit,
        formState: { errors, isSubmitting },
        reset,
        setValue
    } = useForm<BidFormValues>({
        resolver: zodResolver(bidSchema),
        defaultValues: {
            product_id: productId,
            max_price: minBid,
        },
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

    const maskName = (name: string) => name.split(" ")[0] + " ***";

    return (
        <div className="space-y-8">
        
        {!isFormOpen ? (
            <div className="bg-blue-50/30 p-6 rounded-xl border border-blue-100 flex flex-col items-center justify-center gap-4 text-center transition-all">
                
                <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                        {currentAutoBid ? "Update your Auto-Bid !" : "Ready to place a bid?"}
                    </h3>
                    <p className="text-sm text-gray-500">
                        Minimum required: <span className="font-bold text-gray-900">${minBid.toLocaleString()}</span>
                    </p>
                </div>
                
                <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
                    
                    {currentAutoBid && (
                        <Badge variant="outline" className="h-12 px-4 flex items-center gap-2 bg-green-50 text-green-700 border-green-200 text-sm font-medium">
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                            Your Auto Bid: ${currentAutoBid.max_price.toLocaleString()}
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
                                <RefreshCw className="w-5 h-5" />
                                Update Auto Bid
                            </>
                        ) : (
                            <>
                                <Gavel className="w-5 h-5" />
                                Place Bid
                            </>
                        )}
                    </Button>
                </div>
            </div>
        ) : (
            <Card className="border-blue-100 bg-blue-50/50 animate-in fade-in zoom-in-95 duration-200">
                <CardHeader className="pb-2">
                    <CardTitle className="flex items-center justify-between text-lg">
                        <span>
                            {currentAutoBid ? "Update Your Auto-Bid" : "Place Your Maximum Bid"}
                        </span>
                        {currentAutoBid && (
                            <Badge variant="outline" className="bg-green-100 text-green-700 border-green-200">
                                Current Max: ${currentAutoBid.max_price.toLocaleString()}
                            </Badge>
                        )}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit(onSubmit)} className="flex w-full flex-col gap-5">
                        <div className="space-y-2 w-full">
                            <label className="text-sm font-medium text-gray-700">
                                New Maximum Limit ($)
                            </label>
                            
                            <Input
                                {...register("max_price", { valueAsNumber: true })}
                                type="number"
                                step={step}
                                placeholder={`Min: $${minBid.toLocaleString()}`}
                                className="bg-white text-lg h-12 border-gray-300 focus:border-blue-500"
                                autoFocus 
                            />
                            
                            {errors.max_price ? (
                                <p className="text-xs text-red-500 font-medium animate-pulse">
                                    {errors.max_price.message}
                                </p>
                            ) : (
                                <p className="text-xs text-gray-500">
                                    {currentAutoBid 
                                        ? "Adjusting your limit will not place a new bid unless necessary to keep winning."
                                        : "System will automatically bid up to this amount for you."}
                                </p>
                            )}
                        </div>
                        
                        <div className="flex gap-3">
                            <Button 
                                type="button" 
                                variant="outline" 
                                onClick={handleCancel}
                                className="flex-1 h-11 font-semibold border-gray-300 hover:bg-gray-100 text-gray-700"
                            >
                                Cancel
                            </Button>
                            <Button 
                                type="submit" 
                                disabled={isSubmitting}
                                className="flex-2 h-11 text-lg font-bold bg-blue-600 hover:bg-blue-700 shadow-sm"
                            >
                                {currentAutoBid ? "Confirm Update" : "Confirm Bid"}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        )}

        {/* --- BID HISTORY TABLE (Unchanged) --- */}
        <div>
            <h3 className="text-xl font-bold mb-4">Bid History ({bidHistory.length})</h3>
            <div className="border rounded-lg overflow-hidden bg-white shadow-sm">
            <Table>
                <TableHeader className="bg-gray-50">
                <TableRow>
                    <TableHead>Bidder</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                </TableRow>
                </TableHeader>
                <TableBody>
                {bidHistory.length === 0 ? (
                    <TableRow>
                    <TableCell colSpan={3} className="text-center h-24 text-gray-500">
                        No bids yet. Be the first!
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
                        ${Number(bid.amount).toLocaleString()}
                        </TableCell>
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