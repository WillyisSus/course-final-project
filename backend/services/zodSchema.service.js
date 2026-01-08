import { z } from 'zod';

/**
 * REUSABLE FRAGMENTS
 */
const idSchema = z.coerce.number().int().positive(); // For IDs (product_id, user_id, etc.)
const decimalSchema = z.coerce.number().positive();  // For prices

/**
 * 1. USER SCHEMAS
 * Matches
 */
export const registerUserSchema = z.object({
  email: z.email(), //
  // In DB it is password_hash, but input is raw password
  password: z.string().min(6, "Password must be at least 6 characters"), 
  full_name: z.string().min(2).max(100), //
  address: z.string().optional(),
  dob: z.coerce.date().optional(), // Coerce handles string "2000-01-01" -> Date
  recaptcha_token: z.string(),
});

export const updateUserSchema = z.object({
  full_name: z.string().min(2).max(100).optional(),
  address: z.string().optional(),
  dob: z.coerce.date().optional(),
  // Note: changing email usually requires a specific flow (re-verification), so often excluded here
});

export const loginSchema = z.object({
  email: z.email(),
  password: z.string(),
});

/**
 * 2. PRODUCT SCHEMAS
 * Matches
 */
export const createProductSchema = z.object({
  name: z.string().min(5).max(255), //
  category_id: idSchema,
  price_start: decimalSchema,
  price_step: decimalSchema,
  price_buy_now: decimalSchema.optional(),
  // start_date is optional because Service defaults it to NOW if missing
  start_date: z.coerce.date().optional(), 
  end_date: z.coerce.date(),
  is_auto_extend: z.coerce.boolean().optional().default(false),
  description: z.string().min(10, "Description too short"),
  allow_first_time_bidder: z.coerce.boolean().optional().default(true),
  // description/images are often handled in separate endpoints or separate fields in a multipart form
}).refine((data) => {
    // Logic: End date must be after start date (or now)
    const start = data.start_date || new Date();
    return data.end_date > start;
}, {
    message: "End date must be after start date",
    path: ["end_date"]
});

export const updateProductSchema = z.object({
  name: z.string().min(5).max(255).optional(),
  category_id: idSchema.optional(),
  price_start: decimalSchema.optional(),
  price_step: decimalSchema.optional(),
  price_buy_now: decimalSchema.optional(),
  end_date: z.coerce.date().optional(),
  is_auto_extend: z.boolean().optional(),
});

export const addDescriptionSchema = z.object({
  product_id: idSchema,
  content: z.string().min(10, "Description too short"), //
});

/**
 * 3. BIDDING SCHEMAS
 * Matches
 */
export const createBidSchema = z.object({
  // product_id is usually in params, but if in body:
  product_id: idSchema, 
  amount: decimalSchema, 
});

export const createAutoBidSchema = z.object({
  product_id: idSchema,
  max_price: decimalSchema,
});

export const updateAutoBidSchema = z.object({
  max_price: decimalSchema,
});

/**
 * 4. FEEDBACK SCHEMAS
 * Matches
 */
export const createFeedbackSchema = z.object({
  product_id: idSchema,
  to_user_id: idSchema, 
  rating: z.coerce.number().int().min(1).max(5), // 1-5 stars
  comment: z.string().optional(),
});

/**
 * 5. PRODUCT RECEIPT SCHEMAS
 * Matches
 */
export const createProductReceiptSchema = z.object({
  product_id: idSchema,
  paid_by_buyer: z.boolean().optional().default(false),
  confirmed_by_seller: z.boolean().optional().default(false),
  status: z.enum(["PENDING", "FINISHED", "CANCELLED"]).optional().default("PENDING"),
});

export const updateProductReceiptSchema = z.object({
  paid_by_buyer: z.boolean().optional(),
  confirmed_by_seller: z.boolean().optional(),
  status: z.enum(["PENDING", "FINISHED", "CANCELLED"]).optional(),
  paypal_order: z.string().max(255).optional(),
});

export const receiptIdSchema = z.object({
  id: idSchema,
});

/**
 * 6. CATEGORY SCHEMAS
 * Matches
 */
export const createCategorySchema = z.object({
  name: z.string().min(2).max(100),
  parent_id: idSchema.optional().nullable(), // Nullable for root categories
});

/**
 * 7. SUB-RESOURCE SCHEMAS 
 * (Images, Descriptions, Blocks, Upgrades)
 */
export const createProductImageSchema = z.object({
  // product_id usually in params
  image_url: z.url().max(500), //
  is_primary: z.boolean().optional(),
});

export const createProductDescriptionSchema = z.object({
  content: z.string().min(10, "Description too short"), //
});

export const createBlockBidderSchema = z.object({
  userIdToBlock: idSchema, // Input maps to 'user_id' in DB
  reason: z.string().max(255).optional(), //
});

export const createUpgradeRequestSchema = z.object({
  reason: z.string().min(10, "Please provide a valid reason"), //
});

export const upgradeRequestStatusSchema = z.object({
  status: z.enum(["APPROVED", "REJECTED"]), //
});

export const createCommentSchema = z.object({
  product_id: idSchema,
  content: z.string().min(1, "Content cannot be empty"), //
  parent_id: idSchema.optional(), // For replies
});

export const createMessageSchema = z.object({
  receiver_id: idSchema,
  content: z.string().min(1, "Message content cannot be empty"), //
});

export const createWatchlistSchema = z.object({
  product_id: idSchema,
});
