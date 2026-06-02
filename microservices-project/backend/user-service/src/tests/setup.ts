process.env.NODE_ENV = 'test';

jest.mock('ioredis', () => {
  return jest.fn().mockImplementation(() => ({
    on: jest.fn(),
    quit: jest.fn(),
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    status: 'ready'
  }));
});

jest.mock('amqplib', () => ({
  connect: jest.fn().mockResolvedValue({
    createChannel: jest.fn().mockResolvedValue({})
  })
}));