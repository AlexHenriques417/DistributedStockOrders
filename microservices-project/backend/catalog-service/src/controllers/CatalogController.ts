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
    try {
      const { name, price, description } = req.body;

      if (!name || price === undefined) {
        return res.status(400).json({ error: "Dados inválidos" });
      }

      const newProduct = await Product.create({ name, price, description });

      return res.status(201).json(newProduct);

    } catch (error) {
      return res.status(400).json({ error: "Erro ao criar produto" });
    }
  },

  // PUT - Atualizar
  async update(req: Request, res: Response) {
    const { id } = req.params;
    const { name, price, description } = req.body;

    if (!name || price === undefined) {
      return res.status(400).json({ error: "Dados inválidos" });
    }

    const product = await Product.findByPk(id);
    if (!product) {
      return res.status(404).json({ message: "Produto não encontrado" });
    }

    await Product.update({ name, price, description }, { where: { id } });
    res.json({ message: 'Produto atualizado com sucesso' });
  },

  // DELETE - Remover
  async delete(req: Request, res: Response) {
    const { id } = req.params;

    const deleted = await Product.destroy({ where: { id } });
    if (deleted === 0) {
      return res.status(404).json({ message: "Produto não encontrado" });
    } 
    
    res.status(204).send();
  }
};