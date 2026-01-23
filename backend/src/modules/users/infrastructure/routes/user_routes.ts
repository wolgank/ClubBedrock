// routes/user_routes.ts
import { Hono } from "hono";
import * as ctrl from "../controllers/user_controller";
import { authMiddleware } from "../../../../shared/middlewares/authMiddleware";


const userRouter = new Hono()

  .post('/bulk-upload',authMiddleware, ctrl.bulkUploadHandler)
  .get('/by-membership-application/:id',authMiddleware,ctrl.getAccountByMembershipApplication)
  .get("/", authMiddleware, ctrl.getAll)
  .get("/:id", authMiddleware, ctrl.getOne)
  .post("/", authMiddleware, ctrl.create)
  .put("/:id", authMiddleware, ctrl.update)
  .delete("/:id", authMiddleware, ctrl.remove);

export default userRouter;
