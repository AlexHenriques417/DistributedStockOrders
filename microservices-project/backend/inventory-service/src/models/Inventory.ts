import { Table, Column, Model, DataType, PrimaryKey, Default, AllowNull } from 'sequelize-typescript';

@Table({ tableName: 'inventory', timestamps: true })
export class Inventory extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  id!: string;

  @AllowNull(false)
  @Column(DataType.UUID)
  productId!: string; // Referência ao ID do produto no Catalog-Service

  @AllowNull(false)
  @Default(0)
  @Column(DataType.INTEGER)
  quantity!: number;

  @Column(DataType.STRING)
  location?: string; // Ex: Corredor A, Prateleira 2
}