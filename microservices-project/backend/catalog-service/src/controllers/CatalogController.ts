import { Request, Response } from 'express';
import { CatalogService } from '../services/CatalogService';

const service = new CatalogService();

export const CatalogController = {
  // QUERY
  async getAll(req: Request, res: Response) {
    try {
      const products = await service.getAllProducts();
      return res.json(products);
    } catch (error) {
      return res.status(500).json({ error: 'Erro ao buscar produtos' });
    }
  },

  // QUERY
  async getById(req: Request, res: Response) {
    try {
      const product = await service.getProductById(req.params.id);
      if (!product) return res.status(404).json({ error: 'Produto não encontrado' });
      return res.json(product);
    } catch (error) {
      return res.status(500).json({ error: 'Erro ao buscar produto' });
    }
  },

  // COMMAND
  async create(req: Request, res: Response) {
    try {
      const { name, price, description } = req.body;
      if (!name || price === undefined) {
        return res.status(400).json({ error: 'Campos obrigatórios: name, price' });
      }
      const newProduct = await service.create({ name, price, description });
      return res.status(201).json(newProduct);
    } catch (error) {
      return res.status(400).json({ error: 'Erro ao criar produto' });
    }
  },

  // COMMAND
  async update(req: Request, res: Response) {
    try {
      const { name, price, description } = req.body;
      const product = await service.update(req.params.id, { name, price, description });
      if (!product) return res.status(404).json({ error: 'Produto não encontrado' });
      return res.json(product);
    } catch (error) {
      return res.status(400).json({ error: 'Erro ao atualizar produto' });
    }
  },

  // COMMAND
  async delete(req: Request, res: Response) {
    try {
      const deleted = await service.delete(req.params.id);
      if (!deleted) return res.status(404).json({ error: 'Produto não encontrado' });
      return res.status(204).send();
    } catch (error) {
      return res.status(500).json({ error: 'Erro ao deletar produto' });
    }
  }
};
