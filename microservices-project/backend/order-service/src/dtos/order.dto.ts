import {
  IsString,
  IsUUID,
  IsOptional,
  IsInt,
  IsDecimal,
  IsArray,
  ValidateNested,
  IsEnum,
  IsEmail,
  Min,
  IsObject,
} from 'class-validator';
import { Type } from 'class-transformer';
import { Decimal } from '@prisma/client/runtime/library';

// Address DTO
export class AddressDto {
  @IsString()
  street!: string;

  @IsString()
  number!: string;

  @IsOptional()
  @IsString()
  complement?: string;

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
}

// Order Item DTO
export class OrderItemDto {
  @IsUUID()
  productId!: string;

  @IsString()
  productName!: string;

  @IsString()
  productSku!: string;

  @IsInt()
  @Min(1)
  quantity!: number;

  @IsDecimal()
  unitPrice!: number;
}

// Create Order DTO
export class CreateOrderDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items!: OrderItemDto[];

  @ValidateNested()
  @Type(() => AddressDto)
  shippingAddress!: AddressDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => AddressDto)
  billingAddress?: AddressDto;

  @IsOptional()
  @IsString()
  paymentMethod?: string;

  @IsOptional()
  @IsString()
  couponCode?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

// Update Order Status DTO
export class UpdateOrderStatusDto {
  @IsEnum(['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'])
  status!: string;

  @IsOptional()
  @IsString()
  trackingNumber?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

// Cancel Order DTO
export class CancelOrderDto {
  @IsString()
  reason!: string;
}

// Add to Cart DTO
export class AddToCartDto {
  @IsUUID()
  productId!: string;

  @IsString()
  productName!: string;

  @IsString()
  productSku!: string;

  @IsInt()
  @Min(1)
  quantity!: number;

  @IsDecimal()
  unitPrice!: number;
}

// Update Cart Item DTO
export class UpdateCartItemDto {
  @IsInt()
  @Min(1)
  quantity!: number;
}

// Create Coupon DTO
export class CreateCouponDto {
  @IsString()
  code!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsEnum(['percentage', 'fixed'])
  discountType!: string;

  @IsDecimal()
  discountValue!: number;

  @IsOptional()
  @IsDecimal()
  minOrderAmount?: number;

  @IsOptional()
  @IsInt()
  maxUses?: number;

  @IsString()
  validFrom!: string;

  @IsString()
  validUntil!: string;
}

// Validate Coupon DTO
export class ValidateCouponDto {
  @IsString()
  code!: string;

  @IsDecimal()
  orderAmount!: number;
}

// Order Query DTO
export class OrderQueryDto {
  @IsOptional()
  @IsEnum(['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'])
  status?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  limit?: number;

  @IsOptional()
  @IsString()
  startDate?: string;

  @IsOptional()
  @IsString()
  endDate?: string;
}
