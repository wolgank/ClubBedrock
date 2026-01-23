import { Hono } from 'hono';
import * as spaceController from '../../../reservations/infrastructure/controllers/space_controller';
import { authMiddleware } from '../../../../shared/middlewares/authMiddleware';
import { auditMiddleware } from '../../../../shared/middlewares/auditMiddleware';
const spaceRouterM = new Hono()

    .get('/', authMiddleware, spaceController.getAll)
    .get('/getLeisureSpaces', authMiddleware, spaceController.getAllLeisure)
    .get('/getSportsSpaces', authMiddleware, spaceController.getAllSports)
    .get('/:id', authMiddleware, spaceController.getOne)
    .get('/type/:type', authMiddleware, spaceController.getByType)
    .get('/spaceReservation/:id', authMiddleware, spaceController.getReservationsBySpaceId)
    .post('/', authMiddleware,auditMiddleware("CREATE","space"), spaceController.create)
    .post('/create', authMiddleware,auditMiddleware("CREATE","space"), spaceController.createNewSpace)
    .delete('/:id', authMiddleware,auditMiddleware("DELETE","space"), spaceController.remove)
    .put('/:id', authMiddleware,auditMiddleware("UPDATE","space"), spaceController.update)

export default spaceRouterM;
