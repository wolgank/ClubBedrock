export type MemberBillInfo = {
  id: number;
  finalAmount: string;
  description: string | null;
  createdAt: Date;
  dueDate: Date | null;
  status: string;
};