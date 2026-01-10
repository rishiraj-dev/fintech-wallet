const express = require('express');
const { 
  getTransactions, 
  createTransaction, 
  deleteTransaction 
} = require('../controllers/transactionController');
const authenticate = require('../middlewares/authenticate');
const { createRateLimiter } = require('../middlewares/sanitization');

const router = express.Router();

// All transaction routes require authentication
router.use(authenticate);

/**
 * @swagger
 * /api/v1/transactions:
 *   get:
 *     summary: Get transaction history
 *     description: Retrieve paginated transaction history for the authenticated user
 *     tags: [Transactions]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of transactions to return
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Number of transactions to skip
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [CREDIT, DEBIT]
 *         description: Filter by transaction type
 *     responses:
 *       200:
 *         description: Transaction history retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Transaction'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     offset:
 *                       type: integer
 *                     page:
 *                       type: integer
 *       401:
 *         description: Not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/', getTransactions);

/**
 * @swagger
 * /api/v1/transactions:
 *   post:
 *     summary: Create a new transaction
 *     description: Create either a CREDIT (add money) or DEBIT (transfer to another user) transaction. DEBIT transactions include a 2% fee.
 *     tags: [Transactions]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - type
 *               - amount
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [CREDIT, DEBIT]
 *                 description: Transaction type
 *               amount:
 *                 type: number
 *                 minimum: 1
 *                 maximum: 10000
 *                 description: Transaction amount
 *                 example: 500
 *               recipientId:
 *                 type: integer
 *                 description: Recipient user ID (required for DEBIT transactions)
 *                 example: 4
 *           examples:
 *             credit:
 *               summary: Add money to wallet
 *               value:
 *                 type: CREDIT
 *                 amount: 1000
 *             debit:
 *               summary: Transfer to another user
 *               value:
 *                 type: DEBIT
 *                 amount: 500
 *                 recipientId: 4
 *     responses:
 *       201:
 *         description: Transaction successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Transaction successful
 *                 transactionId:
 *                   type: integer
 *                 newBalance:
 *                   type: number
 *       400:
 *         description: Validation error or insufficient balance
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Recipient not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/', createRateLimiter(60 * 1000, 20), createTransaction);

/**
 * @swagger
 * /api/v1/transactions/{id}:
 *   delete:
 *     summary: Soft delete a transaction
 *     description: Hide a transaction from history (soft delete by setting deletedAt timestamp)
 *     tags: [Transactions]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Transaction ID
 *     responses:
 *       200:
 *         description: Transaction hidden successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Transaction hidden
 *       401:
 *         description: Not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Transaction not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.delete('/:id', deleteTransaction);

module.exports = router;
