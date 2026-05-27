import connect from 'amqplib';

export const setupRabbitMQ = async (channel: connect.Channel) => {
  const exchange = process.env.RABBITMQ_EXCHANGE || 'payment.events';
  const orderExchange = process.env.ORDER_EVENTS_EXCHANGE || 'order.events';

  // Assert payment events exchange
  await channel.assertExchange(exchange, 'topic', { durable: true });

  // Assert order events exchange (to consume from)
  await channel.assertExchange(orderExchange, 'topic', { durable: true });

  // Assert queues
  await channel.assertQueue('payment.service.queue', { durable: true });
  await channel.assertQueue('payment.order.events.queue', { durable: true });

  // Bindings for outgoing events (payment.service.queue binds to payment.events)
  await channel.bindQueue('payment.service.queue', exchange, 'payment.*');

  // Bindings for incoming events (consume order events)
  await channel.bindQueue('payment.order.events.queue', orderExchange, 'order.created');
  await channel.bindQueue('payment.order.events.queue', orderExchange, 'order.confirmed');

  console.log('RabbitMQ setup completed');
};

export const publishEvent = async (
  channel: connect.Channel,
  routingKey: string,
  message: any
) => {
  const exchange = process.env.RABBITMQ_EXCHANGE || 'payment.events';

  channel.publish(
    exchange,
    routingKey,
    Buffer.from(JSON.stringify(message)),
    { persistent: true }
  );
};

export const consumeOrderEvents = async (
  channel: connect.Channel,
  callback: (message: any, routingKey: string) => Promise<void>
) => {
  const queue = 'payment.order.events.queue';

  await channel.consume(queue, async (msg) => {
    if (msg) {
      try {
        const content = JSON.parse(msg.content.toString());
        const routingKey = msg.fields.routingKey;

        console.log(`Received order event: ${routingKey}`, content);

        await callback(content, routingKey);
        channel.ack(msg);
      } catch (error) {
        console.error('Error processing order event:', error);
        channel.nack(msg, false, false);
      }
    }
  });
};
