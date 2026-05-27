"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
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
const supertest_1 = __importDefault(require("supertest"));
const server_1 = __importDefault(require("../server"));
const User_1 = require("../models/User");
describe("User API", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });
    it("GET /health deve retornar 200", async () => {
        const response = await (0, supertest_1.default)(server_1.default).get("/health");
        expect(response.status).toBe(200);
        expect(response.body).toEqual({ status: "OK", service: "User Service" });
    });
    it("GET /user deve retornar lista de usuários", async () => {
        User_1.User.findAll.mockResolvedValue([
            { id: "uuid-1", name: "Alex", email: "alex@email.com", role: "client" }
        ]);
        const response = await (0, supertest_1.default)(server_1.default).get("/user");
        expect(response.status).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);
    });
    it("POST /user deve criar usuário", async () => {
        const novoUsuario = {
            name: "Alex",
            email: "alex@email.com",
            password: "senha123"
        };
        User_1.User.create.mockResolvedValue({
            id: "uuid-1",
            ...novoUsuario
        });
        const response = await (0, supertest_1.default)(server_1.default)
            .post("/user")
            .send(novoUsuario);
        expect(response.status).toBe(201);
        expect(response.body.name).toBe(novoUsuario.name);
    });
    it("GET /user/:id deve retornar usuário pelo id", async () => {
        User_1.User.findByPk.mockResolvedValue({
            id: "uuid-1",
            name: "Alex",
            email: "alex@email.com"
        });
        const response = await (0, supertest_1.default)(server_1.default).get("/user/uuid-1");
        expect(response.status).toBe(200);
        expect(response.body.id).toBe("uuid-1");
    });
    it("GET /user/:id deve retornar 404 se não existir", async () => {
        User_1.User.findByPk.mockResolvedValue(null);
        const response = await (0, supertest_1.default)(server_1.default).get("/user/nao-existe");
        expect(response.status).toBe(404);
        expect(response.body).toHaveProperty("error");
    });
    it("DELETE /user/:id deve remover usuário", async () => {
        const mockUser = {
            id: "uuid-1",
            destroy: jest.fn().mockResolvedValue(undefined)
        };
        User_1.User.findByPk.mockResolvedValue(mockUser);
        const response = await (0, supertest_1.default)(server_1.default).delete("/user/uuid-1");
        expect(response.status).toBe(204);
    });
    it("DELETE /user/:id deve retornar 404 se não existir", async () => {
        User_1.User.findByPk.mockResolvedValue(null);
        const response = await (0, supertest_1.default)(server_1.default).delete("/user/nao-existe");
        expect(response.status).toBe(404);
        expect(response.body).toHaveProperty("error");
    });
});
