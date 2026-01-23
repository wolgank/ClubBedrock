import { Hono } from "hono";
import * as reservationController from "../controllers/reservation_controller";
import { authMiddleware } from '../../../../shared/middlewares/authMiddleware'; 

const reservationRouter = new Hono()
  //reservationRouter.get('/', authMiddleware, reservationController.getAll);
  .get("/", authMiddleware, reservationController.getAll)
  .get("/:id", authMiddleware, reservationController.getOne)
  .post("/",authMiddleware,  reservationController.create)
  .put("/:id",authMiddleware,  reservationController.update)
  .delete("/:id", authMiddleware, reservationController.remove);

export default reservationRouter;
