import { describe, it, expect } from 'vitest';

describe('Transaction Business Logic', () => {
  const calculateFee = (amount, feePercentage = 0.02) => {
    return amount * feePercentage;
  };

  const validateTransactionAmount = (amount, config) => {
    if (amount < config.minTransactionAmount) {
      return { valid: false, error: `Minimum amount is ₹${config.minTransactionAmount}` };
    }
    if (amount > config.maxTransactionLimit) {
      return { valid: false, error: `Maximum amount is ₹${config.maxTransactionLimit}` };
    }
    return { valid: true };
  };

  const calculateTotalDebit = (amount, fee) => {
    return parseFloat(amount) + parseFloat(fee);
  };

  describe('Fee Calculation', () => {
    it('should calculate 2% fee correctly', () => {
      expect(calculateFee(100)).toBe(2);
      expect(calculateFee(1000)).toBe(20);
      expect(calculateFee(5000)).toBe(100);
    });

    it('should handle decimal amounts', () => {
      expect(calculateFee(100.50)).toBeCloseTo(2.01, 2);
      expect(calculateFee(250.75)).toBeCloseTo(5.015, 3);
    });

    it('should return 0 for zero amount', () => {
      expect(calculateFee(0)).toBe(0);
    });
  });

  describe('Transaction Validation', () => {
    const config = {
      minTransactionAmount: 1,
      maxTransactionLimit: 10000,
    };

    it('should accept valid amounts', () => {
      const result = validateTransactionAmount(100, config);
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should reject amount below minimum', () => {
      const result = validateTransactionAmount(0.5, config);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Minimum');
    });

    it('should reject amount above maximum', () => {
      const result = validateTransactionAmount(15000, config);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Maximum');
    });

    it('should accept boundary values', () => {
      expect(validateTransactionAmount(1, config).valid).toBe(true);
      expect(validateTransactionAmount(10000, config).valid).toBe(true);
    });
  });

  describe('Total Debit Calculation', () => {
    it('should calculate total with fee', () => {
      expect(calculateTotalDebit(100, 2)).toBe(102);
      expect(calculateTotalDebit(1000, 20)).toBe(1020);
    });

    it('should handle string inputs', () => {
      expect(calculateTotalDebit('100', '2')).toBe(102);
      expect(calculateTotalDebit('1000.50', '20.01')).toBe(1020.51);
    });
  });
});
