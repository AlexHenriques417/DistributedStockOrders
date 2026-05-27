import { CreateUserCommand } from '../commands/CreateUserCommand';
import { GetUsersQuery } from '../queries/GetUsersQuery';
import { CreateUserDTO } from '../dtos/UserDTO';
import { User } from '../models/User';
import bcrypt from 'bcryptjs';

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

  async findByEmail(email: string) {
    return User.findOne({ where: { email } });
  }

  // COMMANDS
  async create(data: CreateUserDTO) {
    const hashedPassword = await bcrypt.hash(data.password, 10);
    return this.createUserCommand.execute({
      ...data,
      password: hashedPassword,
    });
  }

  async authenticate(email: string, password: string) {
    const user = await this.findByEmail(email);
    if (!user) throw new Error('Usuário ou senha inválidos');

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) throw new Error('Usuário ou senha inválidos');

    return user;
  }

  async delete(id: string) {
    const user = await User.findByPk(id);
    if (!user) throw new Error('Usuário não encontrado');
    await user.destroy();
  }
}
