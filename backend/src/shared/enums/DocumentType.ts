export const documentType = ['DNI', 'CE', 'PASSPORT'] as const;
export type DocumentType = typeof documentType[number];