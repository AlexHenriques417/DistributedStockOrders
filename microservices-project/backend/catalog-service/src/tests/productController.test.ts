import { ProductController } from '../controllers/productController';
import productService from '../services/productService';

jest.mock('../services/productService');

describe('ProductController', () => {
  const controller = new ProductController();

  test('getProductById', async () => {
    (productService.getProductById as jest.Mock).mockResolvedValue({
      id: '1'
    });

    const req: any = {
      params: {
        productId: '1'
      }
    };

    const json = jest.fn();

    const res: any = {
      status: jest.fn(() => ({
        json
      }))
    };

    await controller.getProductById(
      req,
      res,
      jest.fn()
    );

    expect(res.status).toHaveBeenCalled();
  });
});