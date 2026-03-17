import { Table, Column, Model, DataType, PrimaryKey, Default, IsEmail, Unique } from 'sequelize-typescript';

@Table({ tableName: 'users', timestamps: true })
export class User extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  id!: string; // Adicionado o "!"

  @Column({ type: DataType.STRING, allowNull: false })
  name!: string; // Adicionado o "!"

  @Unique
  @IsEmail
  @Column({ type: DataType.STRING, allowNull: false })
  email!: string; // Adicionado o "!"

  @Column({ type: DataType.STRING, allowNull: false })
  password!: string; // Adicionado o "!"

  @Default('client')
  @Column(DataType.ENUM('client', 'admin'))
  role!: string; // Adicionado o "!"
}

export default User;