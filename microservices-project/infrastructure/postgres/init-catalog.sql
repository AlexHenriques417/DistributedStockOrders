-- Catalog Service Database Initialization
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create schemas
CREATE SCHEMA IF NOT EXISTS catalog_service;

-- Set default schema
SET search_path TO catalog_service;

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    parent_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    image_url TEXT,
    icon VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    meta_title VARCHAR(255),
    meta_description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Products table
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sku VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    short_description VARCHAR(500),
    category_id UUID NOT NULL REFERENCES categories(id),
    brand VARCHAR(100),
    model VARCHAR(100),
    price DECIMAL(10, 2) NOT NULL,
    sale_price DECIMAL(10, 2),
    cost_price DECIMAL(10, 2),
    currency VARCHAR(10) DEFAULT 'BRL',
    quantity INTEGER DEFAULT 0,
    min_quantity INTEGER DEFAULT 1,
    max_quantity INTEGER,
    weight DECIMAL(10, 3),
    dimensions JSONB,
    is_active BOOLEAN DEFAULT true,
    is_featured BOOLEAN DEFAULT false,
    is_new BOOLEAN DEFAULT false,
    is_sale BOOLEAN DEFAULT false,
    tags TEXT[],
    meta_title VARCHAR(255),
    meta_description TEXT,
    rating DECIMAL(3, 2) DEFAULT 0,
    reviews_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Product images
CREATE TABLE IF NOT EXISTS product_images (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    alt_text VARCHAR(255),
    sort_order INTEGER DEFAULT 0,
    is_primary BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Product variants (sizes, colors, etc.)
CREATE TABLE IF NOT EXISTS product_variants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    sku VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    attributes JSONB NOT NULL,
    price_adjustment DECIMAL(10, 2) DEFAULT 0,
    quantity INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Product attributes (custom fields)
CREATE TABLE IF NOT EXISTS product_attributes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    attribute_name VARCHAR(100) NOT NULL,
    attribute_value TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Product reviews
CREATE TABLE IF NOT EXISTS product_reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    title VARCHAR(255),
    comment TEXT,
    is_verified_purchase BOOLEAN DEFAULT false,
    is_approved BOOLEAN DEFAULT false,
    helpful_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Product favorites/wishlist
CREATE TABLE IF NOT EXISTS product_favorites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(product_id, user_id)
);

-- Categories tree path (for hierarchical queries)
CREATE TABLE IF NOT EXISTS category_tree (
    ancestor_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    descendant_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    depth INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (ancestor_id, descendant_id)
);

-- Indexes
CREATE INDEX idx_categories_slug ON catalog_service.categories(slug);
CREATE INDEX idx_categories_parent_id ON catalog_service.categories(parent_id);
CREATE INDEX idx_products_sku ON catalog_service.products(sku);
CREATE INDEX idx_products_slug ON catalog_service.products(slug);
CREATE INDEX idx_products_category_id ON catalog_service.products(category_id);
CREATE INDEX idx_products_is_active ON catalog_service.products(is_active);
CREATE INDEX idx_products_is_featured ON catalog_service.products(is_featured);
CREATE INDEX idx_products_price ON catalog_service.products(price);
CREATE INDEX idx_product_images_product_id ON catalog_service.product_images(product_id);
CREATE INDEX idx_product_variants_product_id ON catalog_service.product_variants(product_id);
CREATE INDEX idx_product_variants_sku ON catalog_service.product_variants(sku);
CREATE INDEX idx_product_reviews_product_id ON catalog_service.product_reviews(product_id);
CREATE INDEX idx_product_reviews_user_id ON catalog_service.product_reviews(user_id);
CREATE INDEX idx_product_favorites_user_id ON catalog_service.product_favorites(user_id);

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_categories_updated_at
    BEFORE UPDATE ON catalog_service.categories
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at
    BEFORE UPDATE ON catalog_service.products
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_product_variants_updated_at
    BEFORE UPDATE ON catalog_service.product_variants
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert sample categories
INSERT INTO catalog_service.categories (name, slug, description, is_active) VALUES
('Eletrônicos', 'eletronicos', 'Produtos eletrônicos e tecnológicos', true),
('Roupas', 'roupas', 'Moda e vestuário', true),
('Casa e Jardim', 'casa-jardim', 'Produtos para casa e jardim', true)
ON CONFLICT (slug) DO NOTHING;

-- Insert sample products
INSERT INTO catalog_service.products (sku, name, slug, description, category_id, brand, price, quantity, is_active)
SELECT
    'SMARTPHONE-001',
    'Smartphone Premium',
    'smartphone-premium',
    'Smartphone de última geração com todos os recursos',
    id,
    'TechBrand',
    2999.90,
    50,
    true
FROM catalog_service.categories WHERE slug = 'eletronicos'
ON CONFLICT (sku) DO NOTHING;

-- Grant permissions
GRANT ALL PRIVILEGES ON SCHEMA catalog_service TO catalog_admin;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA catalog_service TO catalog_admin;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA catalog_service TO catalog_admin;
