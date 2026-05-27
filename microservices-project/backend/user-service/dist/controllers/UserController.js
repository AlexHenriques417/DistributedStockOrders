"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserController = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const UserService_1 = require("../services/UserService");
const service = new UserService_1.UserService();
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretjwtkey';
class UserController {
    async index(req, res) {
        try {
            const users = await service.findAll();
            return res.status(200).json(users);
        }
        catch (error) {
            return res.status(400).json({ error: error.message });
        }
    }
    async store(req, res) {
        try {
            const user = await service.create(req.body);
            return res.status(201).json({ id: user.id, name: user.name, email: user.email });
        }
        catch (error) {
            return res.status(400).json({ error: error.message });
        }
    }
    async register(req, res) {
        try {
            const user = await service.create(req.body);
            return res.status(201).json({ id: user.id, name: user.name, email: user.email });
        }
        catch (error) {
            return res.status(400).json({ error: error.message });
        }
    }
    async login(req, res) {
        try {
            const { email, password } = req.body;
            const user = await service.authenticate(email, password);
            const token = jsonwebtoken_1.default.sign({ sub: user.id, email: user.email }, JWT_SECRET, {
                expiresIn: '8h'
            });
            return res.status(200).json({ token, userId: user.id, email: user.email });
        }
        catch (error) {
            return res.status(400).json({ message: error.message });
        }
    }
    async profile(req, res) {
        try {
            const user = await service.findById(req.params.id);
            if (!user)
                return res.status(404).json({ error: 'Usuário não encontrado' });
            return res.status(200).json(user);
        }
        catch (error) {
            return res.status(400).json({ error: error.message });
        }
    }
    async destroy(req, res) {
        try {
            const user = await service.findById(req.params.id);
            if (!user)
                return res.status(404).json({ error: 'Usuário não encontrado' });
            await service.delete(req.params.id);
            return res.status(204).send();
        }
        catch (error) {
            return res.status(400).json({ error: error.message });
        }
    }
}
exports.UserController = UserController;
