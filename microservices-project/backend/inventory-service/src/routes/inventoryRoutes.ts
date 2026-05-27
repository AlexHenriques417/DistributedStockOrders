import { Router } from 'express';
import inventoryController from '../controllers/inventoryController';
import { authMiddleware, roleMiddleware } from '../middleware/auth';
import { validateDto } from '../middleware/validateDto';
import {
  CreateInventoryItemDto,
  UpdateInventoryItemDto,
  StockAdjustmentDto,
  ReserveStockDto,
  ReleaseStockDto,
  TransferStockDto,
  CreateWarehouseDto,
  UpdateWarehouseDto,
} from '../dtos/inventory.dto';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// Inventory Item Routes
router.get('/', inventoryController.listInventoryItems);
router.post('/', roleMiddleware('admin', 'inventory_manager'), validateDto(CreateInventoryItemDto), inventoryController.createInventoryItem);

router.get('/product/:productId', inventoryController.getInventoryByProductId);
router.get('/sku/:sku', inventoryController.getInventoryBySku);
router.get('/availability/:productId', inventoryController.checkAvailability);

router.get('/:itemId', inventoryController.getInventoryItem);
router.put('/:itemId', roleMiddleware('admin', 'inventory_manager'), validateDto(UpdateInventoryItemDto), inventoryController.updateInventoryItem);

// Stock Operations
router.post('/:itemId/adjust', roleMiddleware('admin', 'inventory_manager'), validateDto(StockAdjustmentDto), inventoryController.adjustStock);
router.post('/:ItemId/reserve', validateDto(ReserveStockDto), inventoryController.reserveStock);
router.post('/:itemId/release', validateDto(ReleaseStockDto), inventoryController.releaseStock);
router.post('/:itemId/confirm', validateDto(ReleaseStockDto), inventoryController.confirmReservation);
router.post('/:itemId/transfer', roleMiddleware('admin', 'inventory_manager'), validateDto(TransferStockDto), inventoryController.transferStock);

// Transaction History
router.get('/:itemId/transactions', inventoryController.getTransactionHistory);

// Reservations
router.get('/:itemId/reservations', roleMiddleware('admin', 'inventory_manager'), inventoryController.getReservations);

// Warehouse Routes
router.get('/warehouses', inventoryController.listWarehouses);
router.post('/warehouses', roleMiddleware('admin'), validateDto(CreateWarehouseDto), inventoryController.createWarehouse);
router.get('/warehouses/:warehouseId', inventoryController.getWarehouse);
router.put('/warehouses/:warehouseId', roleMiddleware('admin'), validateDto(UpdateWarehouseDto), inventoryController.updateWarehouse);

export default router;
