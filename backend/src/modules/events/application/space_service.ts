import { db } from "../../../db";
import { space} from "../../../db/schema/Space";
import { createSpaceSchema} from "../../events/domain/space"
import type { CreateSpace } from "../../events/domain/space";
import { eq } from "drizzle-orm";


export const getAllSpaces = () => db.select().from(space);

export const getSpaceById = (id: number) =>
    db
      .select()
      .from(space)
      .where(eq(space.id, id))
      .then((res) => res[0]);
  
  export const createSpace = async (data: CreateSpace) => {
    // Validar con Zod
    const parsedData = createSpaceSchema.parse(data);
  
    // Insertar en la base de datos
    const insertId = await db
      .insert(space)
      .values(parsedData)
      .$returningId()
      .then((res) => res[0]);
  
    if (!insertId) {
      throw new Error("No se pudo obtener el ID de la reserva creada.");
    }
  
    const [createdSpace] = await db
      .select()
      .from(space)
      .where(eq(space.id, insertId.id));
  
    return createdSpace;
  };


  export const updateSpace = async (
    id: number,
    data: Partial<CreateSpace>
  ) => {
    await db
      .update(space)
      .set(data)
      .where(eq(space.id, id));
  
    const updated = await db
      .select()
      .from(space)
      .where(eq(space.id, id));
  
    if (!updated.length) {
      throw new Error("Espacio no encontrado para actualizar.");
    }
  
    return updated[0];
  };
  
    
  export const updateSpaceAvailability = (id: number, isAvailable: boolean) =>
    db.update(space)
      .set({ isAvailable: isAvailable })
      .where(eq(space.id, id));
  