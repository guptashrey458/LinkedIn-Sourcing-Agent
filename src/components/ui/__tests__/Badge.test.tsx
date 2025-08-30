import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import Badge from '../Badge';

describe('Badge', () => {
  it('renders with default props', () => {
    render(<Badge>Test Badge</Badge>);
    
    const badge = screen.getByText('Test Badge');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('bg-gray-100', 'text-gray-800');
  });

  it('renders with success variant', () => {
    render(<Badge variant="success">Success</Badge>);
    
    const badge = screen.getByText('Success');
    expect(badge).toHaveClass('bg-green-100', 'text-green-800');
  });

  it('renders with different sizes', () => {
    render(<Badge size="lg">Large Badge</Badge>);
    
    const badge = screen.getByText('Large Badge');
    expect(badge).toHaveClass('px-3', 'py-1.5', 'text-base');
  });

  it('applies custom className', () => {
    render(<Badge className="custom-class">Custom</Badge>);
    
    const badge = screen.getByText('Custom');
    expect(badge).toHaveClass('custom-class');
  });
});