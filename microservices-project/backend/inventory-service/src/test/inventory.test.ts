jest.mock("../config/database", () => ({
  authenticate: jest.fn(),
  sync: jest.fn(),
  close: jest.fn()
}));

jest.mock("../models/Inventory", () => ({
  Inventory: {
    findAll: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn()
  }
}));

jest.mock("amqplib", () => ({
  connect: jest.fn().mockResolvedValue({
    createChannel: jest.fn().mockResolvedValue({
      assertExchange: jest.fn(),
      assertQueue: jest.fn().mockResolvedValue({ queue: "inventory_queue" }),
      bindQueue: jest.fn(),
      consume: jest.fn(),
      close: jest.fn()
    }),
    close: jest.fn()
  })
}));

import request from "supertest";
import app from "../server";
import { Inventory } from "../models/Inventory";

describe("Inventory API", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("GET /health deve retornar 200", async () => {
    const response = await request(app).get("/health");
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: "OK", service: "Inventory Service" });
  });

  it("GET /inventory deve retornar lista de estoques", async () => {
    (Inventory.findAll as jest.Mock).mockResolvedValue([
      { id: "uuid-1", productId: "prod-1", quantity: 10 }
    ]);

    const response = await request(app).get("/inventory");
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
  });

  it("POST /inventory deve criar entrada de estoque", async () => {
    const payload = { productId: "uuid-prod", quantity: 50 };

    (Inventory.findOne as jest.Mock).mockResolvedValue(null);
    (Inventory.create as jest.Mock).mockResolvedValue({
      id: "uuid-inv",
      ...payload
    });

    const response = await request(app)
      .post("/inventory")
      .send(payload);

    expect(response.status).toBe(201);
    expect(response.body.productId).toBe(payload.productId);
  });

  it("POST /inventory deve incrementar estoque se produto já existir", async () => {
    const mockItem = {
      id: "uuid-inv",
      productId: "uuid-prod",
      quantity: 10,
      save: jest.fn().mockResolvedValue(undefined)
    };

    (Inventory.findOne as jest.Mock).mockResolvedValue(mockItem);

    const response = await request(app)
      .post("/inventory")
      .send({ productId: "uuid-prod", quantity: 5 });

    expect(response.status).toBe(201);
    expect(mockItem.save).toHaveBeenCalled();
  });

  it("GET /inventory/:productId deve retornar estoque do produto", async () => {
    (Inventory.findOne as jest.Mock).mockResolvedValue({
      id: "uuid-inv",
      productId: "uuid-prod",
      quantity: 10
    });

    const response = await request(app).get("/inventory/uuid-prod");
    expect(response.status).toBe(200);
    expect(response.body.quantity).toBe(10);
  });

  it("GET /inventory/:productId deve retornar 404 se não existir", async () => {
    (Inventory.findOne as jest.Mock).mockResolvedValue(null);

    const response = await request(app).get("/inventory/nao-existe");
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty("error");
  });

  it("DELETE /inventory/:productId deve zerar estoque", async () => {
    const mockItem = {
      productId: "uuid-prod",
      quantity: 10,
      save: jest.fn().mockResolvedValue(undefined)
    };
    (Inventory.findOne as jest.Mock).mockResolvedValue(mockItem);

    const response = await request(app).delete("/inventory/uuid-prod");
    expect(response.status).toBe(204);
    expect(mockItem.quantity).toBe(0);
  });

  it("DELETE /inventory/:productId deve retornar 404 se não existir", async () => {
    (Inventory.findOne as jest.Mock).mockResolvedValue(null);

    const response = await request(app).delete("/inventory/nao-existe");
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty("error");
  });
});
