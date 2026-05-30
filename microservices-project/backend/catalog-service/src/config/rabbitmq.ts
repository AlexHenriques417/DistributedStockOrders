import connect from 'amqplib';

const QUEUE_ARGS = {
  durable: true,
  arguments: {
    'x-dead-letter-exchange': 'dlx',
    'x-message-ttl': 604800000
  }
};

export const setupRabbitMQ = async (channel: connect.Channel) => {
  const exchange = process.env.RABBITMQ_EXCHANGE || 'catalog.events';

  await channel.assertExchange(exchange, 'topic', { durable: true });

  await channel.assertQueue('catalog.service.queue', QUEUE_ARGS);

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