import { Table, Column, Model, DataType, PrimaryKey, Default, AllowNull } from 'sequelize-typescript';

@Table({ tableName: 'payments', timestamps: true })
export class Payment extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  id!: string;

  @AllowNull(false)
  @Column(DataType.UUID)
  orderId!: string;

  @AllowNull(false)
  @Column(DataType.DECIMAL(10, 2))
  amount!: number;

  @Default('PENDING')
  @Column(DataType.ENUM('PENDING', 'APPROVED', 'REFUSED'))
  status!: string;
}

export default Payment;