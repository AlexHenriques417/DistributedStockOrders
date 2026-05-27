-- Payment Service Database Initialization
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create schemas
CREATE SCHEMA IF NOT EXISTS payment_service;

-- Set default schema
SET search_path TO payment_service;

-- Payments table
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    payment_number VARCHAR(100) UNIQUE NOT NULL,
    order_id UUID NOT NULL,
    user_id UUID NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'BRL',
    status VARCHAR(50) DEFAULT 'pending',
    payment_method VARCHAR(100) NOT NULL,
    payment_provider VARCHAR(100),
    provider_payment_id VARCHAR(255),
    provider_response JSONB,
    installments INTEGER DEFAULT 1,
    card_last_four VARCHAR(4),
    card_brand VARCHAR(50),
    billing_address JSONB,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    cancelled_at TIMESTAMP WITH TIME ZONE,
    refunded_at TIMESTAMP WITH TIME ZONE,
    failure_reason TEXT
);

-- Payment transactions (log all payment activities)
CREATE TABLE IF NOT EXISTS payment_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    payment_id UUID NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
    transaction_type VARCHAR(50) NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'BRL',
    status VARCHAR(50) NOT NULL,
    provider_transaction_id VARCHAR(255),
    provider_response JSONB,
    error_message TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Refunds
CREATE TABLE IF NOT EXISTS refunds (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    refund_number VARCHAR(100) UNIQUE NOT NULL,
    payment_id UUID NOT NULL REFERENCES payments(id),
    order_id UUID NOT NULL,
    user_id UUID NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'BRL',
    status VARCHAR(50) DEFAULT 'pending',
    reason TEXT NOT NULL,
    provider_refund_id VARCHAR(255),
    provider_response JSONB,
    processed_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed_at TIMESTAMP WITH TIME ZONE
);

-- Payment methods (saved cards/methods for users)
CREATE TABLE IF NOT EXISTS user_payment_methods (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    payment_method VARCHAR(100) NOT NULL,
    provider VARCHAR(100),
    provider_token VARCHAR(255),
    card_last_four VARCHAR(4),
    card_brand VARCHAR(50),
    card_expiry_month INTEGER,
    card_expiry_year INTEGER,
    is_default BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    nickname VARCHAR(100),
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Payment webhooks (store incoming webhooks for audit)
CREATE TABLE IF NOT EXISTS payment_webhooks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    payment_id UUID REFERENCES payments(id) ON DELETE SET NULL,
    provider VARCHAR(100) NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    payload JSONB NOT NULL,
    signature VARCHAR(255),
    processed BOOLEAN DEFAULT false,
    processing_error TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed_at TIMESTAMP WITH TIME ZONE
);

-- Payment disputes/chargebacks
CREATE TABLE IF NOT EXISTS payment_disputes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    payment_id UUID NOT NULL REFERENCES payments(id),
    order_id UUID NOT NULL,
    dispute_number VARCHAR(100) UNIQUE NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'BRL',
    status VARCHAR(50) DEFAULT 'opened',
    reason TEXT NOT NULL,
    provider_dispute_id VARCHAR(255),
    evidence JSONB,
    resolution VARCHAR(100),
    resolved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Invoices/Payment receipts
CREATE TABLE IF NOT EXISTS invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_number VARCHAR(100) UNIQUE NOT NULL,
    payment_id UUID NOT NULL REFERENCES payments(id),
    order_id UUID NOT NULL,
    user_id UUID NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'BRL',
    status VARCHAR(50) DEFAULT 'issued',
    due_date TIMESTAMP WITH TIME ZONE,
    paid_at TIMESTAMP WITH TIME ZONE,
    pdf_url TEXT,
    items JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_payments_order_id ON payment_service.payments(order_id);
CREATE INDEX idx_payments_user_id ON payment_service.payments(user_id);
CREATE INDEX idx_payments_status ON payment_service.payments(status);
CREATE INDEX idx_payments_payment_number ON payment_service.payments(payment_number);
CREATE INDEX idx_payments_provider_payment_id ON payment_service.payments(provider_payment_id);
CREATE INDEX idx_payments_created_at ON payment_service.payments(created_at);
CREATE INDEX idx_payment_transactions_payment_id ON payment_service.payment_transactions(payment_id);
CREATE INDEX idx_payment_transactions_type ON payment_service.payment_transactions(transaction_type);
CREATE INDEX idx_refunds_payment_id ON payment_service.refunds(payment_id);
CREATE INDEX idx_refunds_order_id ON payment_service.refunds(order_id);
CREATE INDEX idx_refunds_status ON payment_service.refunds(status);
CREATE INDEX idx_user_payment_methods_user_id ON payment_service.user_payment_methods(user_id);
CREATE INDEX idx_payment_webhooks_payment_id ON payment_service.payment_webhooks(payment_id);
CREATE INDEX idx_payment_webhooks_processed ON payment_service.payment_webhooks(processed);
CREATE INDEX idx_payment_disputes_payment_id ON payment_service.payment_disputes(payment_id);
CREATE INDEX idx_invoices_payment_id ON payment_service.invoices(payment_id);
CREATE INDEX idx_invoices_user_id ON payment_service.invoices(user_id);

-- Triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_payments_updated_at
    BEFORE UPDATE ON payment_service.payments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_refunds_updated_at
    BEFORE UPDATE ON payment_service.refunds
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_payment_methods_updated_at
    BEFORE UPDATE ON payment_service.user_payment_methods
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payment_disputes_updated_at
    BEFORE UPDATE ON payment_service.payment_disputes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Grant permissions
GRANT ALL PRIVILEGES ON SCHEMA payment_service TO payment_admin;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA payment_service TO payment_admin;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA payment_service TO payment_admin;
