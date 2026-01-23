export const role = ['ADMIN', 'MEMBER', 'GUEST','EVENTS', 'SPORTS', 'MEMBERSHIP'] as const;

export type Role = typeof role[number];
