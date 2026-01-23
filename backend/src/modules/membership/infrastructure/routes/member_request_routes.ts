// routes/member_request_routes.ts
import { Hono } from "hono";
import * as ctrl from "../controllers/member_request_controller";
import { authMiddleware } from "../../../../shared/middlewares/authMiddleware";
import { createMultiple, listByMemberRequest } from "../controllers/member_attached_document_controller";

const router = new Hono()



.get("/family-all-manager", authMiddleware, ctrl.listFamiliarsForManager)
.get("/family", authMiddleware, ctrl.listFamilyRequests)
.post("/excludeFamiliar", authMiddleware, ctrl.createExclusion)

.post(
  '/:id/documents',authMiddleware,  createMultiple //es de otro controlador xd
)
.get(
  '/:id/documents',
  listByMemberRequest //es de otro controlador xd
)

.post("/:id/approve", authMiddleware, ctrl.approve)
.post("/:id/reject", authMiddleware, ctrl.reject)
.get("/:id/detail", authMiddleware, ctrl.getDetail)

.post(
  "/new-familiar",
  authMiddleware,
  ctrl.newFamiliar
)
  .get("/", authMiddleware, ctrl.getAll)
  .post("/newMemberRequest", authMiddleware, ctrl.createNew);

// router.get("/:id", ctrl.getOne);
// router.put("/:id", ctrl.update);
// router.delete("/:id", ctrl.remove);

export default router;
