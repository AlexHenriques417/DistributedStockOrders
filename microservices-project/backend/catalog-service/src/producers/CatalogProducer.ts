import amqp from 'amqplib';

export class CatalogProducer {
  private channel?: amqp.Channel;

  async init() {
    const connection = await amqp.connect(process.env.RABBITMQ_URL || 'amqp://localhost');
    this.channel = await connection.createChannel();
    await this.channel.assertExchange('catalog_events', 'topic', { durable: true });
  }

  async emitProductCreated(product: any) {
    if (!this.channel) await this.init();
    
    this.channel?.publish(
      'catalog_events',
      'product.created',
      Buffer.from(JSON.stringify(product))
    );
    console.log(`[Event] Product ${product.id} emitted to RabbitMQ`);
  }
}