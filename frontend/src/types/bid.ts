export interface Bid {
  bid_id: number;
  product_id: number;
  bidder_id: number;
  amount: string;
  status: string;
  time: string;
  bidder: { user_id: number; full_name: string; positive_rating: number };
}

export interface CreateBid {
  product_id: number;
  max_price: number;
}

export interface AutoBid {
  auto_bid_id: number;
  product_id: number;
  bidder_id: number;
  max_price: string;
  created_at: string;
}