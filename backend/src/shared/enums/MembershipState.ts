export const membershipState = ['ENDED', 'ACTIVE', 'ON_REVISION', 'PRE_ADMITTED'] as const;
export type MembershipState = typeof membershipState[number];