export declare const findById: (id: number) => Promise<{
    id: number;
    memberId: number | null;
    subCodeInserted: string;
    namesAndLastNamesInserted: string;
}>;
