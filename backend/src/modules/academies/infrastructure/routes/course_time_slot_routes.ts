import { Hono } from "hono";
import * as courseTimeSlotController from "../controllers/course_time_slot_controller";
import { authMiddleware } from "../../../../shared/middlewares/authMiddleware";
const courseTimeSlotRouter = new Hono()
  .get("/", authMiddleware, courseTimeSlotController.getAll)
  .get("/:id", authMiddleware, courseTimeSlotController.getOne)
  .post("/", authMiddleware, courseTimeSlotController.create)
  .put("/:id", authMiddleware, courseTimeSlotController.update)
  .delete("/:id", authMiddleware, courseTimeSlotController.remove);

export default courseTimeSlotRouter;
