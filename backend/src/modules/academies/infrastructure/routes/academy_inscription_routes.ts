import { Hono } from "hono";
import * as academyInscriptionController from "../controllers/academy_inscription_controller";
import { authMiddleware } from "../../../../shared/middlewares/authMiddleware";
const academyInscriptionRouter = new Hono()
  .post('/', authMiddleware, academyInscriptionController.createInscription)
  .get("/", authMiddleware, academyInscriptionController.getAll)
  .get("/:id", authMiddleware, academyInscriptionController.getOne)
  .post("/", authMiddleware, academyInscriptionController.create)
  .put("/:id", authMiddleware, academyInscriptionController.update)
  .post("/removeInscription", authMiddleware, academyInscriptionController.removeInscription)
  .post("/check", authMiddleware, academyInscriptionController.check)
  .post("/inscriptions", authMiddleware, academyInscriptionController.inscriptions)
  .get("/historicUserId/:id", authMiddleware, academyInscriptionController.getHistoricUserId);
export default academyInscriptionRouter;
