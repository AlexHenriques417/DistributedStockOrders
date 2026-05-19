import { Server as HttpServer } from 'http';
import { Server as SocketServer, Socket } from 'socket.io';

// Equivalente ao PedidoHub (SignalR) mas em Node.js/Socket.io
// SignalR Hub         => OrderGateway (esta classe)
// Groups.AddToGroup() => socket.join(`order:${id}`)
// IHubContext.Group() => this.io.to(`order:${id}`).emit()
export class OrderGateway {
  private io: SocketServer;

  constructor(httpServer: HttpServer) {
    this.io = new SocketServer(httpServer, {
      cors: {
        origin: process.env.FRONTEND_URL || '*',
        methods: ['GET', 'POST'],
      },
    });

    this.io.on('connection', (socket: Socket): void => {
      console.log(`[Gateway] Cliente conectado: ${socket.id}`);

      // Cliente entra no grupo do pedido
      socket.on('order:subscribe', (orderId: string): void => {
        if (!orderId) return;
        socket.join(`order:${orderId}`);
        console.log(`[Gateway] Socket ${socket.id} assinou pedido ${orderId}`);
        socket.emit('order:subscribed', { orderId, message: `Inscrito no pedido ${orderId}` });
      });

      // Cliente sai do grupo
      socket.on('order:unsubscribe', (orderId: string): void => {
        socket.leave(`order:${orderId}`);
        console.log(`[Gateway] Socket ${socket.id} saiu do pedido ${orderId}`);
      });

      socket.on('disconnect', (): void => {
        console.log(`[Gateway] Cliente desconectado: ${socket.id}`);
      });
    });

    console.log('[Gateway] OrderGateway (Socket.io) inicializado');
  }

  // Chamado pelo Consumer apos processar evento de pagamento
  notifyOrderStatusUpdated(orderId: string, status: string): void {
    this.io.to(`order:${orderId}`).emit('order:status_updated', {
      orderId, 
      status, 
      updatedAt: new Date().toISOString(),
    });
    console.log(`[Gateway] Notificando grupo order:${orderId} -> ${status}`);
  }
}