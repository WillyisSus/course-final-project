// src/types/product.ts

export interface ProductImage {
  image_url: string;
  is_primary: boolean;
}

export interface ProductDescription {
  desc_id: number;
  content: string;
  created_at: string;
}

export interface Category {
  category_id: number;
  name: string;
  parent_id?: number | null;
  sub_categories: Category[]; 
}


export interface User {
  user_id: number;
  full_name: string;
  positive_rating: number;
  negative_rating: number;
}
export interface ProductComment{
  comment_id: number;
  product_id: number;
  user_id: number;
  content: string;
  parent_id: number | null;
  created_at: string;
  user: User;
  replies?: ProductComment[];
}
export interface Receipt{
  receipt_id: number;
  product_id: number;
  buyer_id: number;
  seller_id: number;
  amount: string;
  created_at: string;
  paid_by_buyer: boolean;
  confirmed_by_buyer: boolean;
  confirmed_by_seller: boolean;
  status: 'PENDING' | 'FINISHED' | 'CANCELED';
  product?:{
    product_id: number;
    name: string;
  }
  seller?:{
    user_id: number;
    full_name: string;
  }
  buyer?:{
    user_id: number;
    full_name: string;
  }
}
export interface Product {
  product_id: number;
  seller_id: number;
  category_id: number;
  winner_id?: number | null;
  name: string;
  price_start: string;
  price_step: string;
  price_buy_now?: string | null;
  price_current: string;
  start_date: string;
  end_date: string;
  is_auto_extend: boolean;
  allow_first_time_bidder: boolean;
  status: 'ACTIVE' | 'SOLD' | 'EXPIRED';
  tsv?: string;
  bid_count?: number;
  product_descriptions: ProductDescription[];
  product_images: ProductImage[];
  category: Category;
  seller: User;
  winner?: User;
  receipt?: Receipt
}

// The raw form values from your React Hook Form or state
export interface CreateProductInput {
  name: string;
  category_id: number; // Be careful: select inputs often return strings
  price_start: number;
  price_step: number;
  price_buy_now?: number;
  start_date?: string; // ISO string
  end_date: string;    // ISO string
  is_auto_extend: boolean;
  // The crucial part: The actual file objects from the input
  images: File[]; 
}