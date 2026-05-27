"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateUserCommand = void 0;
const User_1 = require("../models/User");
const amqplib_1 = __importDefault(require("amqplib"));
class CreateUserCommand {
    async execute(data) {
        const user = await User_1.User.create(data);
        await this.emitUserCreated(user);
        console.log(`[COMMAND] Usuário criado: ${user.id}`);
        return user;
    }
    async emitUserCreated(user) {
        try {
            const connection = await amqplib_1.default.connect(process.env.RABBITMQ_URL || 'amqp://localhost');
            const channel = await connection.createChannel();
            await channel.assertExchange('user_events', 'topic', { durable: true });
            channel.publish('user_events', 'user.created', Buffer.from(JSON.stringify({ id: user.id, email: user.email, name: user.name })));
            await channel.close();
            await connection.close();
        }
        catch (err) {
            console.warn('[WARN] Evento user.created não publicado:', err);
        }
    }
}
exports.CreateUserCommand = CreateUserCommand;
