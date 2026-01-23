// routes/event_routes.ts
import { Hono } from 'hono';
import * as eventController from '../controllers/notifications_controller';
import { authMiddleware } from '../../../../shared/middlewares/authMiddleware';

const notificationRouter = new Hono()
  .post('/', authMiddleware, eventController.notificacionHandler)
  export default notificationRouter;