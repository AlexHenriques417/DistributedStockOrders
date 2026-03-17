import { User } from '../models/User';
import { CreateUserDTO } from '../dtos/UserDTO';
import amqp from 'amqplib';

export class UserService {
  async create(data: CreateUserDTO) {
    const user = await User.create(data as any);

    // Evento de Negócio: Usuário Criado
    await this.emitUserCreated(user);

    return user;
  }

  private async emitUserCreated(user: any) {
    const connection = await amqp.connect(process.env.RABBITMQ_URL || 'amqp://localhost');
    const channel = await connection.createChannel();
    await channel.assertExchange('user_events', 'topic', { durable: true });
    
    channel.publish('user_events', 'user.created', Buffer.from(JSON.stringify({
      id: user.id,
      email: user.email,
      name: user.name
    })));
  }
}