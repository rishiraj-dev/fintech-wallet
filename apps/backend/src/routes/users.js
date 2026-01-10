const express = require('express');
const { getCurrentUser, searchUsers } = require('../controllers/userController');
const authenticate = require('../middlewares/authenticate');

const router = express.Router();

// All user routes require authentication
router.use(authenticate);

/**
 * @swagger
 * /api/v1/user/me:
 *   get:
 *     summary: Get current user profile
 *     description: Retrieve the authenticated user's profile with current balance
 *     tags: [User]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       401:
 *         description: Not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/me', getCurrentUser);

/**
 * @swagger
 * /api/v1/user/search:
 *   get:
 *     summary: Search for users
 *     description: Search users by name or email (for P2P transfers). Excludes current user and deleted accounts.
 *     tags: [User]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *           minLength: 2
 *         description: Search query (minimum 2 characters)
 *         example: john
 *     responses:
 *       200:
 *         description: Search results
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   name:
 *                     type: string
 *                   email:
 *                     type: string
 *       400:
 *         description: Invalid search query
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
 */
router.get('/search', searchUsers);

module.exports = router;
