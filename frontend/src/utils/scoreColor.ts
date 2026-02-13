export const getScoreColor = (score: number): string => {
  if (score > 80) return '#22c55e';
  if (score >= 50) return '#eab308';
  return '#ef4444';
};

export const formatSignedPoints = (points: number): string => {
  const rounded = Number(points.toFixed(1));
  return `${rounded > 0 ? '+' : ''}${rounded}pts`;
};
