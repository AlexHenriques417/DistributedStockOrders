import { Request, Response } from 'express';
import { Product } from '../models/Product'; // Verifique se o nome do seu Model é Product

export const CatalogController = {
  // GET - Listar todos
  async getAll(req: Request, res: Response) {
    const products = await Product.findAll();
    res.json(products);
  },

  // POST - Criar novo
  async create(req: Request, res: Response) {
    const { name, price, description } = req.body;
    const newProduct = await Product.create({ name, price, description });
    res.status(201).json(newProduct);
  },

  // PUT - Atualizar
  async update(req: Request, res: Response) {
    const { id } = req.params;
    const { name, price, description } = req.body;
    await Product.update({ name, price, description }, { where: { id } });
    res.json({ message: 'Produto atualizado com sucesso' });
  },

  // DELETE - Remover
  async delete(req: Request, res: Response) {
    const { id } = req.params;
    await Product.destroy({ where: { id } });
    res.status(204).send();
  }
};