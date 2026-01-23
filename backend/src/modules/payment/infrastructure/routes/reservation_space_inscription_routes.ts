import { Hono } from 'hono';
import * as reservationInscriptionController from '../../../payment/infrastructure/controllers/reservation_space_inscription_controller';
import { authMiddleware } from '../../../../shared/middlewares/authMiddleware'; 
const reservationSpaceInscriptionRouter = new Hono()
    .post('/', reservationInscriptionController.createInscription)

export default reservationSpaceInscriptionRouter;
