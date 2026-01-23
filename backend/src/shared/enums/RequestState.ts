export const requestState = ['PENDING', 'REJECTED', 'APPROVED'] as const;
export type RequestState= typeof requestState[number];