export declare const findById: (id: number) => Promise<{
    id: number;
    reason: string;
    submissionDate: Date | null;
    requestState: "PENDING" | "REJECTED" | "APPROVED" | null;
    idBillDetail: number | null;
}>;
