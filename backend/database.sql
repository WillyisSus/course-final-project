-- 1. Cấu hình môi trường và Extensions
-- Cần thiết cho việc tìm kiếm tiếng Việt không dấu (Full-text search)
CREATE EXTENSION IF NOT EXISTS "unaccent";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- Hỗ trợ tìm kiếm mờ (fuzzy search) nếu cần

-- 2. Định nghĩa các ENUM Types (Quản lý trạng thái code-level)
CREATE TYPE user_role AS ENUM ('ADMIN', 'SELLER', 'BIDDER');
CREATE TYPE product_status AS ENUM ('ACTIVE', 'SOLD', 'EXPIRED');
CREATE TYPE bid_status AS ENUM ('VALID', 'REJECTED', 'CANCELLED');
CREATE TYPE request_status AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- 3. Bảng Users (Người dùng)
CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    address TEXT,
    dob DATE,
    role user_role DEFAULT 'BIDDER',
    is_verified BOOLEAN DEFAULT FALSE,
    
    -- Các trường phục vụ Authentication & Security
    refresh_token TEXT,
    otp_code VARCHAR(10),
    otp_expiry TIMESTAMP WITH TIME ZONE,
    
    -- Trường đặc biệt cho Seller
    seller_exp_date TIMESTAMP WITH TIME ZONE, -- Hết hạn quyền seller thì quay về bidder
    
    -- Denormalization: Lưu sẵn điểm đánh giá để query nhanh (Rule > 80%)
    rating_score INT DEFAULT 0, -- Tổng điểm (+1 hoặc -1)
    rating_count INT DEFAULT 0, -- Tổng số lượt đánh giá
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Bảng Categories (Danh mục - Cấu trúc cây)
CREATE TABLE categories (
    category_id SERIAL PRIMARY KEY,
    parent_id INT REFERENCES categories(category_id) ON DELETE SET NULL, -- Null là danh mục cha
    name VARCHAR(100) NOT NULL,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Bảng Products (Sản phẩm - Trung tâm)
CREATE TABLE products (
    product_id SERIAL PRIMARY KEY,
    seller_id INT NOT NULL REFERENCES users(user_id),
    category_id INT NOT NULL REFERENCES categories(category_id),
    winner_id INT REFERENCES users(user_id), -- Cập nhật khi kết thúc
    
    name VARCHAR(255) NOT NULL,
    price_start DECIMAL(15, 2) NOT NULL,
    price_step DECIMAL(15, 2) NOT NULL,
    price_buy_now DECIMAL(15, 2), -- Nullable
    
    -- Giá hiện tại (Denormalization - để hiển thị nhanh không cần sum)
    price_current DECIMAL(15, 2), 
    
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE NOT NULL,
    
    is_auto_extend BOOLEAN DEFAULT TRUE, -- Tự động gia hạn
    status product_status DEFAULT 'ACTIVE',
    
    -- Cột vector phục vụ Full-text Search Tiếng Việt
    tsv tsvector,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. Bảng Product Descriptions (Mô tả sản phẩm - Append Only)
-- Nghiệp vụ: Người bán chỉ được bổ sung, không được sửa cũ.
CREATE TABLE product_descriptions (
    desc_id SERIAL PRIMARY KEY,
    product_id INT NOT NULL REFERENCES products(product_id) ON DELETE CASCADE,
    content TEXT NOT NULL, -- Cho phép HTML
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. Bảng Product Images (Hình ảnh)
CREATE TABLE product_images (
    image_id SERIAL PRIMARY KEY,
    product_id INT NOT NULL REFERENCES products(product_id) ON DELETE CASCADE,
    image_url VARCHAR(500) NOT NULL,
    is_primary BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 8. Bảng Bids (Lịch sử đấu giá)
CREATE TABLE bids (
    bid_id SERIAL PRIMARY KEY,
    product_id INT NOT NULL REFERENCES products(product_id) ON DELETE CASCADE,
    bidder_id INT NOT NULL REFERENCES users(user_id),
    amount DECIMAL(15, 2) NOT NULL,
    status bid_status DEFAULT 'VALID',
    time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraint: Một user không thể tự bid sản phẩm của mình (Code logic check thêm)
    CONSTRAINT check_bid_amount CHECK (amount > 0)
);

-- 9. Bảng Auto Bids (Đấu giá tự động)
CREATE TABLE auto_bids (
    auto_bid_id SERIAL PRIMARY KEY,
    product_id INT NOT NULL REFERENCES products(product_id) ON DELETE CASCADE,
    bidder_id INT NOT NULL REFERENCES users(user_id),
    max_price DECIMAL(15, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Một người chỉ có 1 auto-bid active cho 1 sản phẩm tại 1 thời điểm
    UNIQUE(product_id, bidder_id) 
);

-- 10. Bảng Blocked Bidders (Danh sách bị từ chối)
-- Nghiệp vụ: Seller từ chối Bidder ra giá
CREATE TABLE blocked_bidders (
    product_id INT NOT NULL REFERENCES products(product_id) ON DELETE CASCADE,
    user_id INT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    blocked_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    reason VARCHAR(255),
    
    PRIMARY KEY (product_id, user_id)
);

-- 11. Bảng Feedbacks (Đánh giá)
CREATE TABLE feedbacks (
    feedback_id SERIAL PRIMARY KEY,
    product_id INT NOT NULL REFERENCES products(product_id),
    from_user_id INT NOT NULL REFERENCES users(user_id),
    to_user_id INT NOT NULL REFERENCES users(user_id),
    rating INT NOT NULL CHECK (rating IN (1, -1)), -- Chỉ +1 hoặc -1
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 12. Bảng Watchlist (Danh sách yêu thích)
CREATE TABLE watchlists (
    user_id INT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    product_id INT NOT NULL REFERENCES products(product_id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, product_id)
);

-- 13. Bảng Upgrade Requests (Yêu cầu nâng cấp Bidder -> Seller)
CREATE TABLE upgrade_requests (
    request_id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    reason TEXT,
    status request_status DEFAULT 'PENDING',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- INDEXING & FULL-TEXT SEARCH SETUP
-- =============================================

-- Index cho các khóa ngoại thường dùng để join
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_seller ON products(seller_id);
CREATE INDEX idx_bids_product ON bids(product_id);
CREATE INDEX idx_bids_bidder ON bids(bidder_id);

-- Trigger tự động cập nhật vector tìm kiếm khi tên sản phẩm thay đổi
-- Sử dụng hàm unaccent để loại bỏ dấu tiếng Việt trước khi index
CREATE OR REPLACE FUNCTION products_tsv_trigger() RETURNS trigger AS $$
BEGIN
  NEW.tsv := to_tsvector('simple', unaccent(NEW.name));
  RETURN NEW;
END
$$ LANGUAGE plpgsql;

CREATE TRIGGER tsvectorupdate BEFORE INSERT OR UPDATE
ON products FOR EACH ROW EXECUTE PROCEDURE products_tsv_trigger();

-- Index GIN cho Full-text search (Tìm kiếm siêu nhanh)
CREATE INDEX idx_products_tsv ON products USING GIN(tsv);

-- Index cho sorting (Sắp xếp theo giá, ngày kết thúc)
CREATE INDEX idx_products_end_date ON products(end_date);
CREATE INDEX idx_products_price ON products(price_current);