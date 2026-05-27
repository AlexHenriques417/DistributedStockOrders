import connect from 'amqplib';

export const setupRabbitMQ = async (channel: connect.Channel) => {
  const exchange = process.env.RABBITMQ_EXCHANGE || 'user.events';

  await channel.assertExchange(exchange, 'topic', { durable: true });

  // Assert queues
  await channel.assertQueue('user.service.queue', { durable: true });

  // Bindings
  await channel.bindQueue('user.service.queue', exchange, 'user.*');

  console.log('RabbitMQ setup completed');
};

export const publishEvent = async (
  channel: connect.Channel,
  routingKey: string,
  message: any
) => {
  const exchange = process.env.RABBITMQ_EXCHANGE || 'user.events';

  channel.publish(
    exchange,
    routingKey,
    Buffer.from(JSON.stringify(message)),
    { persistent: true }
  );
};
