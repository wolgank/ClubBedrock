// src/utils/logAuditory.ts
import { db } from '../../db';
import { auditory } from '../../db/schema/Auditory';
import type { Action } from '../enums/Action'; // Asegúrate de importar Action como TYPE, no enum

export async function logAuditory({
  table,
  field,
  previousValue,
  postValue,
  rowId,
  action,
  accountId,
}: {
  table: string;
  field: string;
  previousValue?: string | null;
  postValue?: string | null;
  rowId: number;
  action: Action;
  accountId: number;
}) {
  try {
    const limaDate = new Date();
    limaDate.setHours(limaDate.getHours() - 5); // Ajusta a UTC-5

    await db.insert(auditory).values({
      tableChanged: table,
      fieldChanged: field,
      previousValue,
      postValue,
      idRowModifiedOrCreated: rowId,
      dateHour: limaDate,
      action,
      accountId,
    });
  } catch (err) {
    console.error("[DB AUDIT ERROR]", err);
    throw err; // opcional: puedes omitir esto si no quieres que rompa
  }
}
