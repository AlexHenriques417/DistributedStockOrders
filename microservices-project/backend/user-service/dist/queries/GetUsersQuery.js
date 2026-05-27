"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetUsersQuery = void 0;
const User_1 = require("../models/User");
class GetUsersQuery {
    async findAll() {
        return User_1.User.findAll({ attributes: ['id', 'name', 'email', 'role', 'createdAt'] });
    }
    async findById(id) {
        return User_1.User.findByPk(id, { attributes: ['id', 'name', 'email', 'role', 'createdAt'] });
    }
}
exports.GetUsersQuery = GetUsersQuery;
