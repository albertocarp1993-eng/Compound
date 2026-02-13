import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import StockCard from './StockCard';

describe('StockCard', () => {
  it('renders snowball score and breakdown rows', () => {
    render(
      <StockCard
        symbol="AAPL"
        name="Apple Inc."
        price={189.5}
        score={86}
        moatRating="WIDE"
        breakdown={[
          {
            metric: 'Moat',
            value: 'WIDE',
            points: 20,
            reason: 'Durable edge',
          },
          {
            metric: 'Valuation (P/E)',
            value: '28.00',
            points: -2,
            reason: 'Expensive',
          },
        ]}
      />,
    );

    expect(screen.getByText('Apple Inc.')).toBeInTheDocument();
    expect(screen.getByText('86')).toBeInTheDocument();
    expect(screen.getByText('Score Breakdown')).toBeInTheDocument();
    expect(screen.getByText('Moat')).toBeInTheDocument();
    expect(screen.getByText('+20pts')).toBeInTheDocument();
    expect(screen.getByText('-2pts')).toBeInTheDocument();
  });
});
