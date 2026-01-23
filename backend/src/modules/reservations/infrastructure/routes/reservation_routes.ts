import { Hono } from 'hono';
import * as reservationController from '../controllers/reservation_controller';
import { authMiddleware } from '../../../../shared/middlewares/authMiddleware'; 
import { auditMiddleware } from '../../../../shared/middlewares/auditMiddleware'; 
const reservationRouterM = new Hono()
    .get('/', authMiddleware, reservationController.getAll)
    .get('/getCorreoByUserId/:id', authMiddleware, reservationController.getCorreoByUserId)
    .get('/getSpecialReservations/:id',authMiddleware, reservationController.getSpecialReservationsBySpaceId)
    .get('/:id', authMiddleware, reservationController.getOne)
    .post('/', authMiddleware,auditMiddleware("CREATE","reservation"), reservationController.create)
    .post('/createNew', reservationController.createNewReservationWithValidation)
    .post('/createSports',authMiddleware,auditMiddleware("CREATE","reservation"), reservationController.createNewSports)
    .post('/create', authMiddleware,auditMiddleware("CREATE","reservation"),reservationController.createNew)
    .put('/:id',authMiddleware,auditMiddleware("UPDATE","reservation"), reservationController.update)
    .delete('/:id',authMiddleware,auditMiddleware("DELETE","reservation"),reservationController.remove)
    
export default reservationRouterM;
