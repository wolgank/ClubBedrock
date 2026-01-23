export const academyCourseType = ['FIXED', 'FLEXIBLE'] as const;

export type AcademyCourseType = typeof academyCourseType[number];
