-- Start the transaction
BEGIN;

-- ==========================================
-- 1. CLEANUP (Drop existing tables)
-- ==========================================
-- We drop child tables first to avoid Foreign Key constraint errors
DROP TABLE IF EXISTS order_items;
DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS users;


-- ==========================================
-- 2. SCHEMA DEFINITION
-- ==========================================

-- Table: Users
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table: Orders
CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    total_amount DECIMAL(10, 2) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending', -- e.g., pending, shipped, delivered, cancelled
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_user
        FOREIGN KEY(user_id) 
        REFERENCES users(id)
        ON DELETE CASCADE
);

-- Table: Order Items
CREATE TABLE order_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER NOT NULL,
    product_name VARCHAR(150) NOT NULL,
    quantity INTEGER DEFAULT 1,
    price DECIMAL(10, 2) NOT NULL,
    
    CONSTRAINT fk_order
        FOREIGN KEY(order_id) 
        REFERENCES orders(id)
        ON DELETE CASCADE
);


-- ==========================================
-- 3. DATA SEEDING
-- ==========================================

-- Users
INSERT INTO users (name, email) VALUES 
('Alice Johnson', 'alice@example.com'), -- ID: 1
('Bob Smith', 'bob@example.com'),       -- ID: 2
('Charlie Brown', 'charlie@example.com'); -- ID: 3

-- Orders
-- Alice (ID 1) has two orders
INSERT INTO orders (user_id, total_amount, status) VALUES 
(1, 1200.00, 'shipped'),   -- Order ID: 1
(1, 55.00, 'pending');     -- Order ID: 2

-- Bob (ID 2) has one order
INSERT INTO orders (user_id, total_amount, status) VALUES 
(2, 300.00, 'delivered');  -- Order ID: 3

-- Order Items
-- Items for Order ID 1 (Alice's big order)
INSERT INTO order_items (order_id, product_name, quantity, price) VALUES 
(1, 'Laptop', 1, 1000.00),
(1, 'Mouse', 1, 50.00),
(1, 'Mechanical Keyboard', 1, 150.00);

-- Items for Order ID 2 (Alice's small order)
INSERT INTO order_items (order_id, product_name, quantity, price) VALUES 
(2, 'HDMI Cable', 2, 15.00),
(2, 'USB Hub', 1, 25.00);

-- Items for Order ID 3 (Bob's order)
INSERT INTO order_items (order_id, product_name, quantity, price) VALUES 
(3, '27-inch Monitor', 1, 300.00);

-- 1. Create the Users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL, -- Store the HASHED password here, never plain text
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Create the Refresh Tokens table
CREATE TABLE IF NOT EXISTS refresh_tokens (
    id SERIAL PRIMARY KEY,
    token TEXT NOT NULL,
    user_id INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Create a relationship between this table and the users table
    CONSTRAINT fk_user
        FOREIGN KEY(user_id) 
        REFERENCES users(id)
        ON DELETE CASCADE -- If a user is deleted, delete their tokens automatically
);

-- 1. Thêm 2 người dùng mẫu vào bảng 'users'
-- Lưu ý: Trong thực tế, trường password phải là chuỗi đã được mã hóa bằng Bcrypt (ví dụ: $2b$10$...)
INSERT INTO users (username, password)
VALUES 
    ('dev_nguyen', 'hashed_password_secret_123'),
    ('design_lan', 'hashed_password_secret_456');

-- 2. Thêm Refresh Token mẫu cho các người dùng này
-- Giả sử 'dev_nguyen' có ID là 1 và 'design_lan' có ID là 2 (do tính năng tự tăng SERIAL)
INSERT INTO refresh_tokens (user_id, token)
VALUES 
    (1, 'sample_refresh_token_user_1_xyz789'),
    (2, 'sample_refresh_token_user_2_abc123');

-- Commit the transaction
COMMIT;