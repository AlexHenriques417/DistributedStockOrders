import { IsString, IsInt, IsOptional, IsNumber, IsUUID, IsEnum, Min, Max } from 'class-validator';

export class CreateInventoryItemDto {
  @IsString()
  productId!: string;

  @IsString()
  sku!: string;

  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  quantity?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  reorderPoint?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  reorderQty?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  unitCost?: number;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsUUID()
  warehouseId?: string;
}

export class UpdateInventoryItemDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  reorderPoint?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  reorderQty?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  unitCost?: number;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsUUID()
  warehouseId?: string;

  @IsOptional()
  @IsEnum(['active', 'inactive', 'discontinued'])
  status?: string;
}

export class StockAdjustmentDto {
  @IsInt()
  @Min(1)
  quantity!: number;

  @IsEnum(['add', 'subtract', 'set'])
  adjustmentType!: string;

  @IsOptional()
  @IsString()
  referenceType?: string;

  @IsOptional()
  @IsString()
  referenceId?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  unitCost?: number;
}

export class ReserveStockDto {
  @IsString()
  orderId!: string;

  @IsInt()
  @Min(1)
  quantity!: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  expiresInSeconds?: number;
}

export class ReleaseStockDto {
  @IsString()
  orderId!: string;

  @IsInt()
  @Min(1)
  quantity!: number;
}

export class TransferStockDto {
  @IsUUID()
  targetWarehouseId!: string;

  @IsInt()
  @Min(1)
  quantity!: number;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class CreateWarehouseDto {
  @IsString()
  name!: string;

  @IsString()
  code!: string;

  @IsString()
  address!: string;

  @IsString()
  city!: string;

  @IsString()
  state!: string;

  @IsString()
  country!: string;

  @IsString()
  postalCode!: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  capacity?: number;
}

export class UpdateWarehouseDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  state?: string;

  @IsOptional()
  @IsString()
  country?: string;

  @IsOptional()
  @IsString()
  postalCode?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  capacity?: number;

  @IsOptional()
  @IsEnum(['active', 'inactive'])
  status?: string;
}

export class CheckAvailabilityDto {
  @IsInt()
  @Min(1)
  quantity!: number;
}
