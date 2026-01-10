import { useEffect, useState } from "react";
import { Link } from "react-router";
import api from "@/lib/axios";
import { 
  ShoppingBag, 
  ExternalLink, 
  ReceiptText, 
  Clock, 
  CheckCircle2, 
  XCircle,
  Banknote,
  UserCheck
} from "lucide-react";

// UI Components
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
import { Button } from "@/components/ui/button";
import { useAppSelector } from "@/store/hooks";
import type { Receipt } from "@/types/product";

const ProductTransactionTab = () => {
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAppSelector((state) => state.auth);

  useEffect(() => {
    const fetchTransactions = async () => {
      if (!user?.user_id) return;
      setLoading(true);
      try {
        const res = await api.get(`/receipts?role=BIDDER`);
        setReceipts(res.data.data || []);
      } catch (error) {
        console.error("Failed to fetch transactions", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, [user?.user_id]);

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

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-primary" /> Purchase History
              </CardTitle>
              <CardDescription>
                Track the status of your won auctions and purchases.
              </CardDescription>
            </div>
            <Badge variant="outline" className="border-primary/20 text-primary">
              {receipts.length} Transactions
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Date</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Seller</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead className="text-center">Paid</TableHead>
                  <TableHead className="text-center">Seller Confirmed</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {receipts.length > 0 ? (
                  receipts.map((receipt) => (
                    <TableRow key={receipt.receipt_id}>
                      <TableCell className="text-muted-foreground text-sm whitespace-nowrap">
                        {new Date(receipt.created_at).toLocaleDateString()}
                      </TableCell>

                      <TableCell className="font-medium max-w-[200px] truncate" title={receipt.product?.name}>
                        <Link to={`/products/${receipt.product_id}`} className="hover:underline flex items-center gap-1 text-gray-900 hover:text-blue-600 transition-colors">
                            {receipt.product?.name || "Unknown Product"}
                        </Link>
                      </TableCell>

                      <TableCell>
                         <span className="text-sm text-gray-600">{receipt.seller?.full_name || "Unknown Seller"}</span>
                      </TableCell>

                      <TableCell className="font-bold text-primary">
                        ₫{Number(receipt.amount).toLocaleString()}
                      </TableCell>

                      {/* ✅ Paid By Buyer Status */}
                      <TableCell className="text-center">
                        {receipt.paid_by_buyer ? (
                            <div className="flex justify-center" title="You have paid">
                                <Banknote className="w-5 h-5 text-green-600" />
                            </div>
                        ) : (
                            <div className="flex justify-center" title="Payment Pending">
                                <Banknote className="w-5 h-5 text-gray-300" />
                            </div>
                        )}
                      </TableCell>

                      {/* ✅ Confirmed By Seller Status */}
                      <TableCell className="text-center">
                        {receipt.confirmed_by_seller ? (
                             <div className="flex justify-center" title="Seller has confirmed payment">
                                <UserCheck className="w-5 h-5 text-green-600" />
                            </div>
                        ) : (
                            <div className="flex justify-center" title="Waiting for seller confirmation">
                                <UserCheck className="w-5 h-5 text-gray-300" />
                            </div>
                        )}
                      </TableCell>

                      <TableCell>
                        {getStatusBadge(receipt.status)}
                      </TableCell>

                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          asChild
                          className="h-8 text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                        >
                          <Link to={`/checkout/${receipt.product_id}`}>
                            View Receipt <ExternalLink className="ml-1 w-3 h-3" />
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="h-32 text-center text-muted-foreground italic"
                    >
                      <div className="flex flex-col items-center gap-2">
                        <ReceiptText className="w-8 h-8 text-gray-300" />
                        <p>You haven't purchased any items yet.</p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProductTransactionTab;