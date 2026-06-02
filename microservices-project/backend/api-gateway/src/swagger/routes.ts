/**
 * @swagger
 * tags:
 *   - name: Authentication
 *   - name: Users
 *   - name: Catalog
 *   - name: Inventory
 *   - name: Orders
 *   - name: Payments
 */

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Register user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterRequest'
 *     responses:
 *       201:
 *         description: User created
 */

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Login
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: Login success
 */

/**
 * @swagger
 * /api/users/profile:
 *   get:
 *     tags:
 *       - Users
 *     summary: User profile
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile
 */

/**
 * @swagger
 * /api/catalog/products:
 *   get:
 *     tags:
 *       - Catalog
 *     summary: List products
 *     responses:
 *       200:
 *         description: Products list
 */

/**
 * @swagger
 * /api/inventory:
 *   get:
 *     tags:
 *       - Inventory
 *     summary: Inventory information
 *     responses:
 *       200:
 *         description: Inventory information
 */

/**
 * @swagger
 * /api/orders:
 *   post:
 *     tags:
 *       - Orders
 *     summary: Create order
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateOrderRequest'
 *     responses:
 *       201:
 *         description: Order created
 */

/**
 * @swagger
 * /api/payments:
 *   post:
 *     tags:
 *       - Payments
 *     summary: Create payment
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Payment created
 */