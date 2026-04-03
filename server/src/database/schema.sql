-- Create database
CREATE DATABASE IF NOT EXISTS mama_mboga;

-- Use the database
\c mama_mboga;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    uuid UUID DEFAULT uuid_generate_v4() UNIQUE,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    phone VARCHAR(15) NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'customer' CHECK (role IN ('customer', 'admin', 'driver')),
    avatar_url TEXT,
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Products table
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL,
    subcategory VARCHAR(50),
    price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
    cost_price DECIMAL(10,2),
    stock INT NOT NULL DEFAULT 0 CHECK (stock >= 0),
    unit VARCHAR(20) DEFAULT 'kg',
    image_url TEXT,
    description TEXT,
    is_available BOOLEAN DEFAULT true,
    featured BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for products
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_price ON products(price);
CREATE INDEX idx_products_featured ON products(featured);

-- Orders table
CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    order_number VARCHAR(20) UNIQUE NOT NULL,
    user_id INT REFERENCES users(id) ON DELETE SET NULL,
    total_amount DECIMAL(10,2) NOT NULL CHECK (total_amount >= 0),
    subtotal DECIMAL(10,2) NOT NULL,
    delivery_fee DECIMAL(10,2) DEFAULT 0,
    tax DECIMAL(10,2) DEFAULT 0,
    discount DECIMAL(10,2) DEFAULT 0,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded')),
    payment_status VARCHAR(50) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
    delivery_type VARCHAR(20) DEFAULT 'pickup' CHECK (delivery_type IN ('pickup', 'delivery')),
    delivery_address TEXT,
    delivery_instructions TEXT,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for orders
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX idx_orders_order_number ON orders(order_number);

-- Order items table
CREATE TABLE order_items (
    id SERIAL PRIMARY KEY,
    order_id INT REFERENCES orders(id) ON DELETE CASCADE,
    product_id INT REFERENCES products(id) ON DELETE SET NULL,
    quantity INT NOT NULL CHECK (quantity > 0),
    price DECIMAL(10,2) NOT NULL,
    total DECIMAL(10,2) GENERATED ALWAYS AS (quantity * price) STORED,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Payments table
CREATE TABLE payments (
    id SERIAL PRIMARY KEY,
    order_id INT REFERENCES orders(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    mpesa_code VARCHAR(50) UNIQUE,
    transaction_id VARCHAR(100),
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
    payment_method VARCHAR(50) DEFAULT 'mpesa' CHECK (payment_method IN ('mpesa', 'cash', 'card')),
    checkout_request_id VARCHAR(100),
    merchant_request_id VARCHAR(100),
    result_code INT,
    result_desc TEXT,
    transaction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for payments
CREATE INDEX idx_payments_order_id ON payments(order_id);
CREATE INDEX idx_payments_mpesa_code ON payments(mpesa_code);

-- Deliveries table
CREATE TABLE deliveries (
    id SERIAL PRIMARY KEY,
    order_id INT REFERENCES orders(id) ON DELETE CASCADE,
    driver_id INT REFERENCES users(id) ON DELETE SET NULL,
    driver_name VARCHAR(100),
    driver_phone VARCHAR(15),
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'assigned', 'picked_up', 'in_transit', 'delivered', 'failed')),
    tracking_number VARCHAR(100),
    estimated_arrival TIMESTAMP,
    actual_delivery TIMESTAMP,
    current_location JSONB,
    tracking_history JSONB[] DEFAULT ARRAY[]::JSONB[],
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for deliveries
CREATE INDEX idx_deliveries_order_id ON deliveries(order_id);
CREATE INDEX idx_deliveries_driver_id ON deliveries(driver_id);
CREATE INDEX idx_deliveries_status ON deliveries(status);

-- Reviews table
CREATE TABLE reviews (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    product_id INT REFERENCES products(id) ON DELETE CASCADE,
    order_id INT REFERENCES orders(id) ON DELETE SET NULL,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, product_id, order_id)
);

-- Create indexes for reviews
CREATE INDEX idx_reviews_product_id ON reviews(product_id);
CREATE INDEX idx_reviews_user_id ON reviews(user_id);

-- Cart table (for guest users)
CREATE TABLE carts (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    session_id VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Cart items table
CREATE TABLE cart_items (
    id SERIAL PRIMARY KEY,
    cart_id INT REFERENCES carts(id) ON DELETE CASCADE,
    product_id INT REFERENCES products(id) ON DELETE CASCADE,
    quantity INT NOT NULL CHECK (quantity > 0),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Notifications table
CREATE TABLE notifications (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(100) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'info',
    is_read BOOLEAN DEFAULT false,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for notifications
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_deliveries_updated_at BEFORE UPDATE ON deliveries FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_carts_updated_at BEFORE UPDATE ON carts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default admin user (password: admin123)
INSERT INTO users (name, email, phone, password, role) VALUES 
('Admin User', 'admin@mamamboga.com', '0700000000', '$2a$10$rQeHwFhKJgZ8xV9YwQvx6eGQhFzPzVhJmQnLkPwYtUzXcVbNmAaK', 'admin');

-- Insert sample products
INSERT INTO products (name, category, subcategory, price, stock, description, featured) VALUES
('Fresh Sukuma Wiki', 'Vegetables', 'Leafy Greens', 50.00, 100, 'Organic kale leaves, harvested fresh daily. Rich in iron and vitamins.', true),
('Ripe Tomatoes', 'Vegetables', 'Fruits', 80.00, 150, 'Juicy, ripe tomatoes perfect for cooking or salads.', true),
('Red Onions', 'Vegetables', 'Bulbs', 60.00, 120, 'Freshly harvested red onions with strong flavor.', false),
('Irish Potatoes', 'Vegetables', 'Roots', 100.00, 200, 'High-quality potatoes, perfect for chips or stews.', true),
('Fresh Cabbage', 'Vegetables', 'Leafy Greens', 45.00, 80, 'Crisp and fresh cabbage, great for salads and cooking.', false),
('Maize Flour', 'Cereals', 'Flours', 120.00, 50, 'Premium quality maize flour, 2kg packet.', true),
('Long Grain Rice', 'Cereals', 'Grains', 150.00, 40, 'Aromatic long grain rice, 1kg.', true),
('Dried Beans', 'Cereals', 'Legumes', 180.00, 60, 'Premium quality beans, 1kg.', false),
('Green Peas', 'Vegetables', 'Legumes', 90.00, 70, 'Fresh green peas, perfect for rice dishes.', true),
('Carrots', 'Vegetables', 'Roots', 40.00, 100, 'Organic carrots, rich in vitamin A.', false),
('Spinach', 'Vegetables', 'Leafy Greens', 55.00, 90, 'Fresh spinach leaves, rich in iron.', true),
('Cooking Oil', 'Cereals', 'Oils', 250.00, 30, 'Pure vegetable cooking oil, 1L.', false),
('Wheat Flour', 'Cereals', 'Flours', 110.00, 45, 'High-quality wheat flour, 2kg.', false),
('Green Peppers', 'Vegetables', 'Fruits', 70.00, 85, 'Fresh green bell peppers.', false),
('Garlic', 'Vegetables', 'Bulbs', 30.00, 60, 'Fresh garlic bulbs, 100g.', false);

-- Insert sample reviews
INSERT INTO reviews (user_id, product_id, rating, comment) VALUES 
(1, 1, 5, 'Excellent quality, very fresh!'),
(1, 2, 4, 'Good tomatoes, but a bit expensive');

-- Create function to generate order number
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TRIGGER AS $$
DECLARE
    year_part VARCHAR;
    month_part VARCHAR;
    day_part VARCHAR;
    seq_part VARCHAR;
BEGIN
    year_part := TO_CHAR(NEW.created_at, 'YY');
    month_part := TO_CHAR(NEW.created_at, 'MM');
    day_part := TO_CHAR(NEW.created_at, 'DD');
    
    SELECT LPAD(COUNT(*)::TEXT, 6, '0') INTO seq_part
    FROM orders
    WHERE DATE(created_at) = DATE(NEW.created_at);
    
    NEW.order_number := 'MB' || year_part || month_part || day_part || seq_part;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for order number generation
CREATE TRIGGER generate_order_number_trigger
BEFORE INSERT ON orders
FOR EACH ROW
EXECUTE FUNCTION generate_order_number();