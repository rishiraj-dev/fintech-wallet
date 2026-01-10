import { describe, it, expect } from 'vitest';
import { sanitizeInput, validateEmail, validateAmount, createRateLimiter } from '../middlewares/sanitization.js';

describe('Input Sanitization Middleware', () => {
  it('should trim whitespace from strings', () => {
    const req = {
      body: { name: '  John Doe  ', email: ' test@example.com ' }
    };
    const res = {};
    const next = () => {};

    sanitizeInput(req, res, next);

    expect(req.body.name).toBe('John Doe');
    expect(req.body.email).toBe('test@example.com');
  });

  it('should escape HTML in name field but not email', () => {
    const req = {
      body: { 
        name: '<script>alert("xss")</script>',
        email: 'test@example.com'
      }
    };
    const res = {};
    const next = () => {};

    sanitizeInput(req, res, next);

    expect(req.body.name).toContain('&lt;');
    expect(req.body.name).toContain('&gt;');
    
    expect(req.body.email).toBe('test@example.com');
  });

  it('should not escape email field to preserve @ symbol', () => {
    const req = {
      body: { email: 'user@example.com' }
    };
    const res = {};
    const next = () => {};

    sanitizeInput(req, res, next);

    expect(req.body.email).toBe('user@example.com');
    expect(req.body.email).not.toContain('&commat;');
  });

  it('should not escape password field', () => {
    const req = {
      body: { password: 'P@ssw0rd!123' }
    };
    const res = {};
    const next = () => {};

    sanitizeInput(req, res, next);

    expect(req.body.password).toBe('P@ssw0rd!123');
  });

  it('should not escape amount field', () => {
    const req = {
      body: { amount: '100.50' }
    };
    const res = {};
    const next = () => {};

    sanitizeInput(req, res, next);

    expect(req.body.amount).toBe('100.50');
  });
});

describe('Email Validation', () => {
  it('should validate correct email', () => {
    expect(validateEmail('test@example.com')).toBe(true);
    expect(validateEmail('user.name+tag@example.co.uk')).toBe(true);
  });

  it('should reject invalid email', () => {
    expect(validateEmail('invalid')).toBe(false);
    expect(validateEmail('test@')).toBe(false);
    expect(validateEmail('@example.com')).toBe(false);
    expect(validateEmail('test @example.com')).toBe(false);
  });
});

describe('Amount Validation', () => {
  it('should validate positive numbers', () => {
    expect(validateAmount(100)).toBe(true);
    expect(validateAmount(0.01)).toBe(true);
    expect(validateAmount('50.50')).toBe(true);
  });

  it('should reject invalid amounts', () => {
    expect(validateAmount(0)).toBe(false);
    expect(validateAmount(-10)).toBe(false);
    expect(validateAmount('abc')).toBe(false);
    expect(validateAmount(Infinity)).toBe(false);
    expect(validateAmount(NaN)).toBe(false);
  });
});

describe('Rate Limiting', () => {
  it('should allow requests within limit', () => {
    const rateLimiter = createRateLimiter(1000, 3);
    const req = { ip: '127.0.0.1' };
    let statusCode = 200;
    const res = {
      status: (code) => {
        statusCode = code;
        return { json: () => {} };
      }
    };
    let nextCalled = 0;
    const next = () => { nextCalled++; };

    rateLimiter(req, res, next);
    rateLimiter(req, res, next);
    rateLimiter(req, res, next);

    expect(nextCalled).toBe(3);
    expect(statusCode).toBe(200);
  });

  it('should block requests exceeding limit', () => {
    const rateLimiter = createRateLimiter(1000, 2);
    const req = { ip: '192.168.1.1' };
    let statusCode = 200;
    const res = {
      status: (code) => {
        statusCode = code;
        return { json: () => {} };
      }
    };
    let nextCalled = 0;
    const next = () => { nextCalled++; };

    rateLimiter(req, res, next);
    rateLimiter(req, res, next);
    rateLimiter(req, res, next);

    expect(nextCalled).toBe(2);
    expect(statusCode).toBe(429);
  });

  it('should reset after time window', async () => {
    const rateLimiter = createRateLimiter(100, 2);
    const req = { ip: '10.0.0.1' };
    let nextCalled = 0;
    const res = {
      status: () => ({ json: () => {} })
    };
    const next = () => { nextCalled++; };

    rateLimiter(req, res, next);
    rateLimiter(req, res, next);

    await new Promise(resolve => setTimeout(resolve, 150));

    rateLimiter(req, res, next);

    expect(nextCalled).toBe(3);
  });
});
