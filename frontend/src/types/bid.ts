export interface Bid {
  bid_id: number;
  product_id: number;
  bidder_id: number;
  amount: string;
  status: string;
  time: string;
  bidder: { user_id: number; full_name: string; positive_rating: number, negative_rating: number;};
}

export interface CreateBid {
  product_id?: number;
  max_price: number;
}


export interface AutoBid {
  auto_bid_id: number;
  product_id: number;
  bidder_id: number;
  max_price: string;
  created_at: string;
}

export interface AutoBidHistoryItem {
    auto_bid_id: number;
    max_price: number;
    created_at: string;
    product: {
        product_id: number;
        name: string;
        price_current: number;
        status: 'ACTIVE' | 'SOLD' | 'EXPIRED';
        end_date: string;
        winner_id?: number;
    };
}