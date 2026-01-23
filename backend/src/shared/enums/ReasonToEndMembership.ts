export const reasonToEndMembership = ['SUSPENSION', 'TERMINATION', 'DISAFFILIATION'] as const;
export type ReasonToEndMembership = typeof reasonToEndMembership[number];