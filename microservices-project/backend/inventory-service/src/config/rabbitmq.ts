import connect from 'amqplib';

const QUEUE_ARGS = {
  durable: true,
  arguments: {
    'x-dead-letter-exchange': 'dlx',
    'x-message-ttl': 604800000
  }
};

export const setupRabbitMQ = async (channel: connect.Channel) => {
  const exchange = process.env.RABBITMQ_EXCHANGE || 'inventory.events';
  const catalogExchange = process.env.RABBITMQ_CATALOG_EXCHANGE || 'catalog.events';

  await channel.assertExchange(exchange, 'topic', { durable: true });
  await channel.assertExchange(catalogExchange, 'topic', { durable: true });

  await channel.assertQueue('inventory.service.queue', QUEUE_ARGS);
  await channel.assertQueue('inventory.events.queue', QUEUE_ARGS);

  await channel.bindQueue('inventory.service.queue', catalogExchange, 'catalog.product.created');
  await channel.bindQueue('inventory.service.queue', catalogExchange, 'catalog.product.updated');
  await channel.bindQueue('inventory.service.queue', catalogExchange, 'catalog.product.deleted');

  await channel.bindQueue('inventory.events.queue', exchange, 'stock.*');

  console.log('RabbitMQ setup completed');
};

export const publishEvent = async (
  channel: connect.Channel,
  routingKey: string,
  message: any
) => {
  const exchange = process.env.RABBITMQ_EXCHANGE || 'inventory.events';

  channel.publish(
    exchange,
    routingKey,
    Buffer.from(JSON.stringify(message)),
    { persistent: true }
  );
};

export const consumeCatalogEvents = async (
  channel: connect.Channel,
  callback: (message: any) => Promise<void>
) => {
  const queue = 'inventory.service.queue';

  await channel.consume(queue, async (msg) => {
    if (msg) {
      try {
        const content = JSON.parse(msg.content.toString());
        const routingKey = msg.fields.routingKey;

        await callback({ event: routingKey, data: content });
        channel.ack(msg);
      } catch (error) {
        console.error('Error processing catalog event:', error);
        channel.nack(msg, false, true);
      }
    }
  });
};

export const consumeStockEvents = async (
  channel: connect.Channel,
  callback: (message: any) => Promise<void>
) => {
  const queue = 'inventory.events.queue';
  const exchange = process.env.RABBITMQ_EXCHANGE || 'inventory.events';

  // Usando QUEUE_ARGS aqui também pois redeclara a fila
  await channel.assertQueue(queue, QUEUE_ARGS);
  await channel.bindQueue(queue, exchange, 'stock.*');

  await channel.consume(queue, async (msg) => {
    if (msg) {
      try {
        const content = JSON.parse(msg.content.toString());
        const routingKey = msg.fields.routingKey;

        await callback({ event: routingKey, data: content });
        channel.ack(msg);
      } catch (error) {
        console.error('Error processing stock event:', error);
        channel.nack(msg, false, true);
      }
    }
  });
};