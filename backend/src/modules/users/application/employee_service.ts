// services/employee_service.ts
import { db } from "../../../db";
import { employee, employeeInsertSchema, employeeSelectSchema, employeeUpdateSchema } from "../../../db/schema/Employee";
import { eq } from "drizzle-orm";

/**
 * Devuelve todos los empleados
 */
export const getAllEmployees = () => {
  return db.select().from(employee);
};

/**
 * Devuelve un empleado por su ID (que coincide con user.id), o null si no existe
 */
export const getEmployeeById = async (id: number) => {
  const [row] = await db
    .select()
    .from(employee)
    .where(eq(employee.id, id));
  return row || null;
};

/**
 * Crea un nuevo empleado (debe existir el user con el ID dado)
 */
export const createEmployee = async (data: typeof employeeInsertSchema._input) => {
  // 1) Validar y filtrar
  const parsed = employeeInsertSchema.parse(data);

  // 2) Insertar y obtener el ID (cast explícito a number[])
  const ids = await db
    .insert(employee)
    .values(parsed)
    .$returningId() as number[];

  const newId = ids[0];
  if (newId == null) {
    throw new Error("No se pudo crear el empleado");
  }

  // 3) Recuperar y retornar usando newId
  const [created] = await db
    .select()
    .from(employee)
    .where(eq(employee.id, newId));

  return created;
};


/**
 * Actualiza un empleado existente
 */
export const updateEmployee = async (
  id: number,
  data: Partial<typeof employeeUpdateSchema._input>
) => {
  // 1) Validar
  const parsed = employeeUpdateSchema.parse(data);

  // 2) Ejecutar update
  await db
    .update(employee)
    .set(parsed)
    .where(eq(employee.id, id));
};

/**
 * Elimina un empleado por su ID
 */
export const deleteEmployee = async (id: number) => {
  await db
    .delete(employee)
    .where(eq(employee.id, id));
};
