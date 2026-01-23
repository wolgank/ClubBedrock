export const debtStatus = ['PENDING', 'PAID', 'OVERDUE', 'CANCELLED'] as const;
export type DebtStatus = typeof debtStatus[number];