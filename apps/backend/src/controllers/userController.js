const prisma = require('../utils/prisma');

async function getCurrentUser(req, res, next) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        balance: true
      }
    });

    res.json(user);
  } catch (error) {
    next(error);
  }
}

async function searchUsers(req, res, next) {
  try {
    const { q } = req.query;

    if (!q || q.trim().length < 2) {
      return res.status(400).json({ error: 'Search query must be at least 2 characters' });
    }

    const users = await prisma.user.findMany({
      where: {
        AND: [
          {
            OR: [
              { name: { contains: q, mode: 'insensitive' } },
              { email: { contains: q, mode: 'insensitive' } }
            ]
          },
          { id: { not: req.user.id } },
          { deletedAt: null }
        ]
      },
      select: {
        id: true,
        name: true,
        email: true
      },
      take: 10
    });

    res.json(users);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getCurrentUser,
  searchUsers
};
