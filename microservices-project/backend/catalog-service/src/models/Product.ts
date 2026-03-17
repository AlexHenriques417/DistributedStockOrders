import { Table, Column, Model, DataType, PrimaryKey, Default } from 'sequelize-typescript';

@Table({ tableName: 'products', timestamps: true })
export class Product extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  id!: string;

  @Column({ type: DataType.STRING, allowNull: false })
  name!: string;

  @Column(DataType.TEXT)
  description?: string;

  @Column({ type: DataType.DECIMAL(10, 2), allowNull: false })
  price!: number;

  @Column({ type: DataType.INTEGER, defaultValue: 0 })
  stock_quantity!: number;
}

export default Product;