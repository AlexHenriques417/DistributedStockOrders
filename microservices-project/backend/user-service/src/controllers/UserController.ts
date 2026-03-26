import { Request, Response } from 'express';
import { UserService } from '../services/UserService';

const service = new UserService();

export class UserController {
  async index(req: Request, res: Response) {
    try {
      const users = await service.findAll();
      return res.status(200).json(users);
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }

  async store(req: Request, res: Response) {
    try {
      const user = await service.create(req.body);
      return res.status(201).json(user);
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }

  async profile(req: Request, res: Response) {
    try {
      const user = await service.findById(req.params.id);
      if (!user) return res.status(404).json({ error: 'Usuário não encontrado' });
      return res.status(200).json(user);
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }

  async destroy(req: Request, res: Response) {
    try {
      const user = await service.findById(req.params.id);
      if (!user) return res.status(404).json({ error: 'Usuário não encontrado' });
      await service.delete(req.params.id);
      return res.status(204).send();
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }
}