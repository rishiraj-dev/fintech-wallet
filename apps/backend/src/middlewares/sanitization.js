const validator = require('validator');

function sanitizeInput(req, res, next) {
  // fields that should NOT be escaped (need special chars)
  const skipEscapeFields = ['email', 'password', 'amount'];

  if (req.body) {
    Object.keys(req.body).forEach(key => {
      if (typeof req.body[key] === 'string') {
        //  trim whitespace
        req.body[key] = req.body[key].trim();
        
        // escape fields that won't break validation
        if (!skipEscapeFields.includes(key)) {
          req.body[key] = validator.escape(req.body[key]);
        }
      }
    });
  }
  
  if (req.query) {
    Object.keys(req.query).forEach(key => {
      if (typeof req.query[key] === 'string') {
        req.query[key] = req.query[key].trim();
        if (!skipEscapeFields.includes(key)) {
          req.query[key] = validator.escape(req.query[key]);
        }
      }
    });
  }

  if (req.params) {
    Object.keys(req.params).forEach(key => {
      if (typeof req.params[key] === 'string') {
        req.params[key] = req.params[key].trim();
        req.params[key] = validator.escape(req.params[key]);
      }
    });
  }

  next();
}

function validateEmail(email) {
  return validator.isEmail(email);
}


function validateAmount(amount) {
  const num = parseFloat(amount);
  return !isNaN(num) && num > 0 && isFinite(num);
}

function createRateLimiter(windowMs = 15 * 60 * 1000, max = 100) {
  const requests = new Map();
  
  return (req, res, next) => {
    const ip = req.ip || req.connection.remoteAddress;
    const now = Date.now();
    const windowStart = now - windowMs;
    
    if (requests.has(ip)) {
      const userRequests = requests.get(ip).filter(time => time > windowStart);
      requests.set(ip, userRequests);
    }
    
    const userRequests = requests.get(ip) || [];
    
    if (userRequests.length >= max) {
      return res.status(429).json({ 
        error: 'Too many requests, please try again later' 
      });
    }
    
    userRequests.push(now);
    requests.set(ip, userRequests);
    
    next();
  };
}

module.exports = {
  sanitizeInput,
  validateEmail,
  validateAmount,
  createRateLimiter
};
