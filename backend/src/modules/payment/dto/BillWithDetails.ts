import type { BillDetailInfo } from "./BillDetailInfo";

export type BillWithDetails = {
  id: number;
  finalAmount: string;
  status: string;
  description: string | null;
  createdAt: Date;
  dueDate: Date | null;
  userId: number;
  details: BillDetailInfo[];
};