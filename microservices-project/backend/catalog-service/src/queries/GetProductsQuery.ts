import { Product } from '../models/Product';
import { ProductCacheService } from '../cache/ProductCacheService';

export class GetProductsQuery {
  private cache = new ProductCacheService();

  // Corrigido: Retorna uma lista de produtos -> Promise<Product[]>
  async findAll(): Promise<Product[]> {
    const cached = await this.cache.getAllProducts();
    if (cached) return cached;

    const products = await Product.findAll();
    await this.cache.setAllProducts(products.map(p => p.toJSON()));
    return products;
  }

  // Corrigido: Retorna um produto ou null se não encontrar -> Promise<Product | null>
  async findById(id: string): Promise<Product | null> {
    const cached = await this.cache.getProduct(id);
    if (cached) return cached;

    const product = await Product.findByPk(id);
    if (!product) return null;

    await this.cache.setProduct(product.toJSON());
    return product;
  }
}