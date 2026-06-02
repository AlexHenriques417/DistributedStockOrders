import connect from 'amqplib';
import { prisma } from '../server';
import { sagaOrchestrator } from '../services/sagaOrchestrator';

const QUEUE_ARGS = {
  durable: true,
  arguments: {
    'x-dead-letter-exchange': 'dlx',
    'x-message-ttl': 604800000
  }
};

export const setupRabbitMQ = async (channel: connect.Channel) => {
  const exchange = process.env.RABBITMQ_EXCHANGE || 'order.events';

  await channel.assertExchange(exchange, 'topic', { durable: true });
  await channel.assertExchange('payment.events', 'topic', { durable: true });
  await channel.assertExchange('inventory.events', 'topic', { durable: true });

  await channel.assertQueue('order.service.queue', QUEUE_ARGS);
  await channel.assertQueue('order.payment.response.queue', QUEUE_ARGS);
  await channel.assertQueue('order.inventory.response.queue', QUEUE_ARGS);

  await channel.bindQueue('order.service.queue', exchange, 'order.*');

  await channel.bindQueue('order.payment.response.queue', 'payment.events', 'payment.completed');
  await channel.bindQueue('order.payment.response.queue', 'payment.events', 'payment.failed');
  await channel.bindQueue('order.payment.response.queue', 'payment.events', 'payment.refunded');

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
      channel.nack(msg, false, true);
    }
  });

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
      channel.nack(msg, false, true);
    }
  });

  console.log('Started consuming events from payment and inventory services');
};

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