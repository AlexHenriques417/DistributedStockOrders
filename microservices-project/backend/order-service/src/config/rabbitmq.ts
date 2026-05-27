import connect from 'amqplib';
import { prisma } from '../server';
import { sagaOrchestrator } from '../services/sagaOrchestrator';

export const setupRabbitMQ = async (channel: connect.Channel) => {
  const exchange = process.env.RABBITMQ_EXCHANGE || 'order.events';

  // Assert main exchange for order events
  await channel.assertExchange(exchange, 'topic', { durable: true });

  // Assert exchange for receiving events from other services
  await channel.assertExchange('payment.events', 'topic', { durable: true });
  await channel.assertExchange('inventory.events', 'topic', { durable: true });

  // Assert queues for order service
  await channel.assertQueue('order.service.queue', { durable: true });
  await channel.assertQueue('order.payment.response.queue', { durable: true });
  await channel.assertQueue('order.inventory.response.queue', { durable: true });

  // Bindings for order events (outgoing)
  await channel.bindQueue('order.service.queue', exchange, 'order.*');

  // Bindings for payment events (incoming)
  await channel.bindQueue('order.payment.response.queue', 'payment.events', 'payment.completed');
  await channel.bindQueue('order.payment.response.queue', 'payment.events', 'payment.failed');
  await channel.bindQueue('order.payment.response.queue', 'payment.events', 'payment.refunded');

  // Bindings for inventory events (incoming)
  await channel.bindQueue('order.inventory.response.queue', 'inventory.events', 'inventory.reserved');
  await channel.bindQueue('order.inventory.response.queue', 'inventory.events', 'inventory.reservation_failed');
  await channel.bindQueue('order.inventory.response.queue', 'inventory.events', 'inventory.released');

  console.log('RabbitMQ setup completed');
};

export const publishEvent = async (
  channel: connect.Channel,
  routingKey: string,
  message: any
) => {
  const exchange = process.env.RABBITMQ_EXCHANGE || 'order.events';

  channel.publish(
    exchange,
    routingKey,
    Buffer.from(JSON.stringify(message)),
    { persistent: true }
  );
};

export const consumeEvents = async (channel: connect.Channel) => {
  // Consume payment response events
  await channel.consume('order.payment.response.queue', async (msg) => {
    if (!msg) return;

    try {
      const content = JSON.parse(msg.content.toString());
      const routingKey = msg.fields.routingKey;

      console.log(`Received payment event: ${routingKey}`, content);

      if (routingKey === 'payment.completed') {
        await sagaOrchestrator.handlePaymentCompleted(content);
      } else if (routingKey === 'payment.failed') {
        await sagaOrchestrator.handlePaymentFailed(content);
      } else if (routingKey === 'payment.refunded') {
        await sagaOrchestrator.handlePaymentRefunded(content);
      }

      channel.ack(msg);
    } catch (error) {
      console.error('Error processing payment event:', error);
      channel.nack(msg, false, true); // Requeue on error
    }
  });

  // Consume inventory response events
  await channel.consume('order.inventory.response.queue', async (msg) => {
    if (!msg) return;

    try {
      const content = JSON.parse(msg.content.toString());
      const routingKey = msg.fields.routingKey;

      console.log(`Received inventory event: ${routingKey}`, content);

      if (routingKey === 'inventory.reserved') {
        await sagaOrchestrator.handleInventoryReserved(content);
      } else if (routingKey === 'inventory.reservation_failed') {
        await sagaOrchestrator.handleInventoryReservationFailed(content);
      } else if (routingKey === 'inventory.released') {
        await sagaOrchestrator.handleInventoryReleased(content);
      }

      channel.ack(msg);
    } catch (error) {
      console.error('Error processing inventory event:', error);
      channel.nack(msg, false, true); // Requeue on error
    }
  });

  console.log('Started consuming events from payment and inventory services');
};

// Helper to publish to other exchanges
export const publishToPaymentService = async (
  channel: connect.Channel,
  routingKey: string,
  message: any
) => {
  channel.publish(
    'payment.events',
    routingKey,
    Buffer.from(JSON.stringify(message)),
    { persistent: true }
  );
};

export const publishToInventoryService = async (
  channel: connect.Channel,
  routingKey: string,
  message: any
) => {
  channel.publish(
    'inventory.events',
    routingKey,
    Buffer.from(JSON.stringify(message)),
    { persistent: true }
  );
};
