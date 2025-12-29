// src/types/product.ts

export interface Product {
  product_id: number;
  seller_id: number;
  category_id: number;
  name: string;
  price_start: number;
  price_current: number;
  price_buy_now?: number; // Optional
  price_step: number;
  start_date: string;
  end_date: string;
  is_auto_extend: boolean;
  bid_count?: number;
  winner_id?: number;
  winner?:{full_name:string};
  status: 'ACTIVE' | 'SOLD' | 'EXPIRED';
  // Include other backend fields as needed
  product_images?: { image_url: string; is_primary: boolean }[];
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