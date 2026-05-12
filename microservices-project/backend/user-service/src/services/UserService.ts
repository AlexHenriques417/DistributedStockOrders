import { CreateUserCommand } from '../commands/CreateUserCommand';
import { GetUsersQuery } from '../queries/GetUsersQuery';
import { CreateUserDTO } from '../dtos/UserDTO';

export class UserService {
  private createUserCommand = new CreateUserCommand();
  private getUsersQuery     = new GetUsersQuery();

  // QUERIES
  async findAll() {
    return this.getUsersQuery.findAll();
  }

  async findById(id: string) {
    return this.getUsersQuery.findById(id);
  }

  // COMMANDS
  async create(data: CreateUserDTO) {
    return this.createUserCommand.execute(data);
  }

  async delete(id: string) {
    const { User } = await import('../models/User');
    const user = await User.findByPk(id);
    if (!user) throw new Error('Usuário não encontrado');
    await user.destroy();
  }
}
