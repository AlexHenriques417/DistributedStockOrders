jest.mock("../config/database", () => ({
  authenticate: jest.fn(),
  sync: jest.fn(),
  close: jest.fn()
}));

// culpa do put 404 :|
jest.mock("../models/Product", () => ({
  Product: {
    findByPk: jest.fn(),
    update: jest.fn(),
    findAll: jest.fn(),
    create: jest.fn(),
    destroy: jest.fn()
  }
}));

import request from "supertest";
import app from "../server"; 
import { Product } from "../models/Product";

describe("Catalog API", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("GET /health deve retornar 200", async () => {
    const response = await request(app).get("/health");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: 'OK', service: 'Catalog Service' });
  });

  it("GET /products deve retornar lista de produtos", async () => {
    (Product.findAll as jest.Mock).mockResolvedValue([
      { id: 1, name: "Produto Teste" }
    ]);

    const response = await request(app).get("/catalog/products");

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
  });

  it("POST /products deve criar produto", async () => {
    const novoProduto = {
      name: "Cx - 11",
      price: 379,
      description: "Deck set emperor might"
    };

    (Product.create as jest.Mock).mockResolvedValue({
      id: 1,
      ...novoProduto
    });
    
    const response = await request(app)
      .post("/catalog/products")
      .send(novoProduto);

    expect(response.status).toBe(201);
    expect(response.body.name).toBe(novoProduto.name);
  });

  it("POST /products deve retornar erro se dados inválidos", async () => {
    const response = await request(app)
      .post("/catalog/products")
      .send({}); 

    expect(response.status).toBe(400);
  });

  it("PUT /products deve atualizar um produto pelo primeiro id", async () => {
    // 🔥 MOCK DO GET
    (Product.findAll as jest.Mock).mockResolvedValue([
      { id: 1, name: "Produto Teste" }
    ]);

    // 🔥 MOCK DO FIND
    (Product.findByPk as jest.Mock).mockResolvedValue({ id: 1 });

    // 🔥 MOCK DO UPDATE
    (Product.update as jest.Mock).mockResolvedValue([1]);

    // 1. Buscar produtos
    const getResponse = await request(app).get("/catalog/products");
    const produto = getResponse.body[0];

    // 2. Atualizar o primeiro
    const putResponse = await request(app)
      .put(`/catalog/products/${produto.id}`)
      .send({
        "name": "Atualizando produto",
        "price": 0,
        "description": "teste de atualização"
      });

    expect(putResponse.status).toBe(200);
  })

  it("PUT /products deve retornar 404 se produto não existir", async () => {
    (Product.findByPk as jest.Mock).mockResolvedValue(null);

    const response = await request(app)
      .put("/catalog/products/999999") 
      .send({
        "name": "Atualizando produto",
        "price": 0,
        "description": "teste de atualização"
      });

    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty("message");
  });

  it("PUT /products deve retornar 400 se dados inválidos", async () => {
    (Product.findByPk as jest.Mock).mockResolvedValue({ id: 1 });

    const response = await request(app)
      .put("/catalog/products/1")
      .send({});

    expect(response.status).toBe(400);
  });

  it("DELETE /products deve remover o primeiro produto", async () => {
    // 🔥 1. Mock do GET (simula banco)
    (Product.findAll as jest.Mock).mockResolvedValue([
      { id: "uuid-1", name: "Produto Teste" }
    ]);

    // 🔥 2. Mock do DELETE
    (Product.destroy as jest.Mock).mockResolvedValue(1);

    // 3. Buscar produtos
    const getResponse = await request(app).get("/catalog/products");
    const produto = getResponse.body[0];

    // 4. Deletar o primeiro
    const deleteResponse = await request(app)
      .delete(`/catalog/products/${produto.id}`);

    expect(deleteResponse.status).toBe(204);
  });

  it("DELETE /products deve retornar 404 se produto não existir", async () => {
    (Product.destroy as jest.Mock).mockResolvedValue(0);

    const response = await request(app)
      .delete("/catalog/products/999");

    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty("message");
  });
  
});