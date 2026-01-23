import type { DocumentType } from "../../../shared/enums/DocumentType";

export type MemberSummary = {
  membershipId: number| undefined| null ;
  subCode: string | undefined| null ;
  fullName: string | undefined| null ;
  documentType: DocumentType | string | undefined  | null  ;
  documentId: string| undefined| null ;
  email: string| undefined| null ;
};

export type OtherMemberSummary = {
  membershipId: number| undefined| null ;
  code: string | undefined| null ;
  subCode: string | undefined| null ;
  name: string | undefined| null ;
  lastname: string | undefined| null ;
  documentType: DocumentType | string | undefined  | null  ;
  documentId: string| undefined| null ;
  email: string| undefined| null ;
};