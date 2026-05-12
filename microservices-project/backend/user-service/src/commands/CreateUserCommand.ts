import { User } from '../models/User';
import { CreateUserDTO } from '../dtos/UserDTO';
import amqp from 'amqplib';

export class CreateUserCommand {
  async execute(data: CreateUserDTO): Promise<User> {
    const user = await User.create(data as any);
    await this.emitUserCreated(user);
    console.log(`[COMMAND] Usuário criado: ${user.id}`);
    return user;
  }

  private async emitUserCreated(user: any) {
    try {
      const connection = await amqp.connect(process.env.RABBITMQ_URL || 'amqp://localhost');
      const channel    = await connection.createChannel();
      await channel.assertExchange('user_events', 'topic', { durable: true });
      channel.publish('user_events', 'user.created', Buffer.from(
        JSON.stringify({ id: user.id, email: user.email, name: user.name })
      ));
      await channel.close();
      await connection.close();
    } catch (err) {
      console.warn('[WARN] Evento user.created não publicado:', err);
    }
  }
}
