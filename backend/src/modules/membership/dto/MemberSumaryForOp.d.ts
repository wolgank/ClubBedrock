import type { DocumentType } from "../../../shared/enums/DocumentType";
export type MemberSummary = {
    membershipId: number | undefined | null;
    subCode: string | undefined | null;
    fullName: string | undefined | null;
    documentType: DocumentType | string | undefined | null;
    documentId: string | undefined | null;
    email: string | undefined | null;
};
