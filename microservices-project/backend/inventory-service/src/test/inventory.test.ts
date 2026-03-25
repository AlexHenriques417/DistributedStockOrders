jest.mock("../config/database", () => ({
  authenticate: jest.fn(),
  sync: jest.fn(),
  close: jest.fn()
}));

jest.mock("../models/Inventory", () => ({
  Inventory: {
    findByPk: jest.fn(),
    update: jest.fn(),
    findAll: jest.fn(),
    create: jest.fn(),
    destroy: jest.fn(),
    findOne: jest.fn()
  }
}));

import request from "supertest";
import app from "../server";
import { Inventory } from "../models/Inventory";

describe("Inventory API", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("GET /inventory deve listar todos", async () => {
        (Inventory.findAll as jest.Mock).mockResolvedValue([
        { id: 1, productId: 1, quantity: 100 }
        ]);

        const response = await request(app).get("/inventory");

        expect(response.status).toBe(200);
        expect(response.body.length).toBe(1);
    });

    it("GET /inventory/:productId deve retornar estoque", async () => {
        (Inventory.findOne as jest.Mock).mockResolvedValue({
        id: 1,
        productId: 1,
        quantity: 100
        });

        const response = await request(app).get("/inventory/1");

        expect(response.status).toBe(200);
        expect(response.body.productId).toBe(1);
    });

    it("POST /inventory deve criar produto", async () => {
        (Inventory.findOne as jest.Mock).mockResolvedValue(null);

        (Inventory.create as jest.Mock).mockResolvedValue({
        id: 1,
        productId: 1,
        quantity: 100
        });

        const response = await request(app)
        .post("/inventory")
        .send({
            productId: 1,
            quantity: 100
        });

        expect(response.status).toBe(201);
        expect(Inventory.create).toHaveBeenCalled();
    });

    it("DELETE /inventory/:productId deve zerar estoque", async () => {
        const saveMock = jest.fn().mockResolvedValue(true);

        (Inventory.findOne as jest.Mock).mockResolvedValue({
            productId: 1,
            quantity: 100,
            save: saveMock
        });

        const response = await request(app).delete("/inventory/1");

        expect(response.status).toBe(204);
        expect(saveMock).toHaveBeenCalled();
    });

    it("DELETE /inventory/:productId deve retornar erro se não existir", async () => {
        (Inventory.findOne as jest.Mock).mockResolvedValue(null);

        const response = await request(app).delete("/inventory/1");

        expect(response.status).toBe(404);
    });
});