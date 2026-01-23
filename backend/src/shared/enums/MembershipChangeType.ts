export const membershipChangeType = ['SUSPENSION', 'DISAFFILIATION'] as const;
export type MembershipChangeType = typeof membershipChangeType[number];