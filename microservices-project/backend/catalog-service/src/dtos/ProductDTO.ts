export interface CreateProductDTO {
  name: string;
  description?: string;
  price: number;
  stock_quantity: number;
}

export interface ProductResponseDTO {
  id: string;
  name: string;
  price: number;
  in_stock: boolean;
}