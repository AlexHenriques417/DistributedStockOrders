import { User } from '../models/User';

export class GetUsersQuery {
  async findAll() {
    return User.findAll({ attributes: ['id', 'name', 'email', 'role', 'createdAt'] });
  }

  async findById(id: string) {
    return User.findByPk(id, { attributes: ['id', 'name', 'email', 'role', 'createdAt'] });
  }
}
