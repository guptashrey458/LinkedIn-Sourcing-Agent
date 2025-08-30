import { describe, it, expect, vi } from 'vitest';
import { renderWithProviders, createUserEvent, testAccessibility } from '@/test';
import Button from '../Button';

describe('Button Component', () => {
  it('renders with default props', () => {
    const { getByRole } = renderWithProviders(<Button>Click me</Button>);
    const button = getByRole('button');
    
    expect(button).toBeInTheDocument();
    expect(button).toHaveTextContent('Click me');
    expect(button).toHaveClass('bg-blue-600'); // Primary variant default
  });

  it('renders different variants correctly', () => {
    const { rerender, getByRole } = renderWithProviders(<Button variant="secondary">Secondary</Button>);
    expect(getByRole('button')).toHaveClass('bg-gray-200');

    rerender(<Button variant="outline">Outline</Button>);
    expect(getByRole('button')).toHaveClass('border-gray-300');

    rerender(<Button variant="ghost">Ghost</Button>);
    expect(getByRole('button')).toHaveClass('hover:bg-gray-100');

    rerender(<Button variant="danger">Danger</Button>);
    expect(getByRole('button')).toHaveClass('bg-red-600');
  });

  it('renders different sizes correctly', () => {
    const { rerender, getByRole } = renderWithProviders(<Button size="sm">Small</Button>);
    expect(getByRole('button')).toHaveClass('px-3', 'py-1.5', 'text-sm');

    rerender(<Button size="md">Medium</Button>);
    expect(getByRole('button')).toHaveClass('px-4', 'py-2', 'text-sm');

    rerender(<Button size="lg">Large</Button>);
    expect(getByRole('button')).toHaveClass('px-6', 'py-3', 'text-base');
  });

  it('handles click events', async () => {
    const handleClick = vi.fn();
    const user = await createUserEvent();
    
    const { getByRole } = renderWithProviders(
      <Button onClick={handleClick}>Click me</Button>
    );
    
    await user.click(getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('shows loading state correctly', () => {
    const { getByRole } = renderWithProviders(
      <Button loading>Loading</Button>
    );
    
    const button = getByRole('button');
    expect(button).toBeDisabled();
    expect(button.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('is disabled when disabled prop is true', async () => {
    const handleClick = vi.fn();
    const user = await createUserEvent();
    
    const { getByRole } = renderWithProviders(
      <Button disabled onClick={handleClick}>Disabled</Button>
    );
    
    const button = getByRole('button');
    expect(button).toBeDisabled();
    
    await user.click(button);
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('renders with icon correctly', () => {
    const TestIcon = () => <span data-testid="test-icon">Icon</span>;
    
    const { getByTestId } = renderWithProviders(
      <Button icon={<TestIcon />}>With Icon</Button>
    );
    
    expect(getByTestId('test-icon')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { getByRole } = renderWithProviders(
      <Button className="custom-class">Custom</Button>
    );
    
    expect(getByRole('button')).toHaveClass('custom-class');
  });

  it('forwards ref correctly', () => {
    const ref = vi.fn();
    renderWithProviders(<Button ref={ref}>Ref test</Button>);
    expect(ref).toHaveBeenCalled();
  });

  it('meets accessibility standards', async () => {
    const renderResult = renderWithProviders(<Button>Accessible Button</Button>);
    await testAccessibility(renderResult);
  });

  it('supports keyboard navigation', async () => {
    const handleClick = vi.fn();
    const user = await createUserEvent();
    
    const { getByRole } = renderWithProviders(
      <Button onClick={handleClick}>Keyboard test</Button>
    );
    
    const button = getByRole('button');
    button.focus();
    expect(button).toHaveFocus();
    
    await user.keyboard('{Enter}');
    expect(handleClick).toHaveBeenCalledTimes(1);
    
    await user.keyboard(' ');
    expect(handleClick).toHaveBeenCalledTimes(2);
  });

  it('has correct ARIA attributes', () => {
    const { getByRole } = renderWithProviders(
      <Button loading aria-label="Loading button">Loading</Button>
    );
    
    const button = getByRole('button');
    expect(button).toHaveAttribute('aria-label', 'Loading button');
    expect(button).toHaveAttribute('aria-disabled', 'true');
  });
});