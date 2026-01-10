import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TransactionCard } from '../components/TransactionCard';

describe('TransactionCard Component', () => {
  const mockTransaction = {
    id: '1',
    type: 'CREDIT',
    amount: '100.00',
    fee: '2.00',
    description: 'Test Transaction',
    date: new Date('2026-01-10T10:00:00Z'),
  };

  it('renders transaction details', () => {
    render(<TransactionCard transaction={mockTransaction} />);
    expect(screen.getByText('Test Transaction')).toBeInTheDocument();
  });

  it('displays credit amount with plus sign', () => {
    render(<TransactionCard transaction={mockTransaction} />);
    expect(screen.getByText(/\+₹100\.00/)).toBeInTheDocument();
  });

  it('displays debit amount with minus sign', () => {
    const debitTransaction = { ...mockTransaction, type: 'DEBIT' };
    render(<TransactionCard transaction={debitTransaction} />);
    expect(screen.getByText(/-₹100\.00/)).toBeInTheDocument();
  });

  it('shows fee when present', () => {
    render(<TransactionCard transaction={mockTransaction} />);
    expect(screen.getByText(/Fee: ₹2\.00/i)).toBeInTheDocument();
  });

  it('uses green color for credit transactions', () => {
    render(<TransactionCard transaction={mockTransaction} />);
    const amountElement = screen.getByText(/\+₹100\.00/);
    expect(amountElement).toHaveClass('text-green-600');
  });
});
