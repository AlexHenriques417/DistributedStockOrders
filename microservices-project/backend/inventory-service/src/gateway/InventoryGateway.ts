import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';

export class InventoryGateway {
  private io: SocketIOServer;

  constructor(httpServer: HTTPServer) {
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: '*',
        methods: ['GET', 'POST']
      }
    });

    this.initializeEvents();
  }

  private initializeEvents() {
    this.io.on('connection', (socket) => {
      console.log(`[WS] Inventory client conectado: ${socket.id}`);

      socket.on('inventory:subscribe', (productId: string) => {
        socket.join(`inventory:${productId}`);
        socket.emit('inventory:subscribed', { productId });
      });

      socket.on('disconnect', () => {
        console.log(`[WS] Inventory client desconectado: ${socket.id}`);
      });
    });
  }

  notifyInventoryUpdate(productId: string, quantity: number, status: string) {
    this.io.to(`inventory:${productId}`).emit('inventory:updated', {
      productId,
      quantity,
      status,
      updatedAt: new Date()
    });
  }
}