// controllers/employee_controller.ts
import type { Context } from "hono";
import * as employeeService from "../../application/employee_service";
import { employeeInsertSchema, employeeUpdateSchema } from "../../../../db/schema/Employee";

export const getAll = async (c: Context) => {
  const list = await employeeService.getAllEmployees();
  return c.json(list);
};

export const getOne = async (c: Context) => {
  const id = Number(c.req.param("id"));
  const item = await employeeService.getEmployeeById(id);
  if (!item) return c.notFound();
  return c.json(item);
};

export const create = async (c: Context) => {
  const body = await c.req.json();
  const parsed = employeeInsertSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: parsed.error.flatten() }, 400);
  }
  const created = await employeeService.createEmployee(parsed.data);
  return c.json(created, 201);
};

export const update = async (c: Context) => {
  const id = Number(c.req.param("id"));
  const body = await c.req.json();
  const parsed = employeeUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: parsed.error.flatten() }, 400);
  }
  await employeeService.updateEmployee(id, parsed.data);
  return c.body(null, 204);
};

export const remove = async (c: Context) => {
  const id = Number(c.req.param("id"));
  await employeeService.deleteEmployee(id);
  return c.body(null, 204);
};
