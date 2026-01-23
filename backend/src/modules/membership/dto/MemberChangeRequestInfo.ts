export type MemberChangeRequestInfo = {
  requestId: number;
  membershipCode: string;
  titularSubCode: string;
  titularFullName: string;
  memberReason: string | null;
   requestState: string | null;     // ahora acepta null
  type: string | null;    
  madeByAMember: boolean;
  submissionDate: Date;
  changeStartDate: Date;
  changeEndDate: Date | null;
  resolutionDate: Date | null;
  managerNotes: string | null;
};