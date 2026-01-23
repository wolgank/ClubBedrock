// services/event_service.ts
import { db } from "../../../db";
import { billDetail as billDetailTable, billDetailInsertSchema, billDetail } from "../../../db/schema/BillDetail";
import { eq } from "drizzle-orm";

export const getAllBillDetail = () => db.select().from(billDetailTable);

export const getBillDetailById = (id: number) =>
  db
    .select()
    .from(billDetailTable)
    .where(eq(billDetailTable.id, id))
    .then((res) => res[0]);

export const createBillDetail = async (data: typeof billDetailInsertSchema._input) => {
  const insertId = await db
    .insert(billDetailTable)
    .values({
      ...data,
      price: String(data.price),
      finalPrice: String(data.finalPrice),
      discount: data.discount !== undefined ? String(data.discount) : undefined,
    })
    .$returningId()
    .then((res) => res[0]);

  if (!insertId?.id) {
    throw new Error("Failed to retrieve the inserted billDetailTable ID.");
  }
  const [createdBillDetail] = await db
    .select()
    .from(billDetailTable)
    .where(eq(billDetailTable.id, insertId.id));
  return createBillDetail;
};

export const updateBillDetail = async (
  id: number,
  data: Partial<typeof billDetailInsertSchema._input>
) => {

  await db
    .update(billDetailTable)
    .set(
      {
        ...data,
        price: data.price !== undefined ? String(data.price) : undefined,
        finalPrice: data.finalPrice !== undefined ? String(data.finalPrice) : undefined,
        discount: data.discount !== undefined ? String(data.discount) : undefined,
      }
    )
    .where(eq(billDetailTable.id, id));

  const updatedBillDetailTable = await db
    .select()
    .from(billDetailTable)
    .where(eq(billDetailTable.id, id));
  if (!updatedBillDetailTable.length) {
    throw new Error("Failed to update the billDetailTable.");
  }

  return updatedBillDetailTable[0];
};

export const deleteBillDetail = (id: number) =>
  db.delete(billDetailTable).where(eq(billDetailTable.id, id));

export type BillDetailInfo = {
  id: number;
  billId: number;
  price: string;
  discount: string | null;
  finalPrice: string;
  description: string | null;
};

/**
 * Devuelve todos los detalles (bill_detail) de un Bill.
 */
export async function getDetailsFromBill(
  billId: number
): Promise<BillDetailInfo[]> {
  return await db
    .select({
      id:          billDetail.id,
      billId:      billDetail.billId,
      price:       billDetail.price,
      discount:    billDetail.discount,
      finalPrice:  billDetail.finalPrice,
      description: billDetail.description,
    })
    .from(billDetail)
    .where(eq(billDetail.billId, billId));
}