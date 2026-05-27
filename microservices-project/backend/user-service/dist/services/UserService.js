"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserService = void 0;
const CreateUserCommand_1 = require("../commands/CreateUserCommand");
const GetUsersQuery_1 = require("../queries/GetUsersQuery");
const User_1 = require("../models/User");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
class UserService {
    constructor() {
        this.createUserCommand = new CreateUserCommand_1.CreateUserCommand();
        this.getUsersQuery = new GetUsersQuery_1.GetUsersQuery();
    }
    // QUERIES
    async findAll() {
        return this.getUsersQuery.findAll();
    }
    async findById(id) {
        return this.getUsersQuery.findById(id);
    }
    async findByEmail(email) {
        return User_1.User.findOne({ where: { email } });
    }
    // COMMANDS
    async create(data) {
        const hashedPassword = await bcryptjs_1.default.hash(data.password, 10);
        return this.createUserCommand.execute({
            ...data,
            password: hashedPassword,
        });
    }
    async authenticate(email, password) {
        const user = await this.findByEmail(email);
        if (!user)
            throw new Error('Usuário ou senha inválidos');
        const isValid = await bcryptjs_1.default.compare(password, user.password);
        if (!isValid)
            throw new Error('Usuário ou senha inválidos');
        return user;
    }
    async delete(id) {
        const user = await User_1.User.findByPk(id);
        if (!user)
            throw new Error('Usuário não encontrado');
        await user.destroy();
    }
}
exports.UserService = UserService;
