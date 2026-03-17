import { Request, Response } from 'express';
import { UserService } from '../services/UserService';

const service = new UserService();

export class UserController {
  async store(req: Request, res: Response) {
    try {
      const user = await service.create(req.body);
      return res.status(201).json(user);
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }

  async profile(req: Request, res: Response) {
    // Simulação de busca de perfil
    return res.json({ message: "User profile data" });
  }
}