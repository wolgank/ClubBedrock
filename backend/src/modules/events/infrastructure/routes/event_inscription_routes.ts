// routes/event_routes.ts
import { Hono } from 'hono';
import * as eventInscriptionController from '../controllers/event_inscription_controller';
import { authMiddleware } from '../../../../shared/middlewares/authMiddleware';
const eventInscriptionRouter = new Hono()
    .post('/', authMiddleware, eventInscriptionController.createInscription)
    .get('/', authMiddleware, eventInscriptionController.getAll)
    .get('/:id', authMiddleware, eventInscriptionController.getOne)
    .post('/', authMiddleware, eventInscriptionController.create)
    .put('/cancelInscription/:id', authMiddleware, eventInscriptionController.cancelEventInscriptionById)
    .put('/:id', authMiddleware, eventInscriptionController.update)
    .delete('/:id', authMiddleware, eventInscriptionController.remove)
    // isUserInscribedInEventByUserId
    .post('/check', authMiddleware, eventInscriptionController.check)
    .post("/removeInscription", authMiddleware, eventInscriptionController.removeInscription)
    .get("/historicUserId/:id", authMiddleware, eventInscriptionController.getHistoricUserId);
export default eventInscriptionRouter;





