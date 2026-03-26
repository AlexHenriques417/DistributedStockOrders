jest.mock("../config/database", () => ({
  authenticate: jest.fn(),
  sync: jest.fn(),
  close: jest.fn()
}));

jest.mock("../models/Order", () => ({
  Order: {
    findAll: jest.fn(),
    findByPk: jest.fn(),
    create: jest.fn()
  }
}));

jest.mock("amqplib", () => ({
  connect: jest.fn().mockResolvedValue({
    createChannel: jest.fn().mockResolvedValue({
      assertExchange: jest.fn(),
      publish: jest.fn(),
      close: jest.fn()
    }),
    close: jest.fn()
  })
}));

import request from "supertest";
import app from "../server";
import { Order } from "../models/Order";

describe("Order API", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("GET /health deve retornar 200", async () => {
    const response = await request(app).get("/health");
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: "OK", service: "Order Service" });
  });

  it("GET /order deve retornar lista de pedidos", async () => {
    (Order.findAll as jest.Mock).mockResolvedValue([
      { id: "uuid-1", userId: "user-1", productId: "prod-1", quantity: 2, totalPrice: 99.80, status: "PENDING" }
    ]);

    const response = await request(app).get("/order");
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
  });

  it("POST /order deve criar pedido", async () => {
    const novoPedido = {
      userId: "uuid-user",
      productId: "uuid-prod",
      quantity: 2,
      price: 49.90
    };

    (Order.create as jest.Mock).mockResolvedValue({
      id: "uuid-order",
      ...novoPedido,
      totalPrice: 99.80,
      status: "PENDING"
    });

    const response = await request(app)
      .post("/order")
      .send(novoPedido);

    expect(response.status).toBe(201);
    expect(response.body.status).toBe("PENDING");
  });

  it("GET /order/:id deve retornar pedido pelo id", async () => {
    (Order.findByPk as jest.Mock).mockResolvedValue({
      id: "uuid-order",
      status: "PENDING"
    });

    const response = await request(app).get("/order/uuid-order");
    expect(response.status).toBe(200);
    expect(response.body.id).toBe("uuid-order");
  });

  it("GET /order/:id deve retornar 404 se não existir", async () => {
    (Order.findByPk as jest.Mock).mockResolvedValue(null);

    const response = await request(app).get("/order/nao-existe");
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty("error");
  });

  it("PATCH /order/:id deve atualizar status do pedido", async () => {
    const mockOrder = {
      id: "uuid-order",
      status: "PENDING",
      save: jest.fn().mockResolvedValue(undefined)
    };
    (Order.findByPk as jest.Mock).mockResolvedValue(mockOrder);

    const response = await request(app)
      .patch("/order/uuid-order")
      .send({ status: "PAID" });

    expect(response.status).toBe(200);
  });

  it("PATCH /order/:id deve retornar 404 se não existir", async () => {
    (Order.findByPk as jest.Mock).mockResolvedValue(null);

    const response = await request(app)
      .patch("/order/nao-existe")
      .send({ status: "PAID" });

    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty("error");
  });
});