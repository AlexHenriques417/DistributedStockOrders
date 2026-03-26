import { Request, Response } from 'express';
import { OrderService } from '../services/OrderService';

const service = new OrderService();

export class OrderController {
  async index(req: Request, res: Response) {
    try {
      const orders = await service.findAll();
      return res.status(200).json(orders);
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }

  async store(req: Request, res: Response) {
    try {
      const order = await service.createOrder(req.body);
      return res.status(201).json(order);
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }

  async show(req: Request, res: Response) {
    try {
      const order = await service.findById(req.params.id);
      if (!order) return res.status(404).json({ error: 'Pedido não encontrado' });
      return res.status(200).json(order);
    } catch (error: any) {
      return res.status(500).json({ error: 'Erro interno ao buscar pedido' });
    }
  }

  async updateStatus(req: Request, res: Response) {
    try {
      const order = await service.updateStatus(req.params.id, req.body.status);
      if (!order) return res.status(404).json({ error: 'Pedido não encontrado' });
      return res.status(200).json(order);
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }
}