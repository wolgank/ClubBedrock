// routes/event_routes.ts
import { Hono } from 'hono';
import * as eventController from '../controllers/event_controller';
import { authMiddleware } from '../../../../shared/middlewares/authMiddleware';
import { auditMiddleware } from '../../../../shared/middlewares/auditMiddleware';
const eventRouter = new Hono()
  .get('/', authMiddleware, eventController.getAll)
  .get('/reporteEventos', authMiddleware, eventController.reporteEventos)
  .get('/allInscription/:id',authMiddleware, eventController.getAllInscriptions)
  .get('/filter',authMiddleware, eventController.getFilterPaginated)
  .get('/all',authMiddleware, eventController.getAll)
  .get('/spaceInfo',authMiddleware, eventController.getAllEventSpace)
  .get('/:id',authMiddleware, eventController.getOne)
  .get('/info/:id',authMiddleware, eventController.getInfoEventInscription)
  .post('/new',authMiddleware,auditMiddleware("CREATE","event"),eventController.createNewEvent)
  .post('/',authMiddleware,auditMiddleware("CREATE", "event"),eventController.create)
  .put('/:id',authMiddleware,auditMiddleware("UPDATE", "event"),eventController.update)
  .put('/editEvent/:id',authMiddleware,auditMiddleware("UPDATE", "event"), eventController.editEvent)
  .delete('/deleteEvent/:id',authMiddleware,auditMiddleware("LOGICAL_DELETE", "event"),eventController.removeEvent)
  .delete('/:id',authMiddleware,auditMiddleware("DELETE", "event"),eventController.remove)
export default eventRouter;
