export type BillDetailInfo = {
  id: number;
  price: string;
  discount: string | null;
  finalPrice: string;
  description: string | null;
};