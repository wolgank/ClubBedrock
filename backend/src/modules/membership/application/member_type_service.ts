// application/member_type_service.ts
import { z } from "zod";
import { db } from "../../../db";
import { documentFormat } from "../../../db/schema/DocumentFormat";
import { memberType } from "../../../db/schema/MemberType";
import {
  memberTypeInsertSchema,
 // memberTypeSelectSchema,
  memberTypeUpdateSchema,
} from "../../../db/schema/MemberType";
import { and, eq, isNull, ne, or,like, sql } from "drizzle-orm";

export const getFamilyConfig = async () => {
  const member_type = await db.select().from(memberType).where(and(or(eq(memberType.active, true), isNull(memberType.active)),ne(memberType.id, 1))); // para no romper lo que había antes, o sea sin columna activo
  const documents = await db
    .select()
    .from(documentFormat)
    .where(or(eq(documentFormat.active, true), isNull(documentFormat.active)));
  const familyConfig = member_type.map((member) => ({
    id: member.id,
    name: member.name,
    description: member.description,
    inclusionCost: member.inclusionCost,
    exclusionCost: member.exclusionCost,
    costInMembershipFee: member.costInMembershipFee,
    documentosSolicitados: documents
      .filter((doc) => doc.memberTypeForDocument === member.id)
      .map((doc) => ({
        id: doc.id,
        nombre: doc.name,
        descripcion: doc.description,
      })),
  }));
  return familyConfig;
}

export const getAllMemberTypes = () =>
  db.select().from(memberType).where(or(eq(memberType.active,true), isNull(memberType.active) ) ); // para no romper lo que había antes, o sea sin columna activo

export const getMemberTypeById = (id: number) =>
  db
    .select()
    .from(memberType)
    .where(eq(memberType.id, id))
    .then((rows) => rows[0] || null);



export const createMemberType = async (data: typeof memberTypeInsertSchema._input) => {
  // valida y filtra según Zod
  const parsed = memberTypeInsertSchema.parse(data);
  parsed.active=true;
  // inserta y devuelve el objeto completo
  const newId = await db
    .insert(memberType)
    .values(parsed)
    .$returningId()
    .then((res) => res[0]);
    if (!newId?.id) {
        throw new Error("Failed to retrieve the inserted event ID.");
      }
  const [created] = await db
    .select()
    .from(memberType)
    .where(eq(memberType.id, newId.id));
  return created;
};

export const updateMemberType = async (
  id: number,
  data: Partial<typeof memberTypeUpdateSchema._input>
) => {
  const parsed = memberTypeUpdateSchema.parse(data);
  await db
    .update(memberType)
    .set(parsed)
    .where(eq(memberType.id, id));
};

export const deleteMemberType = (id: number) =>
  db
    .update(memberType)
    .set({active:false})
    .where(eq(memberType.id, id));


export type DocumentFormatRow = {
  id: number;
  isForInclusion: boolean;
  name: string;
  description: string;
  memberTypeForDocument: number;
};


/**
 * Devuelve todos los DocumentFormat asociados al MemberType dado.
 *
 * @param memberTypeId  ID del MemberType
 * @returns             Array de objetos con todos los campos de DocumentFormat
 */
export async function getDocumentFormatsByMemberType(
  memberTypeId: number
): Promise<DocumentFormatRow[]> {
  return await db
    .select({
      id:                   documentFormat.id,
      isForInclusion:       documentFormat.isForInclusion,
      name:                 documentFormat.name,
      description:          documentFormat.description,
      memberTypeForDocument: documentFormat.memberTypeForDocument,
    })
    .from(documentFormat)
    .where(
      and(
      eq(documentFormat.memberTypeForDocument, memberTypeId), or (eq(documentFormat.active,true),sql`${documentFormat.active} IS NULL`))
    );
}

// Extend the insert schema to include nested document formats
const MemberTypeWithFormatsSchema = z.object({
  // memberType fields
  name: memberTypeInsertSchema.shape.name,
  description: memberTypeInsertSchema.shape.description,
  inclusionCost: memberTypeInsertSchema.shape.inclusionCost,
  exclusionCost: memberTypeInsertSchema.shape.exclusionCost,
  canPayAndRegister: memberTypeInsertSchema.shape.canPayAndRegister,
  costInMembershipFee: memberTypeInsertSchema.shape.costInMembershipFee,
  // active: memberTypeInsertSchema.shape.active,
  // nested formats
  documentFormats: z
    .array(
      z.object({
        isForInclusion: z.boolean(),
        name: z.string().min(1).max(50),
        description: z.string().min(1).max(50),
      })
    )
    .min(0),
});
export type MemberTypeWithFormatsInput = z.infer<
  typeof MemberTypeWithFormatsSchema
>;

/**
 * Crea un MemberType junto con sus DocumentFormats asociados.
 *
 * @param data  Datos del MemberType y array de DocumentFormats.
 * @returns     El ID del nuevo MemberType.
 */
export async function createMemberTypeWithDocumentFormats(
  data: MemberTypeWithFormatsInput
): Promise<{ memberTypeId: number }> {
  const data2 = {...data, active:true};
  const parsed = MemberTypeWithFormatsSchema.parse(data2);
  
  return await db.transaction(async (tx) => {
    // 1) Insertar MemberType
    const mtDto = {
      name: parsed.name,
      description: parsed.description,
      inclusionCost: parsed.inclusionCost,
      exclusionCost: parsed.exclusionCost,
      canPayAndRegister: parsed.canPayAndRegister,
      costInMembershipFee: parsed.costInMembershipFee,
      active: true,
    };
    const [mtRec] = await tx
      .insert(memberType)
      .values(mtDto)
      .$returningId();
    if (!mtRec) {
      throw new Error("No se pudo crear el MemberType");
    }
    const memberTypeId = mtRec.id;

    // 2) Insertar cada DocumentFormat con FK al memberType recién creado
    for (const fmt of parsed.documentFormats) {
      await tx.insert(documentFormat).values({
        isForInclusion: fmt.isForInclusion,
        name: fmt.name,
        description: fmt.description,
        memberTypeForDocument: memberTypeId,
        active: true,
      });
    }

    return { memberTypeId };
  });
}
/**
 * Actualiza un MemberType y reemplaza sus DocumentFormats asociados.
 *
 * @param id    ID del MemberType a actualizar.
 * @param data  Nuevos datos del MemberType y array de DocumentFormats.
 */
export async function updateMemberTypeWithDocumentFormats(
  id: number,
  data: MemberTypeWithFormatsInput
): Promise<{ memberTypeId: number }> {
const data2 = {...data, active:true};
  const parsed = MemberTypeWithFormatsSchema.parse(data2);
  
  return await db.transaction(async (tx) => {
    // 1) Verificar existencia
    const [existing] = await tx
      .select()
      .from(memberType)
      .where(eq(memberType.id, id));
    if (!existing) {
      throw new Error("MemberType no encontrado");
    }
    if(  existing.name.toUpperCase()  === "TITULAR"){
      // el existente titular no puede cambiar, el parseado mantendrá el nombre
      parsed.name="TITULAR";
    }
    if(  existing.name.toUpperCase()  === "CÓNYUGUE"){
      parsed.name="CÓNYUGUE";
    }

    if(existing)
    // 2) Actualizar MemberType
    await tx
      .update(memberType)
      .set({
        name: parsed.name,
        description: parsed.description,
        inclusionCost: parsed.inclusionCost,
        exclusionCost: parsed.exclusionCost,
        canPayAndRegister: parsed.canPayAndRegister,
        costInMembershipFee: parsed.costInMembershipFee,
        //active: parsed.active
      })
      .where(eq(memberType.id, id));
      //console.log("intentando act documentos viejos ",documentFormat.memberTypeForDocument );
    // 3) updatear DocumentFormats antiguos con borrado logico
    await tx.update(documentFormat).set({active:false}).where(
      eq(documentFormat.memberTypeForDocument, id)
    );
      //console.log("intentando nuevos documentos ",parsed.documentFormats);
    // 4) Insertar nuevos DocumentFormats
    for (const fmt of parsed.documentFormats) {
      await tx.insert(documentFormat).values({
        isForInclusion: fmt.isForInclusion,
        name: fmt.name,
        description: fmt.description,
        memberTypeForDocument: id,
        active: true,
      });
    }

    return { memberTypeId: id };
  });
}

export const getMemberTypeByNameContaining = (nameLike: string) =>
  db
    .select()
    .from(memberType)
    .where(like(memberType.name, "%"+nameLike+"%"))
    .then((rows) => rows[0] || null);

