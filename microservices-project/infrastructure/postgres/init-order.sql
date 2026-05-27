-- Order Service Database Initialization
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create schemas
CREATE SCHEMA IF NOT EXISTS order_service;

-- Set default schema
SET search_path TO order_service;

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_number VARCHAR(100) UNIQUE NOT NULL,
    user_id UUID NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    subtotal DECIMAL(10, 2) NOT NULL,
    tax_amount DECIMAL(10, 2) DEFAULT 0,
    shipping_amount DECIMAL(10, 2) DEFAULT 0,
    discount_amount DECIMAL(10, 2) DEFAULT 0,
    total_amount DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'BRL',
    coupon_code VARCHAR(50),
    notes TEXT,
    billing_address JSONB NOT NULL,
    shipping_address JSONB NOT NULL,
    shipping_method VARCHAR(100),
    payment_method VARCHAR(100),
    payment_id UUID,
    customer_notes TEXT,
    internal_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    confirmed_at TIMESTAMP WITH TIME ZONE,
    shipped_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    cancelled_at TIMESTAMP WITH TIME ZONE,
    cancellation_reason TEXT
);

-- Order items
CREATE TABLE IF NOT EXISTS order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID NOT NULL,
    product_name VARCHAR(255) NOT NULL,
    product_sku VARCHAR(100) NOT NULL,
    variant_id UUID,
    variant_info JSONB,
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(10, 2) NOT NULL,
    total_price DECIMAL(10, 2) NOT NULL,
    discount_amount DECIMAL(10, 2) DEFAULT 0,
    tax_amount DECIMAL(10, 2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Order status history (audit trail)
CREATE TABLE IF NOT EXISTS order_status_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    from_status VARCHAR(50),
    to_status VARCHAR(50) NOT NULL,
    reason TEXT,
    performed_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Shopping cart
CREATE TABLE IF NOT EXISTS shopping_carts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID,
    session_id VARCHAR(255),
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    converted_to_order_id UUID REFERENCES orders(id)
);

-- Cart items
CREATE TABLE IF NOT EXISTS cart_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cart_id UUID NOT NULL REFERENCES shopping_carts(id) ON DELETE CASCADE,
    product_id UUID NOT NULL,
    product_name VARCHAR(255) NOT NULL,
    product_sku VARCHAR(100) NOT NULL,
    variant_id UUID,
    variant_info JSONB,
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Order saga state (for distributed transactions)
CREATE TABLE IF NOT EXISTS order_saga_state (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    current_step VARCHAR(100) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    compensating_transactions JSONB DEFAULT '[]',
    completed_steps JSONB DEFAULT '[]',
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Order returns
CREATE TABLE IF NOT EXISTS order_returns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    return_number VARCHAR(100) UNIQUE NOT NULL,
    order_id UUID NOT NULL REFERENCES orders(id),
    user_id UUID NOT NULL,
    status VARCHAR(50) DEFAULT 'requested',
    refund_amount DECIMAL(10, 2),
    reason TEXT NOT NULL,
    items JSONB NOT NULL,
    approved_by UUID,
    approved_at TIMESTAMP WITH TIME ZONE,
    processed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Coupons/Promotions
CREATE TABLE IF NOT EXISTS coupons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    discount_type VARCHAR(50) NOT NULL,
    discount_value DECIMAL(10, 2) NOT NULL,
    min_purchase_amount DECIMAL(10, 2) DEFAULT 0,
    max_discount_amount DECIMAL(10, 2),
    usage_limit INTEGER,
    usage_count INTEGER DEFAULT 0,
    per_user_limit INTEGER DEFAULT 1,
    valid_from TIMESTAMP WITH TIME ZONE NOT NULL,
    valid_until TIMESTAMP WITH TIME ZONE NOT NULL,
    is_active BOOLEAN DEFAULT true,
    applicable_categories UUID[],
    excluded_products UUID[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_orders_user_id ON order_service.orders(user_id);
CREATE INDEX idx_orders_status ON order_service.orders(status);
CREATE INDEX idx_orders_order_number ON order_service.orders(order_number);
CREATE INDEX idx_orders_created_at ON order_service.orders(created_at);
CREATE INDEX idx_order_items_order_id ON order_service.order_items(order_id);
CREATE INDEX idx_order_items_product_id ON order_service.order_items(product_id);
CREATE INDEX idx_order_status_history_order_id ON order_service.order_status_history(order_id);
CREATE INDEX idx_shopping_carts_user_id ON order_service.shopping_carts(user_id);
CREATE INDEX idx_shopping_carts_session_id ON order_service.shopping_carts(session_id);
CREATE INDEX idx_shopping_carts_status ON order_service.shopping_carts(status);
CREATE INDEX idx_cart_items_cart_id ON order_service.cart_items(cart_id);
CREATE INDEX idx_order_saga_state_order_id ON order_service.order_saga_state(order_id);
CREATE INDEX idx_order_returns_order_id ON order_service.order_returns(order_id);
CREATE INDEX idx_coupons_code ON order_service.coupons(code);
CREATE INDEX idx_coupons_is_active ON order_service.coupons(is_active);

-- Triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_orders_updated_at
    BEFORE UPDATE ON order_service.orders
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_shopping_carts_updated_at
    BEFORE UPDATE ON order_service.shopping_carts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cart_items_updated_at
    BEFORE UPDATE ON order_service.cart_items
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_order_saga_state_updated_at
    BEFORE UPDATE ON order_service.order_saga_state
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_order_returns_updated_at
    BEFORE UPDATE ON order_service.order_returns
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert sample coupon
INSERT INTO order_service.coupons (code, description, discount_type, discount_value, min_purchase_amount, valid_from, valid_until)
VALUES (
    'WELCOME10',
    '10% de desconto na primeira compra',
    'percentage',
    10.00,
    100.00,
    NOW(),
    NOW() + INTERVAL '1 year'
) ON CONFLICT (code) DO NOTHING;

-- Grant permissions
GRANT ALL PRIVILEGES ON SCHEMA order_service TO order_admin;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA order_service TO order_admin;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA order_service TO order_admin;
