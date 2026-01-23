export const paymentMethod = ['CASH', 'CREDIT_CARD', 'DEBIT_CARD', 'BANK_TRANSFER', 'OTHER'] as const;
export type PaymentMethod = typeof paymentMethod[number];