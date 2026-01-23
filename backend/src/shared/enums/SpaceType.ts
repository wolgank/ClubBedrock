export const spaceType = ['LEISURE', 'SPORTS'] as const;

export type SpaceType = typeof spaceType[number];
