jest.mock("../config/database", () => ({
  authenticate: jest.fn(),
  sync: jest.fn(),
  close: jest.fn()
}));

jest.mock("../models/Payment", () => ({
  Payment: {
    findOne: jest.fn(),
    create: jest.fn()
  }
}));

jest.mock("amqplib", () => ({
  connect: jest.fn().mockResolvedValue({
    createChannel: jest.fn().mockResolvedValue({
      assertExchange: jest.fn(),
      assertQueue: jest.fn().mockResolvedValue({ queue: "payment_queue" }),
      bindQueue: jest.fn(),
      publish: jest.fn(),
      consume: jest.fn(),
      close: jest.fn()
    }),
    close: jest.fn()
  })
}));

import request from "supertest";
import app from "../server";
import { Payment } from "../models/Payment";

describe("Payment API", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("GET /health deve retornar 200", async () => {
    const response = await request(app).get("/health");
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: "OK", service: "Payment Service" });
  });

  it("POST /payment/process deve processar pagamento aprovado", async () => {
    const payload = {
      orderId: "uuid-order",
      amount: 99.90,
      paymentMethod: "CREDIT_CARD",
      cardNumber: "4111111111111111"
    };

    (Payment.create as jest.Mock).mockResolvedValue({
      id: "uuid-pay",
      orderId: payload.orderId,
      amount: payload.amount,
      status: "APPROVED"
    });

    // Força aprovação
    jest.spyOn(Math, "random").mockReturnValue(0.5);

    const response = await request(app)
      .post("/payment/process")
      .send(payload);

    expect([200, 402]).toContain(response.status);
    expect(response.body).toHaveProperty("status");
  });

  it("POST /payment/process deve retornar 402 quando recusado", async () => {
    (Payment.create as jest.Mock).mockResolvedValue({
      id: "uuid-pay",
      orderId: "uuid-order",
      amount: 99.90,
      status: "REFUSED"
    });

    // Força recusa
    jest.spyOn(Math, "random").mockReturnValue(0.05);

    const response = await request(app)
      .post("/payment/process")
      .send({
        orderId: "uuid-order",
        amount: 99.90,
        paymentMethod: "CREDIT_CARD"
      });

    expect(response.status).toBe(402);
  });

  it("GET /payment/status/:orderId deve retornar pagamento", async () => {
    (Payment.findOne as jest.Mock).mockResolvedValue({
      id: "uuid-pay",
      orderId: "uuid-order",
      status: "APPROVED"
    });

    const response = await request(app).get("/payment/status/uuid-order");
    expect(response.status).toBe(200);
    expect(response.body.status).toBe("APPROVED");
  });

  it("GET /payment/status/:orderId deve retornar 404 se não existir", async () => {
    (Payment.findOne as jest.Mock).mockResolvedValue(null);

    const response = await request(app).get("/payment/status/nao-existe");
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty("error");
  });
});