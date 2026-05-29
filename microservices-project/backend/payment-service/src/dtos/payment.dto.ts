import {
  IsString,
  IsNumber,
  IsPositive,
  IsOptional,
  IsEnum,
  IsUUID,
  MinLength,
  MaxLength,
  IsCreditCard,
  IsInt,
  Min,
  Max,
  Matches,
} from 'class-validator';

export enum PaymentMethod {
  CREDIT_CARD = 'CREDIT_CARD',
  PIX = 'PIX',
  BOLETO = 'BOLETO',
}

export class ProcessPaymentDto {
  @IsUUID()
  orderId!: string;

  @IsUUID()
  userId!: string;

  @IsNumber()
  @IsPositive()
  amount!: number;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsEnum(PaymentMethod)
  paymentMethod!: PaymentMethod;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  metadata?: any;
}

export class CreditCardDetailsDto {
  @IsCreditCard()
  cardNumber!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(50)
  cardholderName!: string;

  @IsInt()
  @Min(1)
  @Max(12)
  expiryMonth!: number;

  @IsInt()
  @Min(2024)
  expiryYear!: number;

  @IsString()
  @MinLength(3)
  @MaxLength(4)
  cvv!: string;
}

export class ProcessCreditCardPaymentDto extends ProcessPaymentDto {
  @IsEnum(PaymentMethod)
  declare paymentMethod: PaymentMethod.CREDIT_CARD;

  creditCardDetails!: CreditCardDetailsDto;
}

export class ProcessPixPaymentDto extends ProcessPaymentDto {
  @IsEnum(PaymentMethod)
  declare paymentMethod: PaymentMethod.PIX;

  @IsOptional()
  @IsString()
  pixKey?: string;
}

export class ProcessBoletoPaymentDto extends ProcessPaymentDto {
  @IsEnum(PaymentMethod)
  declare paymentMethod: PaymentMethod.BOLETO;

  @IsOptional()
  @Matches(/^\d{3}\.\d{3}\.\d{3}-\d{2}$|^\d{11}$/)
  documentNumber?: string;
}

export class RefundPaymentDto {
  @IsUUID()
  paymentId!: string;

  @IsNumber()
  @IsPositive()
  amount!: number;

  @IsOptional()
  @IsString()
  reason?: string;
}

export class GetPaymentDto {
  @IsUUID()
  paymentId!: string;
}

export class ListPaymentsDto {
  @IsOptional()
  @IsUUID()
  orderId?: string;

  @IsOptional()
  @IsUUID()
  userId?: string;

  @IsOptional()
  @IsEnum(['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED', 'REFUNDED', 'PARTIALLY_REFUNDED'])
  status?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}

export class ConfirmPaymentDto {
  @IsUUID()
  paymentId!: string;

  @IsString()
  gatewayTxId!: string;

  @IsOptional()
  gatewayResponse?: any;
}