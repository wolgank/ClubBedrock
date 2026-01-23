// routes/member_routes.ts
import { Hono } from "hono";
import * as ctrl from "../controllers/member_controller";
import { authMiddleware } from "../../../../shared/middlewares/authMiddleware";

const router = new Hono()

.get('/moras', authMiddleware, ctrl.listMembersWithMoras)
.get("/familiars", authMiddleware, ctrl.listOtherFamilyMembers)
.get(
  "/by-type",
  authMiddleware,
  ctrl.findByTypeController
)
  .get("/membership-overview", authMiddleware, ctrl.getOverview)
  .get("/first-payment", authMiddleware, ctrl.checkFirstPayment)
  .get("/", authMiddleware, ctrl.getAll)
  .get("/:id", authMiddleware, ctrl.getOne)
  .post("/", authMiddleware, ctrl.create)
  .put("/:id", authMiddleware, ctrl.update)
  .delete("/:id", authMiddleware, ctrl.remove)
  .get("/search/titular", authMiddleware, ctrl.searchTitular)
  .get("/myType/:id", authMiddleware, ctrl.getType);
export default router;
