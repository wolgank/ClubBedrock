import { Hono } from 'hono';
import * as reservationInscriptionController from '../controllers/reservation_inscription_controller';
import { authMiddleware } from '../../../../shared/middlewares/authMiddleware';
const reservationInscriptionRouter = new Hono()
    .get('/', authMiddleware,reservationInscriptionController.getAll)
    .get('/reporteEspacioDeportivo', authMiddleware, reservationInscriptionController.reporteEspacioDeportivo)
    .get('/reporteEspacioLeisure', authMiddleware, reservationInscriptionController.reporteEspacioLeisure)
    .get('/getInfo/:id',authMiddleware, reservationInscriptionController.getInfoReservationInscriptionById)
    .get('/:id',authMiddleware, reservationInscriptionController.getOne)
    .put('/:id', authMiddleware,reservationInscriptionController.update)
    .delete('/:id',authMiddleware, reservationInscriptionController.remove)
export default reservationInscriptionRouter;
