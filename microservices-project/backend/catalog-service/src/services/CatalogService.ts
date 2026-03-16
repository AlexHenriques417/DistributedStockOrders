import { Product } from '../models/Product';
import { CreateProductDTO } from '../dtos/ProductDTO';
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

export class CatalogService {
  async getAllProducts(): Promise<Product[]> {
    const CACHE_KEY = 'catalog:all_products';
    
    // Tentativa de leitura no Cache
    const cachedData = await redis.get(CACHE_KEY);
    if (cachedData) return JSON.parse(cachedData);

    // Busca no DB
    const products = await Product.findAll();
    
    // Salva no Cache por 10 minutos (600s)
    await redis.setex(CACHE_KEY, 600, JSON.stringify(products));
    
    return products;
  }

  async create(data: CreateProductDTO): Promise<Product> {
    const product = await Product.create(data as any);
    await redis.del('catalog:all_products'); // Invalida o cache
    return product;
  }
}