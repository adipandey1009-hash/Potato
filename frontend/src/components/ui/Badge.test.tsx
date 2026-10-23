import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { Badge } from './Badge';

describe('Badge Component', () => {
  it('renders EXPRESS PRIORITY badge with rank 1 styling', () => {
    render(<Badge priority="EXPRESS" />);
    expect(screen.getByText(/EXPRESS PRIORITY/i)).toBeInTheDocument();
  });

  it('renders REGULAR (FIFO) badge', () => {
    render(<Badge priority="REGULAR" />);
    expect(screen.getByText(/REGULAR \(FIFO\)/i)).toBeInTheDocument();
  });

  it('renders status badges with appropriate labels', () => {
    render(<Badge status="QUEUED" />);
    expect(screen.getByText('QUEUED')).toBeInTheDocument();
  });
});
