// routes/member_application_routes.ts
import { Hono } from "hono";
import * as ctrl from "../controllers/membership_application_controller";
import { authMiddleware } from "../../../../shared/middlewares/authMiddleware";

const router = new Hono()

  .get("/all", authMiddleware, ctrl.getAll)
  .post("/newMemberApplication", authMiddleware, ctrl.createNew)
  .get("/", authMiddleware, ctrl.getMembershipApplications)
  .get("/:id/detail", authMiddleware, ctrl.getDetail)
  .post("/:id/approve", authMiddleware, ctrl.approve)
  .post("/:id/reject", authMiddleware, ctrl.reject)
  .get("/exists", authMiddleware, ctrl.checkExisting);

export default router;
