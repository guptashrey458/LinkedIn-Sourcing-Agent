import { describe, it, expect, vi } from 'vitest';
import { renderWithProviders, createUserEvent, testAccessibility } from '@/test';
import { Modal } from '../Modal';

describe('Modal Component', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    title: 'Test Modal',
    children: <div>Modal content</div>,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders when open', () => {
    const { getByRole, getByText } = renderWithProviders(<Modal {...defaultProps} />);
    
    expect(getByRole('dialog')).toBeInTheDocument();
    expect(getByText('Test Modal')).toBeInTheDocument();
    expect(getByText('Modal content')).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    const { queryByRole } = renderWithProviders(
      <Modal {...defaultProps} isOpen={false} />
    );
    
    expect(queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', async () => {
    const onClose = vi.fn();
    const user = await createUserEvent();
    
    const { getByRole } = renderWithProviders(
      <Modal {...defaultProps} onClose={onClose} />
    );
    
    const closeButton = getByRole('button', { name: /close/i });
    await user.click(closeButton);
    
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when escape key is pressed', async () => {
    const onClose = vi.fn();
    const user = await createUserEvent();
    
    renderWithProviders(<Modal {...defaultProps} onClose={onClose} />);
    
    await user.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when backdrop is clicked', async () => {
    const onClose = vi.fn();
    const user = await createUserEvent();
    
    const { getByTestId } = renderWithProviders(
      <Modal {...defaultProps} onClose={onClose} />
    );
    
    const backdrop = getByTestId('modal-backdrop');
    await user.click(backdrop);
    
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('does not close when clicking inside modal content', async () => {
    const onClose = vi.fn();
    const user = await createUserEvent();
    
    const { getByText } = renderWithProviders(
      <Modal {...defaultProps} onClose={onClose} />
    );
    
    await user.click(getByText('Modal content'));
    expect(onClose).not.toHaveBeenCalled();
  });

  it('renders different sizes correctly', () => {
    const { rerender, getByRole } = renderWithProviders(
      <Modal {...defaultProps} size="sm" />
    );
    expect(getByRole('dialog')).toHaveClass('max-w-md');

    rerender(<Modal {...defaultProps} size="md" />);
    expect(getByRole('dialog')).toHaveClass('max-w-lg');

    rerender(<Modal {...defaultProps} size="lg" />);
    expect(getByRole('dialog')).toHaveClass('max-w-2xl');

    rerender(<Modal {...defaultProps} size="xl" />);
    expect(getByRole('dialog')).toHaveClass('max-w-4xl');
  });

  it('renders with custom footer', () => {
    const footer = <button>Custom Footer</button>;
    const { getByText } = renderWithProviders(
      <Modal {...defaultProps} footer={footer} />
    );
    
    expect(getByText('Custom Footer')).toBeInTheDocument();
  });

  it('can be non-closable', async () => {
    const onClose = vi.fn();
    const user = await createUserEvent();
    
    const { queryByRole, getByTestId } = renderWithProviders(
      <Modal {...defaultProps} onClose={onClose} closable={false} />
    );
    
    // Close button should not be present
    expect(queryByRole('button', { name: /close/i })).not.toBeInTheDocument();
    
    // Escape key should not close
    await user.keyboard('{Escape}');
    expect(onClose).not.toHaveBeenCalled();
    
    // Backdrop click should not close
    const backdrop = getByTestId('modal-backdrop');
    await user.click(backdrop);
    expect(onClose).not.toHaveBeenCalled();
  });

  it('traps focus within modal', async () => {
    const user = await createUserEvent();
    
    const { getByRole } = renderWithProviders(
      <Modal {...defaultProps}>
        <input data-testid="first-input" />
        <button data-testid="middle-button">Middle</button>
        <input data-testid="last-input" />
      </Modal>
    );
    
    const dialog = getByRole('dialog');
    const firstInput = dialog.querySelector('[data-testid="first-input"]') as HTMLElement;
    const lastInput = dialog.querySelector('[data-testid="last-input"]') as HTMLElement;
    
    // Focus should start on first focusable element
    expect(document.activeElement).toBe(firstInput);
    
    // Tab to last element
    await user.tab();
    await user.tab();
    expect(document.activeElement).toBe(lastInput);
    
    // Tab from last should go to first
    await user.tab();
    expect(document.activeElement).toBe(firstInput);
  });

  it('restores focus when closed', async () => {
    const triggerButton = document.createElement('button');
    document.body.appendChild(triggerButton);
    triggerButton.focus();
    
    const { rerender } = renderWithProviders(<Modal {...defaultProps} />);
    
    // Modal should be focused
    expect(document.activeElement).not.toBe(triggerButton);
    
    // Close modal
    rerender(<Modal {...defaultProps} isOpen={false} />);
    
    // Focus should be restored
    expect(document.activeElement).toBe(triggerButton);
    
    document.body.removeChild(triggerButton);
  });

  it('has correct ARIA attributes', () => {
    const { getByRole } = renderWithProviders(
      <Modal {...defaultProps} />
    );
    
    const dialog = getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAttribute('aria-labelledby');
    expect(dialog).toHaveAttribute('role', 'dialog');
  });

  it('meets accessibility standards', async () => {
    const renderResult = renderWithProviders(<Modal {...defaultProps} />);
    await testAccessibility(renderResult);
  });

  it('prevents body scroll when open', () => {
    renderWithProviders(<Modal {...defaultProps} />);
    expect(document.body).toHaveClass('overflow-hidden');
  });

  it('restores body scroll when closed', () => {
    const { rerender } = renderWithProviders(<Modal {...defaultProps} />);
    expect(document.body).toHaveClass('overflow-hidden');
    
    rerender(<Modal {...defaultProps} isOpen={false} />);
    expect(document.body).not.toHaveClass('overflow-hidden');
  });
});