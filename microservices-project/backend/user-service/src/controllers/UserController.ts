import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { UserService } from '../services/UserService';

const service = new UserService();
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretjwtkey';

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
      return res.status(201).json({ id: user.id, name: user.name, email: user.email });
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }

  async register(req: Request, res: Response) {
    try {
      const user = await service.create(req.body);
      return res.status(201).json({ id: user.id, name: user.name, email: user.email });
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }

  async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;
      const user = await service.authenticate(email, password);
      const token = jwt.sign({ sub: user.id, email: user.email }, JWT_SECRET, {
        expiresIn: '8h'
      });
      return res.status(200).json({ token, userId: user.id, email: user.email });
    } catch (error: any) {
      return res.status(400).json({ message: error.message });
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