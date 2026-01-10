import { describe, it, expect } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { ToastProvider, useToast } from '../contexts/ToastContext';

const ToastConsumer = () => {
  const { showToast } = useToast();
  return (
    <button onClick={() => showToast('Test message', 'success')}>
      Show Toast
    </button>
  );
};

describe('ToastContext', () => {
  it('displays toast message when triggered', async () => {
    render(
      <ToastProvider>
        <ToastConsumer />
      </ToastProvider>
    );
    
    const button = screen.getByText('Show Toast');
    button.click();
    
    await waitFor(() => {
      expect(screen.getByText('Test message')).toBeInTheDocument();
    });
  });

  it('limits toasts to maximum of 2', async () => {
    const MultiToast = () => {
      const { showToast } = useToast();
      return (
        <div>
          <button onClick={() => showToast('Toast 1', 'info')}>T1</button>
          <button onClick={() => showToast('Toast 2', 'info')}>T2</button>
          <button onClick={() => showToast('Toast 3', 'info')}>T3</button>
        </div>
      );
    };

    render(
      <ToastProvider>
        <MultiToast />
      </ToastProvider>
    );
    
    screen.getByText('T1').click();
    screen.getByText('T2').click();
    screen.getByText('T3').click();
    
    await waitFor(() => {
      expect(screen.queryByText('Toast 1')).not.toBeInTheDocument();
      expect(screen.getByText('Toast 2')).toBeInTheDocument();
      expect(screen.getByText('Toast 3')).toBeInTheDocument();
    });
  });
});
