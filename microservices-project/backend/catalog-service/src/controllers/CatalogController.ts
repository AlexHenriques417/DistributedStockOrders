import { Request, Response } from 'express';
import { CatalogService } from '../services/CatalogService';
import { CatalogProducer } from '../producers/CatalogProducer';

const service = new CatalogService();
const producer = new CatalogProducer();

export class CatalogController {
  async list(req: Request, res: Response): Promise<Response> {
    const products = await service.getAllProducts();
    return res.json(products);
  }

  async store(req: Request, res: Response): Promise<Response> {
    const product = await service.create(req.body);
    
    // Notifica outros microsserviços via RabbitMQ
    await producer.emitProductCreated(product);
    
    return res.status(201).json(product);
  }
}