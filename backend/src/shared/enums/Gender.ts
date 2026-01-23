export const gender = ['MALE', 'FEMALE', 'OTHER'] as const;
export type Gender = typeof gender[number];