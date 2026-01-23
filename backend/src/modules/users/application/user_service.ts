// application/user_service.ts
import { db } from "../../../db";
import { auth } from "../../../db/schema/Auth";
import { membershipApplication } from "../../../db/schema/MembershipApplication";
import { user, userInsertSchema, userSelectSchema, userUpdateSchema } from "../../../db/schema/User";
import { eq } from "drizzle-orm";
import ExcelJS from 'exceljs';
import {  loadMembershipsAndMembers, type RawMember } from '../domain/bulkLoaders';
import { validateMembershipsSheet, validateMembersSheet } from "../domain/excelValidators";

/**
 * Devuelve todos los usuarios
 */

export const getAllUsers = () => {
  return db.select().from(user);
};

/**
 * Devuelve un usuario por su ID, o null si no existe
 */
export const getUserById = async (id: number) => {
  const [row] = await db
    .select()
    .from(user)
    .where(eq(user.id, id));
  return row || null;
};

/**
 * Crea un nuevo usuario
 */
export const createUser = async (data: typeof userInsertSchema._input) => {
  // 1) Validar y filtrar con Zod
  const parsed = userInsertSchema.parse(data);

  // 2) Insertar y obtener el nuevo ID
  const [newId] = await db
    .insert(user)
    .values(parsed)
    .$returningId();

  if (!newId) {
    throw new Error("No se pudo crear el usuario");
  }

  // 3) Recuperar y retornar el registro completo
  const [created] = await db
    .select()
    .from(user)
    .where(eq(user.id, newId.id));
  return created;
};

/**
 * Actualiza un usuario existente
 */
export const updateUser = async (
  id: number,
  data: Partial<typeof userUpdateSchema._input>
) => {
  // 1) Validar cambios permitidos
  const parsed = userUpdateSchema.parse(data);

  // 2) Ejecutar update
  await db
    .update(user)
    .set(parsed)
    .where(eq(user.id, id));
};

/**
 * Elimina un usuario por su ID
 */
export const deleteUser = async (id: number) => {
  await db
    .delete(user)
    .where(eq(user.id, id));
};


export interface AuthPlusUser {
  auth: {
    id: number;
    email: string;
    username: string;
    role: string;
    isActive: boolean;
    oauthProvider: string | null;
    googleId: string | null;
  };
  user: {
    id: number;
    name: string | null;
    lastname: string | null;
    documentType: string | null;
    documentID: string | null;
    phoneNumber: string | null;
    birthDate: Date | null;
    gender: string | null;
    address: string | null;
    profilePictureURL: string | null;
  } | null | undefined;
}

/**
 * Busca el registro de auth y el user asociado (si existe)
 * para una solicitud de membresía dada.
 */
export async function getAuthAndUserByMembershipApplication(
  applicationId: number
): Promise<AuthPlusUser | null> {
  const row = await db
    .select({
      authId: auth.id,
      email: auth.email,
      username: auth.username,
      role: auth.role,
      isActive: auth.isActive,
      oauthProvider: auth.oauthProvider,
      googleId: auth.googleId,

      userId: user.id,
      name: user.name,
      lastname: user.lastname,
      documentType: user.documentType,
      documentID: user.documentID,
      phoneNumber: user.phoneNumber,
      birthDate: user.birthDate,
      gender: user.gender,
      address: user.address,
      profilePictureURL: user.profilePictureURL,
    })
    .from(membershipApplication)
    // Inner join a auth en accountID
    .innerJoin(
      auth,
      eq (auth.id,membershipApplication.accountID)
    )
    // Left join a user en accountID para obtener perfil si existe
    .leftJoin(
      user,
      eq(user.accountID,auth.id)
    )
    .where( eq(membershipApplication.id,applicationId))
    .then((rows) => rows[0] || null);

  if (!row) return null;

  return {
    auth: {
      id: row.authId,
      email: row.email,
      username: row.username,
      role: row.role,
      isActive: row.isActive,
      oauthProvider: row.oauthProvider,
      googleId: row.googleId,
    },
    user: row.userId
      ? {
          id: row.userId,
          name: row.name,
          lastname: row.lastname,
          documentType: row.documentType,
          documentID: row.documentID,
          phoneNumber: row.phoneNumber,
          birthDate: row.birthDate,
          gender: row.gender,
          address: row.address,
          profilePictureURL: row.profilePictureURL,
        }
      : null,
  };
}

export async function bulkUploadUsers(arrayBuffer: ArrayBuffer) {
  const workbook = new ExcelJS.Workbook();

  // Cargar directamente el ArrayBuffer (ExcelJS soporta ArrayBuffer nativo)
  await workbook.xlsx.load(arrayBuffer);

  // HOJA "Membresías"
  const membSheet = workbook.getWorksheet('Membresías');
  if (!membSheet) throw new Error('Falta hoja "Membresías"');
  validateMembershipsSheet(membSheet);
  const membershipsData = (membSheet.getRows(2, membSheet.rowCount - 1) ?? [])
    .map(row => ({
      code:  String(row.getCell(1).value ?? '').trim(),
      state: String(row.getCell(2).value ?? '').trim(),
      endDate: row.getCell(3).value as (string | Date) | undefined,
    }));

  // HOJA "Miembros"
  const membsSheet = workbook.getWorksheet('Miembros');
  if (!membsSheet) throw new Error('Falta hoja "Miembros"');
  validateMembersSheet(membsSheet);

  // Recorremos fila a fila, ignorando la cabecera y aquellas sin email válido
  const membersData: RawMember[] = [];
  membsSheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    if (rowNumber === 1) return; // saltar encabezados

    // Extraer email de forma robusta
    const rawEmail = row.getCell(1).value;
    let email = '';
    if (typeof rawEmail === 'string') {
      email = rawEmail.trim();
    } else if (
      rawEmail != null &&
      typeof rawEmail === 'object' &&
      'text' in rawEmail &&
      typeof (rawEmail as any).text === 'string'
    ) {
      email = (rawEmail as any).text.trim();
    }
    // si tras normalizar está vacío, ignoramos la fila
    if (!email) return;

    membersData.push({
      email,
      firstName:       String(row.getCell(2).value ?? '').trim(),
      lastName:        String(row.getCell(3).value ?? '').trim(),
      documentType:    String(row.getCell(4).value ?? '').trim(),
      documentNumber:  String(row.getCell(5).value ?? '').trim(),
      phone:           String(row.getCell(6).value ?? '').trim(),
      birthDate: (() => {
    const v = row.getCell(7).value;
    return v instanceof Date ? v : String(v ?? '').trim();
  })(),
      gender:          String(row.getCell(8).value ?? '').trim(),
      address:         String(row.getCell(9).value ?? '').trim(),
      role:            String(row.getCell(10).value ?? '').trim(),
      membershipCode:  String(row.getCell(11).value ?? '').trim(),
      memberSubCode: row.getCell(12).value
        ? String(row.getCell(12).value).trim()
        : undefined,
    });
  });

  // Orquestar ambas cargas y recoger warnings
  const { warnings } = await loadMembershipsAndMembers(membershipsData, membersData);
  return warnings;
}
