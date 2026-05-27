import connect from 'amqplib';

export const setupRabbitMQ = async (channel: connect.Channel) => {
  const exchange = process.env.RABBITMQ_EXCHANGE || 'inventory.events';
  const catalogExchange = process.env.RABBITMQ_CATALOG_EXCHANGE || 'catalog.events';

  // Assert inventory events exchange
  await channel.assertExchange(exchange, 'topic', { durable: true });

  // Assert catalog events exchange for consuming
  await channel.assertExchange(catalogExchange, 'topic', { durable: true });

  // Assert queues
  await channel.assertQueue('inventory.service.queue', { durable: true });
  await channel.assertQueue('inventory.events.queue', { durable: true });

  // Bind inventory service queue to listen for catalog events
  await channel.bindQueue('inventory.service.queue', catalogExchange, 'catalog.product.created');
  await channel.bindQueue('inventory.service.queue', catalogExchange, 'catalog.product.updated');
  await channel.bindQueue('inventory.service.queue', catalogExchange, 'catalog.product.deleted');

  // Bind inventory events queue for internal events
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

        await callback({
          event: routingKey,
          data: content,
        });

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

  // Ensure the queue exists
  await channel.assertQueue(queue, { durable: true });
  await channel.bindQueue(queue, exchange, 'stock.*');

  await channel.consume(queue, async (msg) => {
    if (msg) {
      try {
        const content = JSON.parse(msg.content.toString());
        const routingKey = msg.fields.routingKey;

        await callback({
          event: routingKey,
          data: content,
        });

        channel.ack(msg);
      } catch (error) {
        console.error('Error processing stock event:', error);
        channel.nack(msg, false, true);
      }
    }
  });
};
