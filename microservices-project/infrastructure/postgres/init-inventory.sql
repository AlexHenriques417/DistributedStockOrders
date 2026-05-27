-- Inventory Service Database Initialization
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create schemas
CREATE SCHEMA IF NOT EXISTS inventory_service;

-- Set default schema
SET search_path TO inventory_service;

-- Inventory items (stock quantity per product)
CREATE TABLE IF NOT EXISTS inventory_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL UNIQUE,
    sku VARCHAR(100) NOT NULL UNIQUE,
    quantity INTEGER NOT NULL DEFAULT 0,
    reserved_quantity INTEGER DEFAULT 0,
    available_quantity INTEGER GENERATED ALWAYS AS (quantity - reserved_quantity) STORED,
    min_stock_level INTEGER DEFAULT 10,
    max_stock_level INTEGER DEFAULT 1000,
    reorder_point INTEGER DEFAULT 20,
    reorder_quantity INTEGER DEFAULT 100,
    status VARCHAR(50) DEFAULT 'available',
    warehouse_id UUID,
    location VARCHAR(100),
    last_restocked_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inventory transactions (log all stock movements)
CREATE TABLE IF NOT EXISTS inventory_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    inventory_item_id UUID NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
    transaction_type VARCHAR(50) NOT NULL,
    quantity INTEGER NOT NULL,
    previous_quantity INTEGER NOT NULL,
    new_quantity INTEGER NOT NULL,
    reference_type VARCHAR(100),
    reference_id UUID,
    notes TEXT,
    performed_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Stock reservations (holds stock for orders before confirmation)
CREATE TABLE IF NOT EXISTS stock_reservations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    inventory_item_id UUID NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
    order_id UUID NOT NULL,
    quantity INTEGER NOT NULL,
    status VARCHAR(50) DEFAULT 'reserved',
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    released_at TIMESTAMP WITH TIME ZONE,
    released_reason VARCHAR(255)
);

-- Warehouses
CREATE TABLE IF NOT EXISTS warehouses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    address JSONB NOT NULL,
    is_active BOOLEAN DEFAULT true,
    capacity INTEGER,
    current_utilization INTEGER DEFAULT 0,
    contact_email VARCHAR(255),
    contact_phone VARCHAR(50),
    operating_hours JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Purchase orders (to suppliers)
CREATE TABLE IF NOT EXISTS purchase_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    po_number VARCHAR(100) UNIQUE NOT NULL,
    supplier_id UUID NOT NULL,
    supplier_name VARCHAR(255),
    status VARCHAR(50) DEFAULT 'pending',
    total_amount DECIMAL(10, 2),
    expected_delivery_date TIMESTAMP WITH TIME ZONE,
    actual_delivery_date TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Purchase order items
CREATE TABLE IF NOT EXISTS purchase_order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    purchase_order_id UUID NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
    product_id UUID NOT NULL,
    sku VARCHAR(100) NOT NULL,
    quantity_ordered INTEGER NOT NULL,
    quantity_received INTEGER DEFAULT 0,
    unit_price DECIMAL(10, 2) NOT NULL,
    total_price DECIMAL(10, 2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Stock alerts
CREATE TABLE IF NOT EXISTS stock_alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    inventory_item_id UUID NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
    alert_type VARCHAR(50) NOT NULL,
    message TEXT,
    severity VARCHAR(20) DEFAULT 'warning',
    is_resolved BOOLEAN DEFAULT false,
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolved_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_inventory_items_product_id ON inventory_service.inventory_items(product_id);
CREATE INDEX idx_inventory_items_sku ON inventory_service.inventory_items(sku);
CREATE INDEX idx_inventory_items_status ON inventory_service.inventory_items(status);
CREATE INDEX idx_inventory_transactions_item_id ON inventory_service.inventory_transactions(inventory_item_id);
CREATE INDEX idx_inventory_transactions_type ON inventory_service.inventory_transactions(transaction_type);
CREATE INDEX idx_inventory_transactions_created_at ON inventory_service.inventory_transactions(created_at);
CREATE INDEX idx_stock_reservations_item_id ON inventory_service.stock_reservations(inventory_item_id);
CREATE INDEX idx_stock_reservations_order_id ON inventory_service.stock_reservations(order_id);
CREATE INDEX idx_stock_reservations_status ON inventory_service.stock_reservations(status);
CREATE INDEX idx_purchase_orders_status ON inventory_service.purchase_orders(status);
CREATE INDEX idx_stock_alerts_item_id ON inventory_service.stock_alerts(inventory_item_id);
CREATE INDEX idx_stock_alerts_resolved ON inventory_service.stock_alerts(is_resolved);

-- Triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_inventory_items_updated_at
    BEFORE UPDATE ON inventory_service.inventory_items
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_stock_reservations_updated_at
    BEFORE UPDATE ON inventory_service.stock_reservations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert default warehouse
INSERT INTO inventory_service.warehouses (name, code, address, is_active)
VALUES (
    'Warehouse Principal',
    'WH-001',
    '{"street": "Rua Principal", "number": "100", "city": "São Paulo", "state": "SP", "country": "Brasil", "postal_code": "01000-000"}',
    true
) ON CONFLICT (code) DO NOTHING;

-- Grant permissions
GRANT ALL PRIVILEGES ON SCHEMA inventory_service TO inventory_admin;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA inventory_service TO inventory_admin;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA inventory_service TO inventory_admin;
