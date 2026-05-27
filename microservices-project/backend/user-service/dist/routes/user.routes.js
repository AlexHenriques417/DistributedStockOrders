"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const UserController_1 = require("../controllers/UserController");
const router = (0, express_1.Router)();
const controller = new UserController_1.UserController();
router.get('/', (req, res) => controller.index(req, res)); // GET    /user
router.post('/', (req, res) => controller.store(req, res)); // POST   /user
router.post('/register', (req, res) => controller.register(req, res)); // POST   /user/register
router.post('/login', (req, res) => controller.login(req, res)); // POST   /user/login
router.get('/:id', (req, res) => controller.profile(req, res)); // GET    /user/:id
router.delete('/:id', (req, res) => controller.destroy(req, res)); // DELETE /user/:id
exports.default = router;
