jest.mock("../config/database", () => ({
  authenticate: jest.fn(),
  sync: jest.fn(),
  close: jest.fn()
}));

jest.mock("../models/User", () => ({
  User: {
    findAll: jest.fn(),
    findByPk: jest.fn(),
    create: jest.fn(),
    destroy: jest.fn()
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
import { User } from "../models/User";

describe("User API", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("GET /health deve retornar 200", async () => {
    const response = await request(app).get("/health");
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: "OK", service: "User Service" });
  });

  it("GET /user deve retornar lista de usuários", async () => {
    (User.findAll as jest.Mock).mockResolvedValue([
      { id: "uuid-1", name: "Alex", email: "alex@email.com", role: "client" }
    ]);

    const response = await request(app).get("/user");
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
  });

  it("POST /user deve criar usuário", async () => {
    const novoUsuario = {
      name: "Alex",
      email: "alex@email.com",
      password: "senha123"
    };

    (User.create as jest.Mock).mockResolvedValue({
      id: "uuid-1",
      ...novoUsuario
    });

    const response = await request(app)
      .post("/user")
      .send(novoUsuario);

    expect(response.status).toBe(201);
    expect(response.body.name).toBe(novoUsuario.name);
  });

  it("GET /user/:id deve retornar usuário pelo id", async () => {
    (User.findByPk as jest.Mock).mockResolvedValue({
      id: "uuid-1",
      name: "Alex",
      email: "alex@email.com"
    });

    const response = await request(app).get("/user/uuid-1");
    expect(response.status).toBe(200);
    expect(response.body.id).toBe("uuid-1");
  });

  it("GET /user/:id deve retornar 404 se não existir", async () => {
    (User.findByPk as jest.Mock).mockResolvedValue(null);

    const response = await request(app).get("/user/nao-existe");
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty("error");
  });

  it("DELETE /user/:id deve remover usuário", async () => {
    const mockUser = {
      id: "uuid-1",
      destroy: jest.fn().mockResolvedValue(undefined)
    };
    (User.findByPk as jest.Mock).mockResolvedValue(mockUser);

    const response = await request(app).delete("/user/uuid-1");
    expect(response.status).toBe(204);
  });

  it("DELETE /user/:id deve retornar 404 se não existir", async () => {
    (User.findByPk as jest.Mock).mockResolvedValue(null);

    const response = await request(app).delete("/user/nao-existe");
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty("error");
  });
});