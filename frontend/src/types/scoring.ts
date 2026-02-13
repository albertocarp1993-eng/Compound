export type MoatRating = 'WIDE' | 'NARROW' | 'NONE';

export type ScoreBreakdownItem = {
  metric: string;
  value: string;
  points: number;
  reason: string;
};
