// routes/employee_routes.ts
import { Hono } from "hono";
import * as ctrl from "../controllers/employee_controller";
import { authMiddleware } from "../../../../shared/middlewares/authMiddleware";

const employeeRouter = new Hono()
  .get("/", authMiddleware, ctrl.getAll)
  .get("/:id", authMiddleware, ctrl.getOne)
  .post("/", authMiddleware, ctrl.create)
  .put("/:id", authMiddleware, ctrl.update)
  .delete("/:id", authMiddleware, ctrl.remove);

export default employeeRouter;
