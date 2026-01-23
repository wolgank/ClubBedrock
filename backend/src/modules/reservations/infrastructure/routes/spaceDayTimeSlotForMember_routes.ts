import { Hono } from 'hono';
import * as spaceDayTimeSlotForMemberController from '../../../reservations/infrastructure/controllers/spaceDayTimeSlotForMember_controller';
import { authMiddleware } from '../../../../shared/middlewares/authMiddleware';
import { auditMiddleware } from '../../../../shared/middlewares/auditMiddleware';
const spaceDayTimeSlotForMemberRouter = new Hono()
    .get('/', authMiddleware, spaceDayTimeSlotForMemberController.getAll)
    .get('/getSpaceTimeById', authMiddleware, spaceDayTimeSlotForMemberController.getTimeSlotDaySpaceIdDouble)
    .get('/getSpaceTime', authMiddleware, spaceDayTimeSlotForMemberController.getTimeSlotDaySpaceId)
    .get('/noGetSpaceTimeById', authMiddleware, spaceDayTimeSlotForMemberController.getNoTimeSlotDaySpaceId)
    .get('/getSpaceTimeALL',authMiddleware, spaceDayTimeSlotForMemberController.getTimeSlotDaySpaceIdALL)
    .get('/:id', authMiddleware, spaceDayTimeSlotForMemberController.getOne)
    .post('/', authMiddleware, spaceDayTimeSlotForMemberController.create)
    .post('/crearHorariosDisnponibles', authMiddleware, spaceDayTimeSlotForMemberController.crearHorariosController)
    .post('/available',authMiddleware,auditMiddleware("CREATE","space_day_time_slot_for_member"), spaceDayTimeSlotForMemberController.createTwo)
    .post('/createArray', authMiddleware, spaceDayTimeSlotForMemberController.createArray)
    .put('/:id', authMiddleware, spaceDayTimeSlotForMemberController.update)
    .delete('/:id',authMiddleware,auditMiddleware("DELETE","space_day_time_slot_for_member"), spaceDayTimeSlotForMemberController.remove)
export default spaceDayTimeSlotForMemberRouter;
