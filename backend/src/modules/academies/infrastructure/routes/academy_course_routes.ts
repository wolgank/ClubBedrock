import { Hono } from "hono";
import * as academyCourseController from "../controllers/academy_course_controller";
import { authMiddleware } from "../../../../shared/middlewares/authMiddleware";
const academyCourseRouter = new Hono()
  .get("/", authMiddleware, academyCourseController.getAll)
  .get("/:id", authMiddleware, academyCourseController.getOne)
  .get("/getCoursesByAcademyId/:id", authMiddleware, academyCourseController.getCoursesByAcademyId)
  .post("/", authMiddleware, academyCourseController.create)
  .post("/addCoursesByAcademyId", authMiddleware, academyCourseController.addCoursesByAcademyId)
  .put("/editCourseById", authMiddleware, academyCourseController.editCourseById)
  .put("/removeCourse/:id", authMiddleware, academyCourseController.removeCourse)
  .put("/:id", authMiddleware, academyCourseController.update)
  .delete("/:id", authMiddleware, academyCourseController.remove)
  .post("/createCourseTimeSlot", authMiddleware, academyCourseController.createCourseTimeSlot)
  .delete(
    "/deleteCourseWithReservations/:id", authMiddleware,
    academyCourseController.deleteCourseWithReservations
  )
  .put(
    "/updateCourseWithReservations/:id", authMiddleware, academyCourseController.updateCourseWithReservations)
  .get("/courseWithReservationsDetail/:id", authMiddleware, academyCourseController.getCourseWithDetailsSimple)
  .get("/pricing/:id", authMiddleware, academyCourseController.getCoursePricing)
  .get("/timeSlot/:id", authMiddleware, academyCourseController.getTimeSlotsByCourseId)
  .get("/courseDayInscription/:id", authMiddleware, academyCourseController.getCourseContDay);
export default academyCourseRouter;
