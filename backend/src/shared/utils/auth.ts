// src/shared/utils/auth.ts
import type { Context } from "hono";

export function getUserIdFromRequest(c: Context): number {
  const account = c.get("account");
  if (!account || typeof account.sub !== "number") {
    throw new Error("Usuario no autenticado o sub inválido");
  }
  return account.sub; // ← usar `sub` (subject) del JWT
}
