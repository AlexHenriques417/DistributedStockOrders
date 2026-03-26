import { User } from '../models/User';
import { CreateUserDTO } from '../dtos/UserDTO';
import amqp from 'amqplib';

export class UserService {
  async findAll() {
    return await User.findAll({
      attributes: ['id', 'name', 'email', 'role', 'createdAt']
    });
  }

  async findById(id: string) {
    return await User.findByPk(id, {
      attributes: ['id', 'name', 'email', 'role', 'createdAt']
    });
  }

  async create(data: CreateUserDTO) {
    const user = await User.create(data as any);
    await this.emitUserCreated(user);
    return user;
  }

  async delete(id: string) {
    const user = await User.findByPk(id);
    if (!user) throw new Error('Usuário não encontrado');
    await user.destroy();
  }

  private async emitUserCreated(user: any) {
    try {
      const connection = await amqp.connect(process.env.RABBITMQ_URL || 'amqp://localhost');
      const channel = await connection.createChannel();
      await channel.assertExchange('user_events', 'topic', { durable: true });
      channel.publish(
        'user_events',
        'user.created',
        Buffer.from(JSON.stringify({ id: user.id, email: user.email, name: user.name }))
      );
      await channel.close();
      await connection.close();
    } catch (err) {
      console.warn('⚠️ RabbitMQ indisponível, evento não emitido:', err);
    }
  }
}