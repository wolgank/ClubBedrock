import { Hono } from "hono";
import * as academyController from "../controllers/academy_controller";
import { authMiddleware } from "../../../../shared/middlewares/authMiddleware";
const academyRouter = new Hono()
  .get("/", authMiddleware, academyController.getAll)
  .get('/reporteAcademias', authMiddleware, academyController.reporteAcademias)
  .get('/getInfo/:id', authMiddleware, academyController.getContactInfo)
  .get("/allBasicInfo", authMiddleware, academyController.getAllBasicAcademyInfo)
  .get("/all", authMiddleware, academyController.getAllAcademies)
  .get("/inscription/:id", authMiddleware, academyController.getAcademyInscriptionById)
  .get("/:id", authMiddleware, academyController.getOne)
  .get("/special/:id", authMiddleware, academyController.getOneSpecial)
  .put('/cancelInscription/:id', authMiddleware, academyController.CancelInscription)
  .post('/createAcademySolo', authMiddleware, academyController.createAcademySolo)
  .post('/new', authMiddleware, academyController.createNew)
  .post("/", authMiddleware, academyController.create)
  .put('/editAcademyById/:id', authMiddleware, academyController.editAcademyById)
  .put("/:id", authMiddleware, academyController.update)
  .delete("/cancel/:id", authMiddleware, academyController.deleteAcademyById)
  .delete("/:id", authMiddleware, academyController.remove)
  .get("/course/:id", authMiddleware, academyController.getAllCourses);
export default academyRouter;
