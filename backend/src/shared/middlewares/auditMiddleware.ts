import { logAuditory } from "../utils/logAuditory";
import { getUserIdFromRequest } from "../utils/auth";
import type { MiddlewareHandler } from "hono";
import type { Action } from "../enums/Action";

export const auditMiddleware = (
  action: Action,
  table: string,
): MiddlewareHandler => {
  return async (c, next) => {
    await next(); // ejecuta el handler primero

    try {
      const accountId = getUserIdFromRequest(c);
      const param = c.req.param("id") || c.req.param("fileName") || c.get("newRowId") || c.get("auditRowId");
      const rowId = Number(param);

      if (isNaN(rowId)) {
        console.warn("[AUDIT] No se pudo obtener un ID numérico de la ruta.");
        return;
      }

      await logAuditory({
        table,
        field: "*",
        previousValue: null,
        postValue: null,
        rowId,
        action,
        accountId,
      });
    } catch (error) {
      console.error("[AUDIT ERROR] Falló el registro de auditoría:", error);
      // ⚠️ No lanzar el error para no romper la respuesta original
    }
  };
};
