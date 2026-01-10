const jwt = require('jsonwebtoken');
const prisma = require('../utils/prisma');

async function authenticate(req, res, next) {
  try {
    // handle httpOnly cookie
    const token = req.cookies?.token;

    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // verify JWT and extract payload
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const user = await prisma.user.findFirst({
      where: {
        id: decoded.userId,
        deletedAt: null
      },
      select: {
        id: true,
        name: true,
        email: true,
        balance: true
      }
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid or expired session' });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Session expired' });
    }
    next(error);
  }
}

module.exports = authenticate;
