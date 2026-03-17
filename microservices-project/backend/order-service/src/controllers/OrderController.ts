import { Request, Response } from 'express';
import { OrderService } from '../services/OrderService';
import { Order } from '../models/Order';

const service = new OrderService();

export class OrderController {
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
      // Ajuste aqui: Extraia o id e garanta que ele é tratado como string
      const orderId = req.params.id as string; 

      if (!orderId) {
        return res.status(400).json({ error: 'ID não fornecido' });
      }

      // Use a variável orderId aqui para evitar conflito de nomes
      const order = await Order.findByPk(orderId);
      
      if (!order) {
        return res.status(404).json({ error: 'Pedido não encontrado' });
      }

      return res.json(order);
    } catch (error: any) {
      return res.status(500).json({ error: 'Erro interno ao buscar pedido' });
    }
  }
}