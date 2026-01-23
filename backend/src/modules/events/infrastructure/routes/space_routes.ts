import { Hono } from "hono";
import * as spaceController from "../controllers/space_controller";
//import { authMiddleware } from '../../../../shared/middlewares/authMiddleware';

const spaceRouter = new Hono()

  //spaceRouter.get('/', authMiddleware, spaceController.getAll);
  .get("/", spaceController.getAll)
  .get("/:id", spaceController.getOne)
  .post("/", spaceController.create)
  .put("/:id", spaceController.update)
  .put("/:id", spaceController.updateSpaceAvailabilityStatus);

export default spaceRouter;
