// services/event_service.ts
import { db } from "../../../db";
import { inscriptionXUser as inscriptionXUserTable, inscriptionXUserInsertSchema } from "../../../db/schema/InscriptionXUser";
import { eq } from "drizzle-orm";

export const getAllInscriptionUser = () => db.select().from(inscriptionXUserTable);

export const getInscriptionUserById = (id: number) =>
  db
    .select()
    .from(inscriptionXUserTable)
    .where(eq(inscriptionXUserTable.id, id))
    .then((res) => res[0]);

export const createInscriptionXUser = async (data: typeof inscriptionXUserInsertSchema._input) => {
  const { id, ...insertData } = data as any; // Omit 'id' if it's auto-incremented
  const insertId = await db
    .insert(inscriptionXUserTable)
    .values(insertData)
    .$returningId()
    .then((res) => res[0]);
};

export const updateInscriptionXUser = async (
  id: number,
  data: Partial<typeof inscriptionXUserInsertSchema._input>
) => {

  await db
    .update(inscriptionXUserTable)
    .set(
      {
        ...data,
      }
    )
    .where(eq(inscriptionXUserTable.id, id));

  const updatedInscriptionXUser = await db
    .select()
    .from(inscriptionXUserTable)
    .where(eq(inscriptionXUserTable.id, id));
  if (!updatedInscriptionXUser.length) {
    throw new Error("Failed to update the inscriptionXUserTable.");
  }

  return updatedInscriptionXUser[0];
};

export const deleteInscriptionXUser = (id: number) =>
  db.update(inscriptionXUserTable)
    .set({ isCancelled: true })
    .where(eq(inscriptionXUserTable.id, id));
