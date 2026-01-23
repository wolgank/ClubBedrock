export const action = ['CREATE', 'UPDATE', 'DELETE', 'LOGICAL_DELETE',"LOGIN"] as const;
export type Action = typeof action[number];