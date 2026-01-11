import { useEffect, useState } from "react";
import { Link } from "react-router";
import api from "@/lib/axios";
import {
  ExternalLink,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  HandCoinsIcon,
} from "lucide-react";
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
import { Button } from "./ui/button";
import { useAppSelector } from "@/store/hooks";
import type { AutoBidHistoryItem } from "@/types/bid";

const AutoBidHistoryTab = () => {
  const [autoBids, setAutoBids] = useState<AutoBidHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAppSelector((state) => state.auth);
  const userId = user?.user_id;
  useEffect(() => {
    const fetchAutoBids = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/auto-bids`);
        console.log("Auto-bid history fetch response:", res.data);
        setAutoBids(res.data.data || []);
      } catch (error) {
        console.error("Failed to fetch auto-bid history", error);
      } finally {
        setLoading(false);
      }
    };
    if (userId) fetchAutoBids();
  }, [userId]);

  if (loading)
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );

  return (
    <Card className="animate-in fade-in duration-300">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              <HandCoinsIcon className="w-5 h-5 text-primary" /> My Auto Bids
            </CardTitle>
            <CardDescription>
              Automatic bidding configurations you have set
            </CardDescription>
          </div>
          <Badge variant="secondary">{autoBids.length} Autobids</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Product</TableHead>
                <TableHead>Max Limit</TableHead>
                <TableHead>Current Price</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {autoBids.length > 0 ? (
                autoBids.map((item) => {
                  const isWinner = item.product.winner_id === userId;
                  const isMaxedOut =
                    !isWinner &&
                    Number(item.product.price_current) >=
                      Number(item.max_price);
                  const isSold = item.product.status === "SOLD";

                  return (
                    <TableRow key={item.auto_bid_id}>
                      <TableCell className="font-medium">
                        {item.product.name}
                      </TableCell>
                      <TableCell className="font-bold">
                        ₫{Number(item.max_price).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        ₫{Number(item.product.price_current).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        {isSold && isWinner ? (
                          <Badge className="bg-green-600 gap-1">
                            <CheckCircle className="w-3 h-3" /> Won
                          </Badge>
                        ) : isSold && !isWinner ? (
                          <Badge variant="secondary" className="gap-1">
                            <XCircle className="w-3 h-3" /> Lost
                          </Badge>
                        ) : isWinner ? (
                          <Badge className="bg-blue-600 gap-1">
                            <CheckCircle className="w-3 h-3" /> Winning
                          </Badge>
                        ) : isMaxedOut ? (
                          <Badge
                            variant="destructive"
                            className="bg-red-100 text-red-700 hover:bg-red-200 border-red-200 gap-1"
                          >
                            <AlertTriangle className="w-3 h-3" /> Outbid
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="text-orange-600 border-orange-200 gap-1"
                          >
                            <Clock className="w-3 h-3" /> Active
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          asChild
                          className="h-8 text-blue-600 hover:text-blue-800"
                        >
                          <Link to={`/products/${item.product.product_id}`}>
                            View <ExternalLink className="ml-1 w-3 h-3" />
                          </Link>
                        </Button>
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
                    No auto-bids found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default AutoBidHistoryTab;
