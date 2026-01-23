import { Hono } from "hono";
import * as ctrl from "../controllers/member_type_controller";
import { authMiddleware } from "../../../../shared/middlewares/authMiddleware";

const router = new Hono()

  .get("/by-name-containing", authMiddleware, ctrl.getOneByNameContaining)
  .get("/family-config", authMiddleware, ctrl.getFamilyConfig)
  .get("/:id/document-formats",authMiddleware,ctrl.getDocumentFormatsByMemberType)
  .post("/with-docs", authMiddleware, ctrl.createWithDocumentFormats)
  .put("/with-docs/:id", authMiddleware, ctrl.updateWithDocumentFormats)
  .get("/", authMiddleware, ctrl.getAll)
  .get("/:id", authMiddleware, ctrl.getOne)
  .post("/", authMiddleware, ctrl.create)
  .put("/:id", authMiddleware, ctrl.update)
  .delete("/:id", authMiddleware, ctrl.remove);
export default router;
