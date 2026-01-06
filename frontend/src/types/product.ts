// src/types/product.ts

export interface ProductImage {
  image_url: string;
  is_primary: boolean;
}

export interface ProductDescription {
  content: string;
}

export interface Category {
  category_id: number;
  name: string;
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
  parentid: number | null;
  created_at: string;
  user: User;
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
  status: 'ACTIVE' | 'SOLD' | 'EXPIRED';
  tsv?: string;
  bid_count?: number;
  product_descriptions?: ProductDescription[];
  product_images?: ProductImage[];
  category?: Category;
  seller?: User;
  winner?: User;
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