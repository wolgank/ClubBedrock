// routes/membership_routes.ts
import { Hono } from "hono";
import * as membershipController from "../controllers/membership_controller";
import { authMiddleware } from "../../../../shared/middlewares/authMiddleware";
const membershipRouter = new Hono()

  .get("/", authMiddleware, membershipController.getAll)
  .get("/:id", membershipController.getOne)
  .post("/", membershipController.create)
  .put("/:id", membershipController.update)
  .delete("/:id", membershipController.remove);

export default membershipRouter;
