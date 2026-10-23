import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { Card } from './Card';

describe('Card Component', () => {
  it('renders children content', () => {
    render(<Card><span>Card Body Content</span></Card>);
    expect(screen.getByText('Card Body Content')).toBeInTheDocument();
  });

  it('applies elevated classes when elevated is true', () => {
    const { container } = render(<Card elevated><span>Elevated Card</span></Card>);
    expect(container.firstChild).toHaveClass('shadow-md');
  });
});
