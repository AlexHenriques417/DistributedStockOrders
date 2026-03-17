import { Table, Column, Model, DataType, PrimaryKey, Default, AllowNull } from 'sequelize-typescript';

@Table({ tableName: 'orders', timestamps: true })
export class Order extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  id!: string;

  @AllowNull(false)
  @Column(DataType.UUID)
  userId!: string;

  @AllowNull(false)
  @Column(DataType.UUID)
  productId!: string;

  @AllowNull(false)
  @Column(DataType.INTEGER)
  quantity!: number;

  @AllowNull(false)
  @Column(DataType.DECIMAL(10, 2))
  totalPrice!: number;

  @Default('PENDING')
  @Column(DataType.ENUM('PENDING', 'PAID', 'CANCELED'))
  status!: string;
}

export default Order;