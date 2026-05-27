import connect from 'amqplib';

export const setupRabbitMQ = async (channel: connect.Channel) => {
  const exchange = process.env.RABBITMQ_EXCHANGE || 'catalog.events';

  await channel.assertExchange(exchange, 'topic', { durable: true });

  // Assert queues
  await channel.assertQueue('catalog.service.queue', { durable: true });

  // Bindings
  await channel.bindQueue('catalog.service.queue', exchange, 'product.*');
  await channel.bindQueue('catalog.service.queue', exchange, 'category.*');

  console.log('RabbitMQ setup completed');
};

export const publishEvent = async (
  channel: connect.Channel,
  routingKey: string,
  message: any
) => {
  const exchange = process.env.RABBITMQ_EXCHANGE || 'catalog.events';

  channel.publish(
    exchange,
    routingKey,
    Buffer.from(JSON.stringify(message)),
    { persistent: true }
  );
};
