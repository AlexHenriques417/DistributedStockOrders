import { Router, Request, Response } from 'express';
import { InventoryService } from '../services/InventoryService';
import { Inventory } from '../models/Inventory';

const router = Router();
const service = new InventoryService();


// 🔹 GET /inventory → listar tudo
router.get('/', async (req: Request, res: Response) => {
  try {
    const items = await Inventory.findAll();
    res.json(items);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar estoque' });
  }
});


// 🔹 GET /inventory/:productId → buscar 1
router.get('/:productId', async (req: Request, res: Response) => {
  try {
    const item = await service.getStockByProduct(req.params.productId);

    if (!item) {
      return res.status(404).json({ error: 'Produto não encontrado no estoque' });
    }

    res.json(item);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar produto' });
  }
});


// 🔹 POST /inventory → criar ou atualizar
router.post('/', async (req: Request, res: Response) => {
  try {
    const { productId, quantity } = req.body;

    let item = await Inventory.findOne({ where: { productId } });

    if (!item) {
      item = await Inventory.create({ productId, quantity });
    } else {
      item.quantity += quantity;
      await item.save();
    }

    res.status(201).json(item);
  } catch (error) {
    res.status(400).json({ error: 'Erro ao atualizar estoque' });
  }
});


// 🔹 DELETE /inventory/:productId → zerar estoque
router.delete('/:productId', async (req: Request, res: Response) => {
  try {
    const item = await Inventory.findOne({ where: { productId: req.params.productId } });

    if (!item) {
      return res.status(404).json({ error: 'Produto não encontrado' });
    }

    item.quantity = 0;
    await item.save();

    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Erro ao deletar estoque' });
  }
});

export default router;