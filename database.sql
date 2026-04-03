-- Create database
CREATE DATABASE mama_mboga;

\c mama_mboga;

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    phone VARCHAR(20) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'customer',
    avatar_url TEXT,
    is_active BOOLEAN DEFAULT true,
    email_verified BOOLEAN DEFAULT false,
    verification_token TEXT,
    reset_password_token TEXT,
    reset_password_expires TIMESTAMP,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Products table
CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    category VARCHAR(100),
    image_url TEXT,
    stock INT DEFAULT 0,
    featured BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    order_number VARCHAR(50) UNIQUE NOT NULL,
    user_id INT REFERENCES users(id) ON DELETE SET NULL,
    customer_name VARCHAR(100),
    customer_email VARCHAR(100),
    customer_phone VARCHAR(20),
    subtotal DECIMAL(10,2) NOT NULL,
    delivery_fee DECIMAL(10,2) DEFAULT 0,
    total_amount DECIMAL(10,2) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    payment_status VARCHAR(50) DEFAULT 'pending',
    delivery_type VARCHAR(20) DEFAULT 'delivery',
    delivery_address TEXT,
    delivery_instructions TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Order items table
CREATE TABLE IF NOT EXISTS order_items (
    id SERIAL PRIMARY KEY,
    order_id INT REFERENCES orders(id) ON DELETE CASCADE,
    product_id INT REFERENCES products(id) ON DELETE SET NULL,
    quantity INT NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    product_name VARCHAR(200),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Payments table
CREATE TABLE IF NOT EXISTS payments (
    id SERIAL PRIMARY KEY,
    order_id INT REFERENCES orders(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    payment_method VARCHAR(50) DEFAULT 'mpesa',
    transaction_id VARCHAR(100),
    mpesa_code VARCHAR(50),
    checkout_request_id VARCHAR(100),
    merchant_request_id VARCHAR(100),
    phone VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Feedback table
CREATE TABLE IF NOT EXISTS feedback (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    subject VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    category VARCHAR(50) DEFAULT 'feedback',
    status VARCHAR(50) DEFAULT 'pending',
    admin_reply TEXT,
    replied_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert sample products
INSERT INTO products (name, description, price, category, stock, featured) VALUES
('Fresh Sukuma Wiki', 'Fresh organic kale leaves, rich in vitamins', 50.00, 'Vegetables', 100, true),
('Ripe Tomatoes', 'Juicy ripe tomatoes, perfect for cooking', 80.00, 'Vegetables', 150, true),
('Red Onions', 'Freshly harvested red onions', 60.00, 'Vegetables', 120, false),
('Irish Potatoes', 'High-quality Irish potatoes, 1kg pack', 100.00, 'Vegetables', 200, true),
('Maize Flour', 'Premium quality maize flour, 2kg', 120.00, 'Cereals', 50, true),
('Long Grain Rice', 'Aromatic long grain rice, 1kg', 150.00, 'Cereals', 40, true),
('Fresh Cabbage', 'Crisp fresh cabbage', 45.00, 'Vegetables', 80, false),
('Dried Beans', 'Premium quality beans, 1kg', 180.00, 'Cereals', 60, false),
('Cooking Oil', '1L sunflower cooking oil', 250.00, 'Pantry', 30, true),
('Garlic', 'Fresh garlic bulbs', 30.00, 'Vegetables', 90, false),
('Ginger', 'Fresh ginger root', 40.00, 'Vegetables', 85, false),
('Carrots', 'Fresh carrots, 500g pack', 60.00, 'Vegetables', 110, true);

-- Insert admin user (password: admin123)
INSERT INTO users (name, email, phone, password, role, email_verified) VALUES (
    'Admin User',
    'admin@mamamboga.com',
    '0700000000',
    '$2a$10$N9qo8uLOickgx2ZqZoq.Mu.8GqPqPqPqPqPqPqPqPqPqPqPqPq',
    'admin',
    true
);

-- Create indexes
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_featured ON products(featured);
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_feedback_user_id ON feedback(user_id);
CREATE INDEX idx_feedback_status ON feedback(status);