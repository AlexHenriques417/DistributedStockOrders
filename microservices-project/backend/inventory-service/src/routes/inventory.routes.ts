import { Router, Request, Response } from 'express';
import { InventoryService } from '../services/InventoryService';

const router = Router();
const service = new InventoryService();

// GET /inventory → lista tudo
router.get('/', async (req: Request, res: Response) => {
  try {
    const items = await service.findAll();
    return res.status(200).json(items);
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao buscar estoque' });
  }
});

// GET /inventory/:productId → busca 1
router.get('/:productId', async (req: Request, res: Response) => {
  try {
    const item = await service.getStockByProduct(req.params.productId);
    if (!item) return res.status(404).json({ error: 'Produto não encontrado no estoque' });
    return res.status(200).json(item);
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao buscar produto' });
  }
});

// POST /inventory → cria ou incrementa estoque
router.post('/', async (req: Request, res: Response) => {
  try {
    const { productId, quantity } = req.body;
    const item = await service.upsertStock(productId, quantity);
    return res.status(201).json(item);
  } catch (error) {
    return res.status(400).json({ error: 'Erro ao atualizar estoque' });
  }
});

// DELETE /inventory/:productId → zera estoque
router.delete('/:productId', async (req: Request, res: Response) => {
  try {
    const item = await service.zeroStock(req.params.productId);
    if (!item) return res.status(404).json({ error: 'Produto não encontrado' });
    return res.status(204).send();
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao zerar estoque' });
  }
});

export default router;